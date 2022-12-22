
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
cursor_mode = "BLACK"  // ["BLACK", "CIRCLE", "COLOR", "MUTLI"]

// Vars for tracking circled cells
circles = [];

// Vars for tracking manually highlighted cells
highlights = [];
highlight_colors = ["R", "O", "Y", "G", "B", "I", "V"];
selected_color_index = 0;
selected_color = "R";

// Vars for tracking multi-letter cells
multiletters = []
selected_multi_num = 2;


$(document).ready(function(){

    // Load start menu buttons
    loadViewConfig();

    // Add event handlers to toggle buttons
    $(".toggle-button").click(handleMirrorButtonClick);

    // Start with the mirror & flip mode active
    handleMirrorButtonClick.call( $("#toggle-mirror-flip")[0] );

    // Add event handlers to the cursor mode buttons
    $(".cursor-mode-button").click(handleCursorModeClick);
    $("#cursor-mode-highlight-icon").click(handleHighlightColorClick);
    $("#cursor-mode-multi-icon").click(handleMultiIconClick);

    // Event handler for adjusting puzzle dimensions
    $('.input-rc').on('blur', refreshPuzzleDims);

});


function loadViewConfig() {

    // Hide start menu
    $("#start-menu").css("display", "none");

    // Show puzzle editor and config options
    $("#puzzle-config").css("display", "flex");
    $("#puzzle-editor").css("display", "block");
    $("#cursor-mode-panel").css("display", "flex");

    // Set text of mode button to SOLVE and set the click handler
    $("#puzzle-config-finish-button").text("SOLVE");
    $("#puzzle-config-finish-button").click(loadViewSolve);
    $("#puzzle-config-blurb-text").text("Click 'Solve' when finished setting up the puzzle. You can return to setup mode later if you want to.");

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
    $("#cursor-mode-panel").css("display", "none");

    // Set text of mode button to SETUP and set the click handler
    $("#puzzle-config-finish-button").text("SETUP");
    $("#puzzle-config-finish-button").off("click");
    $("#puzzle-config-finish-button").click(loadViewConfig);
    $("#puzzle-config-blurb-text").text("Click 'Setup' if you want to change the layout, highlighting, circles, etc. Your progress will be saved");


    // Switch to "Solve" mode and re-render puzzle
    mode = "SOLVE";
    renderPuzzle();

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

function handleEditCell() {

    // Get cell row and column
    cell_id = $(this).attr("id").split("-");
    cell_row = parseInt(cell_id[3]);
    cell_col = parseInt(cell_id[4]);

    if (cursor_mode == "BLACK") {

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

    } else if (cursor_mode == "CIRCLE") {

        var status = circles[cell_row][cell_col];
        if (status == 0) {
            status = 1;
        } else {
            status = 0;
        }
        circles[cell_row][cell_col] = status;

    } else if (cursor_mode == "HIGHLIGHT") {

        var status = highlights[cell_row][cell_col];

        if (status == selected_color) {
            status = "";
        } else {
            status = selected_color;
        }
        highlights[cell_row][cell_col] = status;

    } else if (cursor_mode == "MULTI") {

        var status = multiletters[cell_row][cell_col];

        if (status == selected_multi_num) {
            status = 1;
        } else {
            status = selected_multi_num;
        }
        multiletters[cell_row][cell_col] = status;

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
        letters.push(new Array(cols).fill("-"));
        circles.push(new Array(cols).fill(0));
        highlights.push(new Array(cols).fill(""));
        multiletters.push(new Array(cols).fill(1));
    }
    puzzle.length = rows;
    letters.length = rows
    circles.length = rows;
    highlights.length = rows;
    multiletters.length = rows;

    // Add or remove cols if necessary
    for (i=0; i<puzzle.length; i++) {
        if (puzzle[i].length < cols) {
            puzzle[i] = puzzle[i].concat(new Array(cols - puzzle[i].length).fill(1));
            letters[i] = letters[i].concat(new Array(cols - puzzle[i].length).fill("-"));
            circles[i] = circles[i].concat(new Array(cols - circles[i].length).fill(0));
            highlights[i] = highlights[i].concat(new Array(cols - highlights[i].length).fill(""));
            multiletters[i] = multiletters[i].concat(new Array(cols - multiletters[i].length).fill(1));
        }
        puzzle[i].length = cols;
        letters[i].length = cols;
        circles[i].length = cols;
        highlights[i].length = cols;
        multiletters[i].length = cols;
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

                // Add circle if cell was assigned a circle
                if (circles[r][c] == 1) {

                    // SVG tag
                    new_cell_circle_svg = $("<svg></svg>").attr("viewBox", "0 0 25 25").attr("xmlns", "http://www.w3.org/2000/svg");
                    new_cell_circle_svg.addClass("cell-circle-svg");

                    // Circle tag inside the svg
                    new_cell_circle = $("<circle></circle>").attr("cx", "12.5").attr("cy", "12.5").attr("r", "12");
                    new_cell_circle.addClass("cell-circle");

                    // Add circle to svg and svg to cell
                    new_cell_circle_svg.append(new_cell_circle);
                    new_cell.append(new_cell_circle_svg);

                }

                // Add number if cell starts a word
                if ((r == 0) || (c == 0) || (puzzle[r-1][c] == 0) || (puzzle[r][c-1] == 0)) {
                    new_cell_label = $("<div>" + clue_count + "</div>");
                    new_cell_label.addClass("puzzle-textbox-label");
                    new_cell.append(new_cell_label);
                    clue_count = clue_count + 1;
                }

                // Add identifier in the lower right if this is a multi-letter cell
                if (multiletters[r][c] != 1) {
                    new_cell_multi_label = $("<div>" + multiletters[r][c] + "</div>");
                    new_cell_multi_label.addClass("puzzle-textbox-multi-label");
                    new_cell.append(new_cell_multi_label);
                }

                // Add highlighting if we specified highlighting
                if (highlights[r][c] != "") {
                    new_cell.addClass("cell-highlight-" + highlights[r][c]);
                }

                // Create an input/textarea inside the table cell
                // If the cell is configured for multiple letters, add the appropriate classes
                var new_textbox;

                if (multiletters[r][c] == 1) {
                    new_textbox = $("<input></input>").attr("type", "text").attr("maxlength", "1");
                    new_textbox.addClass("puzzle-textbox");
                    new_textbox.attr("id", "puzzle-textbox-num-" + r + "-" + c);
                    new_cell.append(new_textbox);
                } else {
                    new_textbox_wrapper = $("<div></div>").addClass("multi-letter-box-wrapper"); 
                    new_textbox = $("<textarea></textarea>").attr("maxlength", multiletters[r][c]);
                    new_textbox.addClass("multi-letter-box");
                    new_textbox.addClass("multi-letter-box-" + multiletters[r][c]);
                    new_textbox.addClass("puzzle-textbox");
                    new_textbox.attr("id", "puzzle-textbox-num-" + r + "-" + c);
                    new_textbox_wrapper.append(new_textbox);
                    new_cell.append(new_textbox_wrapper);
                }

            }

            // Add cell to row
            new_row.append(new_cell);

        }

        // Add row to column
        $("#puzzle-editor").append(new_row);

    }

    // Refresh the puzzle html so any svgs appear / update
    $("#puzzle-editor").html($("#puzzle-editor").html());

    // Apply any saved lettering
    applyLetters();

    // When switching to solve mode, activate handlers
    if (mode == "SOLVE") {

        // Listen for arrow key navigation
        highlightActiveCell();

        // Add event handlers
        $(".puzzle-textbox").on("input", handleAdvancing);
        $(".puzzle-textbox").keydown(handleKeyDown);
        $(".puzzle-textbox").click(handleCellClick);
        $(".multi-letter-box").focus(handleMultiLetterBoxFocus);

    } else if (mode == "EDIT") {

        // Activate handlers for editor features
        $(".puzzle-cell").click(handleEditCell);
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

    // if the current cell is a multi-letter cell, don't auto-advance
    if (multiletters[active_row][active_col] != 1) {
        return;
    }

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
        if (multiletters[active_row][active_col] == 1) {
            $(this).val("");
            char = String.fromCharCode(e.which);
            letters[active_row][active_col] = char
            advance = 1;
        } else {
            if ($(this).val()[0] == "_") {
                char =  String.fromCharCode(e.which);
                $(this).val(char);
                letters[active_row][active_col] = char
            } else {
                letters[active_row][active_col] = $(this).val();
            }
        }
    }

    // Backspace
    else if (e.which == 8) {
        if (multiletters[active_row][active_col] == 1) {
            $(this).val("");
            letters[active_row][active_col] = "_";
            advance = -1;  
        } else {
            if ($(this).val() == "") {
                $(this).val("_");
            }
            letters[active_row][active_col] = $(this).val();
        }
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
    $(".active-row-cell").removeClass("active-row-cell");
    $(".active-cell").removeClass("active-cell");

    // Shade all cells for the current word
    dirs = [-1, 1];
    for (i in dirs) {
        row = active_row;
        col = active_col;
        while ((row < rows) && (row >= 0) && (col < cols) && (col >= 0) && $("#puzzle-cell-num-" + row + "-" + col).hasClass("white-square")) {
            $("#puzzle-cell-num-" + row + "-" + col).addClass("active-row-cell");
            if (nav_direction == "HORIZONTAL") {
                col = col + (1 * dirs[i]);
            }
            else {
                row = row + (1 * dirs[i]);
            }
        }
    }

    // Highlight the current cell and move the focus to it
    $("#puzzle-cell-num-" + active_row + "-" + active_col).addClass("active-cell");
    $("#puzzle-textbox-num-" + active_row + "-" + active_col).focus();
}


function handleCursorModeClick() {

    // Reset the highlighting of the buttons
    $(".cursor-mode-button-selected").removeClass("cursor-mode-button-selected");
    $(this).addClass("cursor-mode-button-selected");

    // Update the cursor mode based on which button was clicked
    if ($(this).attr("id") == "cursor-button-black") {
        cursor_mode = "BLACK";
    } else if ($(this).attr("id") == "cursor-button-circle") {
        cursor_mode = "CIRCLE";
    } else if ($(this).attr("id") == "cursor-button-highlight") {
        cursor_mode = "HIGHLIGHT";
    } else if ($(this).attr("id") == "cursor-button-multi") {
        cursor_mode = "MULTI";
    } else {
        return  // ???
    }


}


function handleHighlightColorClick() {

    // If the cursor mode isn't HIGHLIGHT, switch to that mode
    if (cursor_mode != "HIGHLIGHT") {
        $(".cursor-mode-button-selected").removeClass("cursor-mode-button-selected");
        $("#cursor-button-highlight").addClass("cursor-mode-button-selected");
        cursor_mode = "HIGHLIGHT";
    } else {

        // Advance color by one in the list
        selected_color_index = (selected_color_index + 1) % highlight_colors.length;
        selected_color = highlight_colors[selected_color_index];

        // Update the tag for the highlight icon box
        $("#cursor-mode-highlight-icon").removeClass("cell-highlight-R");
        $("#cursor-mode-highlight-icon").removeClass("cell-highlight-O");
        $("#cursor-mode-highlight-icon").removeClass("cell-highlight-Y");
        $("#cursor-mode-highlight-icon").removeClass("cell-highlight-G");
        $("#cursor-mode-highlight-icon").removeClass("cell-highlight-B");
        $("#cursor-mode-highlight-icon").removeClass("cell-highlight-I");
        $("#cursor-mode-highlight-icon").removeClass("cell-highlight-V");

        $("#cursor-mode-highlight-icon").addClass("cell-highlight-" + selected_color);

    }

}


function handleMultiIconClick() {

    // If the cursor mode isn't HIGHLIGHT, switch to that mode
    if (cursor_mode != "MULTI") {
        $(".cursor-mode-button-selected").removeClass("cursor-mode-button-selected");
        $("#cursor-button-multi").addClass("cursor-mode-button-selected");
        cursor_mode = "MULTI";
    } else {

        // Loop over the range 2,3,4 with each click
        selected_multi_num = ((selected_multi_num - 1) % 3) + 2;

        // Update the tag for the highlight icon box
        $(".multi-letter-box-example").removeClass("multi-letter-box-2");
        $(".multi-letter-box-example").removeClass("multi-letter-box-3");
        $(".multi-letter-box-example").removeClass("multi-letter-box-4");

        $(".multi-letter-box-example").addClass("multi-letter-box-" + selected_multi_num);
        $(".multi-letter-box-example").val("A".repeat(selected_multi_num));
    }

}


function handleMultiLetterBoxFocus() {
    endPos = $(this).val().length;
    $(this).prop("selectionStart", endPos);
}