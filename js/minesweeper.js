var columns         = 9;
var rows            = 9;
var flagsPlaced     = 0;
var mineCount       = 10;
var mineField       = []; // 2D boolean array - true if mine, false otherwise
var tilesCleared    = 0;
var timerIntervalId = -1;
var timeValue       = 0;

var playing         = false;

function buildGrid() {
    // Fetch grid and clear out old elements.
    var grid = document.getElementById("minefield");
    grid.innerHTML = "";

    // Build DOM Grid
    var tile;
    for (var y = 0; y < rows; y++) {
        for (var x = 0; x < columns; x++) {
            tile = createTile(x,y);
            grid.appendChild(tile);
        }
    }

    var style = window.getComputedStyle(tile);

    var width = parseInt(style.width.slice(0, -2));
    var height = parseInt(style.height.slice(0, -2));

    grid.style.width = (columns * width) + "px";
    grid.style.height = (rows * height) + "px";

    flagsPlaced = 0;
    mineField = [];
    tilesCleared = 0;
}

function createTile(x,y) {
    var tile = document.createElement("div");

    tile.classList.add("tile");
    tile.classList.add("hidden");

    tile.gridLocation = {row: y, col: x};

    tile.addEventListener("auxclick", function(e) { e.preventDefault(); }); // Middle Click
    tile.addEventListener("contextmenu", function(e) { e.preventDefault(); }); // Right Click
    tile.addEventListener("mousedown", handleMouseDown );
    tile.addEventListener("mouseup", handleTileClick ); // All Clicks

    return tile;
}

function startGame() {
    var smiley = document.getElementById("smiley");
    smiley.classList.remove("face_win");
    smiley.classList.remove("face_lose");
    buildGrid();
    updateMineCount();
    resetTimer();
    playing = true;
}

function smileyDown() {
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_down");
}

function smileyUp() {
    var smiley = document.getElementById("smiley");
    smiley.classList.remove("face_down");
}

function handleMouseDown(event) {
    if (!playing) return;
    var smiley = document.getElementById("smiley");
    smiley.classList.add("face_limbo");
}

function handleTileClick(event) {
    if (!playing) return;
    var tile = event.target;
    smiley.classList.remove("face_limbo");
    // Left Click
    if (event.which === 1) {
        // Add mines to mine field after the first click
        if (mineField.length < 1 && tile.classList[tile.classList.length - 1] === "hidden") {
            for (var i = 0; i < rows; i++) {
                mineField.push([]);
                for (var j = 0; j < columns; j++) {
                    mineField[i].push(false);
                }
            }
            // Add indices of target tile and adjacent tiles to list marking off
            // limits for mine placement
            var adjTiles = getAdjacentTiles(tile);
            var offLimitsIndices = [gridToArrayIndex(tile.gridLocation.col, tile.gridLocation.row)];
            for (i = 0; i < adjTiles.length; i++) {
                offLimitsIndices.push(gridToArrayIndex(adjTiles[i].gridLocation.col, adjTiles[i].gridLocation.row));
            }
            var indices = [];
            for (i = 0; i < rows * columns; i++) {
                if (!offLimitsIndices.includes(i)) {
                    indices.push(i);
                }
            }
            indices.sort(function() { return 0.5 - Math.random(); }); // shuffle
            for (i = 0; i < mineCount; i++) {
                mineField[Math.floor(indices[i] / columns)][(indices[i] % columns)] = true;
            }
        }
        if (tryRevealTile(tile) && playing) {
            startTimer();
        }
    }
    // Middle Click
    else if (event.which === 2) {
        if (tile.classList[tile.classList.length - 1].startsWith("tile_")) {
            var adjFlags = 0;
            var adjTiles = getAdjacentTiles(tile);
            // Count flagged adjacent tiles
            for (var i = 0; i < adjTiles.length; i++) {
                if (adjTiles[i].classList[adjTiles[i].classList.length - 1] === "flag") {
                    adjFlags++;
                }
            }
            if (adjFlags.toString() === tile.classList[tile.classList.length - 1].split("_")[1]) {
                for (i = 0; i < adjTiles.length; i++) {
                    tryRevealTile(adjTiles[i]);
                }
            }
        }
    }
    // Right Click
    else if (event.which === 3) {
        tryToggleTileFlag(tile);
    }
}

function tryRevealTile(tile) {
    if (tile.classList[tile.classList.length - 1] === "hidden") {
        tile.classList.remove("hidden");
        if (mineField[tile.gridLocation.row][tile.gridLocation.col]) {
            tile.classList.add("mine_hit");
            endGame(false);
        } else {
            var adjMines = 0;
            var adjTiles = getAdjacentTiles(tile);
            for (var i = 0; i < adjTiles.length; i++) {
                if (mineField[adjTiles[i].gridLocation.row][adjTiles[i].gridLocation.col]) {
                    adjMines++;
                }
            }
            if (adjMines > 0) {
                tile.classList.add("tile_" + adjMines);
            } else {
                for (i = 0; i < adjTiles.length; i++) {
                    tryRevealTile(adjTiles[i]);
                }
            }
            tilesCleared++;
        }
        if (tilesCleared >= (rows * columns) - mineCount) {
            endGame(true);
        }
        return true;
    }
    return false;
}

function tryToggleTileFlag(tile) {
    if (tile.classList[tile.classList.length - 1] === "hidden") {
        if (flagsPlaced < mineCount) {
            tile.classList.remove("hidden");
            tile.classList.add("flag");
            flagsPlaced++;
        }
    } else if (tile.classList[tile.classList.length - 1] === "flag") {
        tile.classList.remove("flag");
        tile.classList.add("hidden");
        flagsPlaced--;
    }
    updateMineCount();
}

function getAdjacentTiles(tile) {
    var gridArray = tile.parentElement.childNodes;
    var adjTiles = [];
    for (var y = tile.gridLocation.row - 1; y <= tile.gridLocation.row + 1; y++) {
        for (var x = tile.gridLocation.col - 1; x <= tile.gridLocation.col + 1; x++) {
            if ((y === tile.gridLocation.row && x === tile.gridLocation.col) ||
              y < 0 || x < 0 || y >= rows || x >= columns) {
                continue;
            }
            adjTiles.push(gridArray[gridToArrayIndex(x, y)]);
        }
    }
    return adjTiles;
}

function gridToArrayIndex(x, y) {
    return y * columns + x;
}

function endGame(win) {
    playing = false;
    stopTimer();
    var smiley = document.getElementById("smiley");
    if (win) {
        smiley.classList.add("face_win");
        alert("Congratulations! You won! Your time was " + timeValue + " seconds.");
    } else {
        smiley.classList.add("face_lose");
        var mines = document.getElementById("minefield").childNodes;
        for (var i = 0; i < mines.length; i++) {
            if (mineField[mines[i].gridLocation.row][mines[i].gridLocation.col]) {
                if (mines[i].classList[mines[i].classList.length - 1] === "hidden") {
                    mines[i].classList.add("mine");
                } else if (mines[i].classList[mines[i].classList.length - 1] === "flag") {
                    mines[i].classList.add("mine_marked");
                }
            }
        }
        alert("Oops! You lost!");
    }
}

function setDifficulty() {
    var difficultySelector = document.getElementById("difficulty");
    var difficulty = difficultySelector.selectedIndex;

    switch (difficulty) {
      case 0:
        // easy
        rows = columns = 9;
        mineCount = 10;
        break;
      case 1:
        // medium
        rows = columns = 16;
        mineCount = 40;
        break;
      case 2:
        // hard
        rows = 16;
        columns = 30;
        mineCount = 99;
        break;
      default:
        break;
    }
}

function startTimer() {
    if (timerIntervalId < 0) {
        timerIntervalId = window.setInterval(onTimerTick, 1000);
    }
}

function resetTimer() {
    timeValue = 0;
    stopTimer();
    updateTimer();
}

function stopTimer() {
    window.clearInterval(timerIntervalId);
    timerIntervalId = -1;
}

function onTimerTick() {
    timeValue++;
    updateTimer();
}

function updateMineCount() {
    document.getElementById("flagCount").innerHTML = mineCount - flagsPlaced;
}

function updateTimer() {
    document.getElementById("timer").innerHTML = timeValue;
}
