
// Vars to store puzzle shape and state
rows = 0;
cols = 0;
active_row = 0;
active_col = 0;
nav_direction = "HORIZONTAL"; // ["HORIZONTAL", "VERTICAL"]
advance = 0;
puzzle = [];
letters = [];
mode = "EDIT"; // ["EDIT", "SOLVE"]
mirror_mode = "NONE"; // ["HORIZ", "VERT", "FLIP", "NONE"]
game_id = "";


$(document).ready(function(){

    // Load start menu buttons
    loadViewConfig();

});


function loadViewConfig() {

    // Hide start menu
    $("#start-menu").css("display", "none");

    // Show puzzle editor and config options
    $("#puzzle-config").css("display", "flex");
    $("#puzzle-editor").css("display", "block");
    $("#puzzle-config-blurb").css("display", "flex");

    // Add event handlers to toggle buttons - activate "flip" mode by default
    $(".toggle-button").click(handleMirrorButtonClick);
    handleMirrorButtonClick.call( $("#toggle-mirror-flip")[0] );

    // Event handler for adjusting puzzle dimensions
    $('.input-rc').on('blur', refreshPuzzleDims);

    // Add event handler for ready button
    $("#puzzle-config-finish-button").click(handleFinishConfigClicked);

    // Switch to edit mode
    mode = "EDIT";

    // Refresh puzzle dimensions and render
    refreshPuzzleDims();

}

function loadViewSolve() {

    // Adjust visibility of components
    $("#start-menu").css("display", "none");
    $("#puzzle-config").css("display", "none");
    $("#puzzle-editor").css("display", "block");
    $("#puzzle-config-blurb").css("display", "none");

    // Switch to "Solve" mode and re-render puzzle
    mode = "SOLVE";
    renderPuzzle();

}


function handleFinishConfigClicked() {

    // Adjust component visibility
    loadViewSolve();

    // Make "letters" array match the puzzle layout
    letters = JSON.parse(JSON.stringify(puzzle));
    for (r in letters) {
        for (c in letters[r]) {
            if (puzzle[r][c] == 1) {
                letters[r][c] = "_";
            }
            else {
                letters[r][c] = "-";
            }
        }
    }

    // Notify server that new game was created
    $.post("/newgame", JSON.stringify({"puzzle": puzzle, "letters": letters}), function(data) {
        game_id = data.game_id;
    });

}


function applyLetters() {

    // Iterate over each cell in the puzzle
    for (r in letters){
        for (c in letters[r]) {

            // If there's a valid letter in the table, update corresponding cell
            letter = letters[r][c];
            if (letter.toLowerCase() != letter.toUpperCase()) {
                $("#puzzle-textbox-num-" + r + "-" + c).val(letter.toUpperCase())
            }
        }
    }
}

function toggleNavDirection() {
    if (nav_direction == "HORIZONTAL") {
        nav_direction = "VERTICAL";
    }
    else {
        nav_direction = "HORIZONTAL";
    }
}

function handleEditHoverIn() {

    $(this).css("background-color", "rgb(160,160,160)");

}

function handleEditHoverOut() {
    if ($(this).hasClass("black-square")) {
        $(this).css("background-color", "rgb(0,0,0)");
    } else {
        $(this).css("background-color", "rgb(255,255,255)");
    }
}

function handleEditToggle() {

    // Get cell row and column
    cell_id = $(this).attr("id").split("-");
    cell_row = parseInt(cell_id[3]);
    cell_col = parseInt(cell_id[4]);

    // Update clicked cell
    var status = puzzle[cell_row][cell_col];
    if (status == 0) {
        status = 1;
    } else {
        status = 0;
    }
    puzzle[cell_row][cell_col] = status;

    // Apply mirror and flip effects
    if (mirror_mode == "HORIZ") {
        puzzle[rows - cell_row - 1][cell_col] = status;
    } else if (mirror_mode == "VERT") {
        puzzle[cell_row][cols - cell_col - 1] = status;
    } else if (mirror_mode == "FLIP") {
        puzzle[rows - cell_row - 1][cols - cell_col - 1] = status;
    }

    // Redraw puzzle with changes
    renderPuzzle();

}

function handleMirrorButtonClick() {

    // Reset the coloration of the toggle buttons
    $(".toggle-button").css("border", "1px solid white");
    $(".toggle-button").css("background-color", "rgb(255,255,255)");

    // Check which button was clicked
    cell_id = $(this).attr("id");

    // Update the current mirror mode
    if (cell_id == "toggle-mirror-vertical") {

        // If this mode is active, turn it off
        if (mirror_mode == "VERT") {
            mirror_mode = "NONE";
        }
        else {

            // Color the toggle button
            $("#toggle-mirror-vertical").css("border", "1px solid green");
            $("#toggle-mirror-vertical").css("background-color", "rgb(245,255,250)");

            // Turn vert mode on
            mirror_mode = "VERT";

            // Mirror everything currently on the left half of the puzzle
            for (r=0; r < rows; r++) {
                for (c=0; c < cols/2; c++) {
                    puzzle[r][cols - c - 1] = puzzle[r][c];
                }
            }
        }
    }
    else if (cell_id == "toggle-mirror-horizontal") {

        // If this mode is active, turn it off
        if (mirror_mode == "HORIZ") {
            mirror_mode = "NONE";
        }
        else {

            // Color the toggle button
            $("#toggle-mirror-horizontal").css("border", "1px solid green");
            $("#toggle-mirror-horizontal").css("background-color", "rgb(245,255,250)");

            // Turn horizontal mirroring on
            mirror_mode = "HORIZ";

            // Mirror everything currently in the top half of the puzzle
            for (r=0; r < rows/2; r++) {
                for (c=0; c < cols; c++) {
                    puzzle[rows - r - 1][c] = puzzle[r][c];
                }
            }
        }
    }
    else if (cell_id == "toggle-mirror-flip") {

        // If this mode is active, turn it off
        if (mirror_mode == "FLIP") {
            mirror_mode = "NONE";
        }
        else {

            // Color the toggle button
            $("#toggle-mirror-flip").css("border", "1px solid green");
            $("#toggle-mirror-flip").css("background-color", "rgb(245,255,250)");

            // Turn on mirror and flip mode
            mirror_mode = "FLIP";

            // Mirror and flip everything currently in the left half of the puzzle
            for (r=0; r < rows; r++) {
                for (c=0; c < cols/2; c++) {
                    puzzle[rows - r - 1][cols - c - 1] = puzzle[r][c];
                }
            }
        }
    }

    // Render the updated puzzle
    renderPuzzle();

}


function refreshPuzzleDims() {

    // Read puzzle dimensions
    rows = parseInt($("#input-rows").val())
    cols = parseInt($("#input-cols").val())

    // Limit to 50 rows or columns
    if (rows > 40) {
        rows = 40;
        $("#input-rows").val("40");
    }
    if (cols > 40) {
        cols = 40;
        $("#input-cols").val("40");
    }

    // Add or remove rows if necessary
    while (puzzle.length < rows) {
        puzzle.push(new Array(cols).fill(1));
    }
    puzzle.length = rows;

    // Add or remove cols if necessary
    for (i=0; i<puzzle.length; i++) {
        if (puzzle[i].length < cols) {
            puzzle[i] = puzzle[i].concat(new Array(cols - puzzle[i].length).fill(1));
        }
        puzzle[i].length = cols;
    }

    // Render the puzzle with the new dimensions
    renderPuzzle();

}

function renderPuzzle() {

    // Clear the puzzle so we can re-draw
    $("#puzzle-editor").empty();
    clue_count = 1;

    // Build table to represent puzzle
    for (r = 0; r < rows; r++) {

        // Add new row
        new_row = $("<tr></tr>").addClass("puzzle-row").attr("id", "puzzle-row-num-" + r);

        // Add columns to the row
        for (c = 0; c < cols; c++){

            // Add new column
            new_cell = $("<td></td>").addClass("puzzle-cell").attr("id", "puzzle-cell-num-" + r + "-" + c);

            // Check cell type from array
            if (puzzle[r][c] == 0) {
                new_cell.addClass("black-square");
                new_cell.attr("id", "puzzle-cell-num-" + r + "-" + c);
            }
            else {

                new_cell.addClass("white-square");
                new_cell.attr("id", "puzzle-cell-num-" + r + "-" + c);

                // Add number if cell starts a word
                if ((r == 0) || (c == 0) || (puzzle[r-1][c] == 0) || (puzzle[r][c-1] == 0)) {
                    new_cell_label = $("<div>" + clue_count + "</div>");
                    new_cell_label.addClass("puzzle-textbox-label");
                    new_cell.append(new_cell_label);
                    clue_count = clue_count + 1;
                }

                new_textbox = $("<input></input>").attr("type", "text").attr("maxlength", "1");
                new_textbox.addClass("puzzle-textbox");
                new_textbox.attr("id", "puzzle-textbox-num-" + r + "-" + c);
                new_cell.append(new_textbox);
            }

            // Add cell to row
            new_row.append(new_cell);

        }

        // Add row to column
        $("#puzzle-editor").append(new_row);
    }

    // When switching to solve mode, activate handlers
    if (mode == "SOLVE") {

        // Listen for arrow key navigation
        highlightActiveCell();

        // Add event handlers
        $(".puzzle-textbox").on("input", handleAdvancing);
        $(".puzzle-textbox").keydown(handleKeyDown);
        $(".puzzle-textbox").click(handleCellClick);

    } else if (mode == "EDIT") {

        // Activate handlers for editor features
        $(".puzzle-cell").hover(handleEditHoverIn, handleEditHoverOut);
        $(".puzzle-cell").click(handleEditToggle);
        $(".puzzle-cell").css("cursor", "pointer");
    }
}

function handleCellClick() {

    // Get cell row and column
    cell_id = $(this).attr("id").split("-");
    cell_row = parseInt(cell_id[3]);
    cell_col = parseInt(cell_id[4]);

    // If clicked on cell is already active, toggle nav direction
    if (cell_row == active_row && cell_col == active_col) {
        toggleNavDirection();
    }
    else {
        active_row = cell_row;
        active_col = cell_col;
    }

    // Update highlighting
    highlightActiveCell();

}

function handleAdvancing() {

    // Advance active cell
    if (nav_direction == "HORIZONTAL") {
        active_col = (active_col + cols + (1 * advance)) % cols;
        while ($("#puzzle-cell-num-" + active_row + "-" + active_col).hasClass("black-square")) {
            active_col = (active_col + cols + (1 * advance)) % cols;
        }
    }
    else {
        active_row = (active_row + rows + (1 * advance)) % rows;
        while ($("#puzzle-cell-num-" + active_row + "-" + active_col).hasClass("black-square")) {
            active_row = (active_row + rows + (1 * advance)) % rows;
        }
    }

    // Update highlighting
    highlightActiveCell();
}

function handleKeyDown(e) {

    advance = 0;

    // Left arrow
    if (e.which == 37) {
        active_col = (active_col + cols - 1) % cols;
        while ($("#puzzle-cell-num-" + active_row + "-" + active_col).hasClass("black-square")) {
            active_col = (active_col + cols - 1) % cols;
        }
    }

    // Up arrow
    else if (e.which == 38) {
        active_row = (active_row + rows - 1) % rows;
        while ($("#puzzle-cell-num-" + active_row + "-" + active_col).hasClass("black-square")) {
            active_row = (active_row + rows - 1) % rows;
        }
    }

    // Right arrow
    else if (e.which == 39) {
        active_col = (active_col + cols + 1) % cols;
        while ($("#puzzle-cell-num-" + active_row + "-" + active_col).hasClass("black-square")) {
            active_col = (active_col + cols + 1) % cols;
        }
    }

    // Down arrow
    else if (e.which == 40) {
        active_row = (active_row + rows + 1) % rows;
        while ($("#puzzle-cell-num-" + active_row + "-" + active_col).hasClass("black-square")) {
            active_row = (active_row + rows + 1) % rows;
        }
    }

    // Toggle direction keys (tab, space, alt, ctrl)
    else if ([9, 17, 18, 32].includes(e.which)) {
        toggleNavDirection();
    }

    // Alphabetical character
    else if (((e.which >= 65) && (e.which <= 90)) || ((e.which >= 97) && (e.which <= 122))) {
        $(this).val("");
        char = String.fromCharCode(e.which);
        letters[active_row][active_col] = char
        advance = 1;
        postCellUpdate(active_row, active_col, char);
    }

    // Backspace
    else if (e.which == 8) {
        $(this).val("");
        letters[active_row][active_col] = "_";
        advance = -1;
        postCellUpdate(active_row, active_col, "_");
    }

    // Otherwise, ignore keypress
    else {
        e.preventDefault();
    }

    // Refresh active cell
    highlightActiveCell();
}

function highlightActiveCell() {

    // Reset all squares
    $(".white-square").css("background-color", "rgb(255,255,255)");

    // Shade all cells for the current word
    dirs = [-1, 1];
    for (i in dirs) {
        row = active_row;
        col = active_col;
        while ((row < rows) && (row >= 0) && (col < cols) && (col >= 0) && $("#puzzle-cell-num-" + row + "-" + col).hasClass("white-square")) {
            $("#puzzle-cell-num-" + row + "-" + col).css("background-color", "rgb(255,255,220)");
            if (nav_direction == "HORIZONTAL") {
                col = col + (1 * dirs[i]);
            }
            else {
                row = row + (1 * dirs[i]);
            }
        }
    }

    // Highlight the current cell and move the focus to it
    $("#puzzle-cell-num-" + active_row + "-" + active_col).css("background-color", "rgb(220,220,255)");
    $("#puzzle-textbox-num-" + active_row + "-" + active_col).focus();
}
