# Imports
from PIL import Image, ImageOps
import cv2
import numpy as np
import json
from flask import *

# Initialize flask app
app = Flask(__name__)


def extract_crossword(pil_image, rendered_height, corner_coords):
  '''

  Helper function to handle image processing - extracts the crossword
  data from the image and returns a JSON containing the row count, 
  column count, and a 2D array indicating black/white puzzle cells

  '''

    # Do this so image is properly rotated
    pil_image = ImageOps.exif_transpose(pil_image)

    # Get the image as a numpy array
    img = np.array(pil_image)

    # Scale corner coordinates
    scale_factor = img.shape[0] / rendered_height
    corner_src = np.float32(corner_coords) * scale_factor

    # Coordinates of corners after perspective shift
    out_width, out_height = (400, 400)
    corner_dst = np.float32([
        [0, 0],
        [out_width, 0],
        [out_width, out_height],
        [0, out_height]
    ])

    # Perform perspective shift
    transform_mat = cv2.getPerspectiveTransform(corner_src, corner_dst)
    img_unskewed = cv2.warpPerspective(img, transform_mat, (out_width, out_height))

    # Convert image grayscale
    img_gray = cv2.cvtColor(img_unskewed, cv2.COLOR_BGR2GRAY)

    # Scale the values so the min is 0 and the max is 255 (this should help with poor
    # lighting causing extra cells to be classified as black)
    min_val, max_val = np.min(img_gray), np.max(img_gray)
    img_gray = (img_gray - min_val) * (255 / (max_val - min_val))
    img_gray = np.clip(img_gray, 0, 255)

    # Now apply threshold to convert to black and white
    ret, img_bw = cv2.threshold(img_gray, 150, 255, cv2.THRESH_BINARY)

    # Reduce noise (lines, numbers) using dilation and erosion
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    img_clean = cv2.dilate(img_bw, kernel, iterations=4)
    img_clean = cv2.erode(img_clean, kernel, iterations=4)

    # Estimate the dimensions & square size (in pixels) for the puzzle
    best = [128.0, 128.0]  # score should always be lower than this
    dims = [0, 0]
    for i in range(10, 30):

        # Width of each column in pixels
        step_size = img_clean.shape[0] / float(i)

        # Avg 'error' for each row / col (more uniformly black or uniformly white
        # will result in a lower column score)
        row_scores = []
        col_scores = []

        # Compute score for each row/column
        for c in range(i):

            # Extract cells - currently checking 3 random rows/cols from image
            row_cells = img_clean[10:390, int(c * step_size): int((c + 1) * step_size)]
            col_cells = img_clean[int(c * step_size): int((c + 1) * step_size), 10:390]

            # Get the average cell value, compute the difference between this and 0 / 255
            row_avgs = np.mean(row_cells, axis=1)
            row_avgs = np.minimum(row_avgs, 255-row_avgs)
            row_score = np.mean(row_avgs)

            col_avgs = np.mean(col_cells, axis=0)
            col_avgs = np.minimum(col_avgs, 255 - col_avgs)
            col_score = np.mean(col_avgs)

            row_scores += [row_score]
            col_scores += [col_score]

        # Check if this is the lowest score so far
        row_score_avg = sum(row_scores) / i
        col_score_avg = sum(col_scores) / i

        if row_score_avg < best[0]:
            best[0] = row_score_avg
            dims[0] = i

        if col_score_avg < best[1]:
            best[1] = col_score_avg
            dims[1] = i

    # Compute pixel size of each row and column
    row_size = img_clean.shape[0] / dims[0]
    col_size = img_clean.shape[1] / dims[1]

    # Build matrix for storing result
    puzzle = [[0 for _ in range(dims[1])] for _ in range(dims[0])]

    # Apply kernel to compute average value around cell-centers
    kernel = np.ones((3, 3), np.float32) / (3 ** 2)
    img_local_avg = cv2.filter2D(img_clean, -1, kernel)

    # Classify each cell as black or white
    for r in range(dims[0]):
        for c in range(dims[1]):

            # Get the coordinates of the center of the square
            r_idx = int(r * row_size + (row_size / 2))
            c_idx = int(c * col_size + (col_size / 2))

            # Classify as black or white
            puzzle[r][c] = 0 if img_local_avg[r_idx, c_idx] < 127 else 1

    return {
        "rows": dims[0],
        "cols": dims[1],
        "puzzle": puzzle
    }


@app.route('/crossword-from-image', methods=['POST'])
def crossword_from_image():
    """

    Requests to the Cloud Functions endpoint are routed to this handler function.
    The function first attempts to read the image data from the request, followed
    by the expected JSON data. If these are successful, it calls the extract_crossword
    helper function, which uses image processing to get the puzzle configuration from
    the image.

    The function expects a POST request containing form data with 2 fields:
    > 'image' which is an image file to read the crossword from
    > 'data' which contains the rendered height of the image in the browser, as well
      as the coordinates of the corners of the crossword in the image (stored in a stringified
      JSON object)

    """

    # Extract image from request, convert to numpy array
    try:
        file = request.files['image']
        pil_image = Image.open(file.stream)
    except:
        return {
            "success": False,
            "errorString": "Failed attempting to read image"
        }, 500

    # Extract the JSON data from the request
    try:
        data = request.form.get('data')  # Get the additional data from the request
        data = json.loads(data)
        rendered_height = data["renderedHeight"]
        corner_coords = data["cornerCoords"]
    except:
        print("Failed attempting to read JSON")
        return {
            "success": False,
            "errorString": "Failed attempting to read JSON data"
        }, 500

    # Get puzzle dimensions and
    try:
        crossword_data = extract_crossword(pil_image, rendered_height, corner_coords)
    except:
        print("An error occurred during crossword image processing")
        return {
            "success": False,
            "errorString": "Failed extracting crossword data from image"
        }, 500

    # Send success response

    response_data = {
        "success": True,
        "rows": crossword_data["rows"],
        "cols": crossword_data["cols"],
        "puzzle": crossword_data["puzzle"]
    }

    return response_data


# Run locally
if __name__ == "__main__":
    app.run(debug=True)