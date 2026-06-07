const grid = document.querySelector(".tetris-grid"),
    hydrationEl = document.getElementById("hydration-value"),
    nutritionEl = document.getElementById("nutrition-value"),
    moodEl = document.getElementById("mood-value"),
    scoreEl = document.getElementById("score-value"),
    levelEl = document.getElementById("level-value"),
    monkeyEmoji = document.getElementById("monkey-emoji");

let score = 0,
    level = 1,
    lines = 0,
    hydration,
    nutrition,
    mood,
    currentShape,
    currentPos,
    currentColors,
    currentShapeIndex,
    gameSpeed = 1000,
    statDecayRate = 1;

const colors = ["#fff06a", "#ffd400", "#ffb000", "#8b5a00"];
    shapes = [
        { shape: [[1, 1, 1, 1]], width: 4 },
        { shape: [[1, 1], [1, 1]], width: 2 },
        { shape: [[1, 1, 1], [0, 1, 0]], width: 3 },
        { shape: [[1, 1, 1], [1, 0, 0]], width: 3 },
        { shape: [[1, 1, 1], [0, 0, 1]], width: 3 },
        { shape: [[1, 1, 0], [0, 1, 1]], width: 3 },
        { shape: [[0, 1, 1], [1, 1, 0]], width: 3 }
    ];

for (let i = 0; i < 200; i++) {
    const cell = document.createElement("div");
    cell.classList.add("tetris-cell");
    grid.appendChild(cell);
}

function initializeStats() {
    const stats = [20, 30, 40];
    const shuffledStats = stats.sort(() => Math.random() - 0.5);
    hydration = shuffledStats[0];
    nutrition = shuffledStats[1];
    mood = shuffledStats[2];
    updateStats();
}

function newShape() {
    currentShapeIndex = Math.floor(Math.random() * shapes.length);
    currentShape = shapes[currentShapeIndex].shape;
    currentPos = { x: Math.floor((10 - shapes[currentShapeIndex].width) / 2), y: 0 };
    currentColors = currentShape.map(row => row.map(() => colors[Math.floor(Math.random() * colors.length)]));
    if (collision()) {
        gameOver();
    } else {
        draw();
        updatePetStats();
        updatePathHighlight();
    }
}

function draw() {
    currentShape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                const gridCell = grid.children[10 * (currentPos.y + rowIndex) + (currentPos.x + colIndex)];
                if (gridCell) {
                    gridCell.style.backgroundColor = currentColors[rowIndex][colIndex];
                    gridCell.style.boxShadow = `0 0 5px ${currentColors[rowIndex][colIndex]}`;
                }
            }
        });
    });
}

function erase() {
    currentShape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                const gridCell = grid.children[10 * (currentPos.y + rowIndex) + (currentPos.x + colIndex)];
                if (gridCell) {
                    gridCell.style.backgroundColor = "";
                    gridCell.style.boxShadow = "";
                }
            }
        });
    });
}

function collision() {
    return currentShape.some((row, rowIndex) =>
        row.some((cell, colIndex) =>
            cell &&
            (currentPos.y + rowIndex >= 20 ||
                currentPos.x + colIndex < 0 ||
                currentPos.x + colIndex >= 10 ||
                grid.children[10 * (currentPos.y + rowIndex) + (currentPos.x + colIndex)].classList.contains("taken"))
        )
    );
}

function solidify() {
    currentShape.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                grid.children[10 * (currentPos.y + rowIndex) + (currentPos.x + colIndex)].classList.add("taken");
            }
        });
    });
}

function clearRows() {
    let rowsCleared = 0;
    let colorCounts = [0, 0, 0];
    let nutritionPoints = 0;

    for (let row = 19; row >= 0; row--) {
        const cells = Array.from(grid.children).slice(10 * row, 10 * (row + 1));
        if (cells.every(cell => cell.classList.contains("taken"))) {
            cells.forEach(cell => {
                const cellColor = cell.style.backgroundColor;
                if (cellColor === "rgb(255, 0, 255)") {
                    colorCounts[0]++;
                    nutritionPoints++;
                } else if (cellColor === "rgb(0, 255, 255)") {
                    colorCounts[1]++;
                } else if (cellColor === "rgb(255, 255, 0)") {
                    colorCounts[2]++;
                }
                cell.style.backgroundColor = "";
                cell.style.boxShadow = "";
                cell.classList.remove("taken");
            });
            grid.prepend(...Array.from(grid.children).splice(10 * row, 10));
            rowsCleared++;
            row++;
        }
    }

    if (rowsCleared) {
        lines += rowsCleared;
        score += 100 * nutritionPoints;
        updateLevel();
        updatePetStatsOnClear(colorCounts);
        updateScoreAndLevel();
    }
}

function updateLevel() {
    const newLevel = Math.floor(score / 1000) + 1;
    if (newLevel > level) {
        level = newLevel;
        gameSpeed *= 0.9;
        statDecayRate *= 1.1;
        updateGameSpeed();
        highlightChange(levelEl);
    }
}

function updatePetStats() {
    hydration = Math.max(0, hydration - 0.5 * statDecayRate);
    nutrition = Math.max(0, nutrition - 0.5 * statDecayRate);
    mood = Math.max(0, mood - 0.5 * statDecayRate);
    updateStats();
    if (hydration <= 0 || nutrition <= 0 || mood <= 0) {
        gameOver();
    }
}

function updatePetStatsOnClear(colorCounts) {
    hydration = Math.min(100, hydration + colorCounts[0]);
    nutrition = Math.min(100, nutrition + colorCounts[1]);
    mood = Math.min(100, mood + colorCounts[2]);
    updateStats();
}

function updateStats() {
    updateStatWithHighlight(hydrationEl, Math.round(hydration));
    updateStatWithHighlight(nutritionEl, Math.round(nutrition));
    updateStatWithHighlight(moodEl, Math.round(mood));

    const danger = hydration < 10 || nutrition < 10 || mood < 10;
    document.getElementById("hydration").classList.toggle("danger", hydration < 10);
    document.getElementById("nutrition").classList.toggle("danger", nutrition < 10);
    document.getElementById("mood").classList.toggle("danger", mood < 10);
    monkeyEmoji.textContent = danger ? "🙊" : "🐵";
}

function updateScoreAndLevel() {
    updateStatWithHighlight(scoreEl, score);
    updateStatWithHighlight(levelEl, level);
}

function updateStatWithHighlight(element, value) {
    const oldValue = parseInt(element.textContent);
    if (oldValue !== value) {
        element.textContent = value;
        highlightChange(element);
    }
}

function highlightChange(element) {
    element.classList.add("highlight-change");
    setTimeout(() => {
        element.classList.remove("highlight-change");
    }, 200);
}

function gameOver() {
    alert(`Game Over! Your score: ${score}`);
    Array.from(grid.children).forEach(cell => {
        cell.style.backgroundColor = "";
        cell.style.boxShadow = "";
        cell.classList.remove("taken");
    });
    score = 0;
    level = 1;
    lines = 0;
    gameSpeed = 1000;
    statDecayRate = 1;
    initializeStats();
    updateScoreAndLevel();
    updateGameSpeed();
    newShape();
}

["left-btn", "right-btn", "rotate-btn", "drop-btn"].forEach(buttonId => {
    const button = document.getElementById(buttonId);
    button.addEventListener("mousedown", event => {
        if (buttonId === "left-btn") {
            move(-1);
        } else if (buttonId === "right-btn") {
            move(1);
        } else if (buttonId === "rotate-btn") {
            rotate();
        } else if (buttonId === "drop-btn") {
            hardDrop();
        }
        event.preventDefault();
    });

    button.addEventListener("touchstart", event => {
        if (buttonId === "left-btn") {
            move(-1);
        } else if (buttonId === "right-btn") {
            move(1);
        } else if (buttonId === "rotate-btn") {
            rotate();
        } else if (buttonId === "drop-btn") {
            hardDrop();
        }
        event.preventDefault();
    });

    button.addEventListener("mouseup", () => {
        button.blur();
    });

    button.addEventListener("touchend", () => {
        button.blur();
    });
});

function move(direction) {
    erase();
    currentPos.x += direction;
    if (collision()) {
        currentPos.x -= direction;
        draw();
    } else {
        draw();
        updatePathHighlight();
    }
}

function rotate() {
    erase();
    const oldShape = currentShape;
    const oldColors = currentColors;
    currentShape = currentShape[0].map((_, index) => currentShape.map(row => row[index]).reverse());
    currentColors = currentColors[0].map((_, index) => currentColors.map(row => row[index]).reverse());
    if (collision()) {
        currentShape = oldShape;
        currentColors = oldColors;
        draw();
    } else {
        draw();
        updatePathHighlight();
    }
}

function hardDrop() {
    erase();
    while (!collision()) {
        currentPos.y++;
    }
    currentPos.y--;
    draw();
    solidify();
    clearRows();
    newShape();
}

function moveDown() {
    erase();
    currentPos.y++;
    if (collision()) {
        currentPos.y--;
        draw();
        solidify();
        clearRows();
        newShape();
    } else {
        draw();
        updatePathHighlight();
    }
}

function updateGameSpeed() {
    clearInterval(gameInterval);
    gameInterval = setInterval(moveDown, gameSpeed);
}

function updatePathHighlight() {
    const highlights = document.querySelectorAll(".path-highlight");
    highlights.forEach(highlight => highlight.remove());
    const shapeWidth = getShapeWidth();
    const leftHighlight = document.createElement("div");
    const rightHighlight = document.createElement("div");
    leftHighlight.classList.add("path-highlight");
    rightHighlight.classList.add("path-highlight");
    leftHighlight.style.width = "1px";
    rightHighlight.style.width = "1px";
    leftHighlight.style.height = "400px";
    rightHighlight.style.height = "400px";
    leftHighlight.style.left = 20 * currentPos.x + "px";
    rightHighlight.style.left = 20 * (currentPos.x + shapeWidth) + "px";
    leftHighlight.style.top = "0px";
    rightHighlight.style.top = "0px";
    grid.appendChild(leftHighlight);
    grid.appendChild(rightHighlight);
}

function getShapeWidth() {
    let width = 0;
    for (let col = 0; col < currentShape[0].length; col++) {
        if (currentShape.some(row => row[col])) {
            width++;
        }
    }
    return width;
}

initializeStats();
updateScoreAndLevel();
newShape();

let gameInterval = setInterval(moveDown, gameSpeed);
setInterval(updatePetStats, 5000);
