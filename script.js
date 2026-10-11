
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorInput = document.getElementById("color");
const sizeInput = document.getElementById("size");
const brushButton = document.getElementById("brush");
const eraserButton = document.getElementById("eraser");
const undoButton = document.getElementById("undo");
const redoButton = document.getElementById("redo");
const clearButton = document.getElementById("clear");
const exportButton = document.getElementById("export");
const lineButton = document.getElementById("line");
const rectangleButton = document.getElementById("rectangle");
const circleButton = document.getElementById("circle");
const arrowButton = document.getElementById("arrow");

let history = [];
let historyIndex = -1;
let drawing = false;
let tool = "brush";
let lastPoint = null;
let canvasWidth = 1000;
let canvasHeight = 650;
let startPoint = null;
let shapeSnapshot = null;
const shapeTools = ["line", "rectangle", "circle", "arrow"];

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const previous = document.createElement("canvas");
    previous.width = canvas.width;
    previous.height = canvas.height;
    previous.getContext("2d").drawImage(canvas, 0, 0);

    const oldWidth = canvasWidth;
    const oldHeight = canvasHeight;
    const hadContent = canvas.width > 0 && canvas.height > 0;

    canvasWidth = rect.width;
    canvasHeight = rect.height;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (hadContent && oldWidth && oldHeight) {
        ctx.drawImage(
            previous,
            0, 0, previous.width, previous.height,
            0, 0, canvasWidth, canvasHeight
        );
    } else {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }
}

function getPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function restoreShapeSnapshot() {
    if (!shapeSnapshot) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(shapeSnapshot, 0, 0);

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function drawShape(point) {
    if (!startPoint) return;

    const x1 = startPoint.x;
    const y1 = startPoint.y;
    const x2 = point.x;
    const y2 = point.y;

    ctx.beginPath();
    ctx.strokeStyle = colorInput.value;
    ctx.lineWidth = Number(sizeInput.value);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (tool === "line") {
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
    }

    if (tool === "rectangle") {
        ctx.rect(x1, y1, x2 - x1, y2 - y1);
    }

    if (tool === "circle") {
        ctx.ellipse(
            (x1 + x2) / 2,
            (y1 + y2) / 2,
            Math.abs(x2 - x1) / 2,
            Math.abs(y2 - y1) / 2,
            0, 0, Math.PI * 2
        );
    }

    if (tool === "arrow") {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = Math.max(12, Number(sizeInput.value) * 3);

        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);

        ctx.moveTo(
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(x2, y2);

        ctx.lineTo(
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6)
        );
    }

    ctx.stroke();
}

function startDrawing(event) {
    if (event.button !== undefined && event.button !== 0) return;

    drawing = true;
    lastPoint = getPoint(event);
    startPoint = lastPoint;

    if (shapeTools.includes(tool)) {
        shapeSnapshot = document.createElement("canvas");
        shapeSnapshot.width = canvas.width;
        shapeSnapshot.height = canvas.height;
        shapeSnapshot.getContext("2d").drawImage(canvas, 0, 0);
        return;
    }

    canvas.setPointerCapture(event.pointerId);

    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, Number(sizeInput.value) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === "eraser" ? "#ffffff" : colorInput.value;
    ctx.fill();
}

function updateHistoryButtons() {
    if (undoButton) undoButton.disabled = historyIndex <= 0;
    if (redoButton) redoButton.disabled = historyIndex >= history.length - 1;
}

function saveHistory() {
    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    snapshot.getContext("2d").drawImage(canvas, 0, 0);

    history = history.slice(0, historyIndex + 1);
    history.push(snapshot);

    if (history.length > 50) history.shift();

    historyIndex = history.length - 1;
    updateHistoryButtons();
}

function resetHistory() {
    history = [];
    historyIndex = -1;
    saveHistory();
}

function restoreHistory(index) {
    if (index < 0 || index >= history.length) return;

    historyIndex = index;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(history[index], 0, 0);

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    updateHistoryButtons();
}

function draw(event) {
    if (!drawing || !lastPoint) return;

    const point = getPoint(event);

    if (shapeTools.includes(tool)) {
        restoreShapeSnapshot();
        drawShape(point);
        return;
    }

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : colorInput.value;
    ctx.lineWidth = Number(sizeInput.value);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    lastPoint = point;
}

function stopDrawing(event) {
    if (!drawing) return;

    if (shapeTools.includes(tool) && shapeSnapshot) {
        restoreShapeSnapshot();

        if (event && event.type === "pointerup") {
            drawShape(getPoint(event));
        }
    }

    drawing = false;
    lastPoint = null;
    startPoint = null;
    shapeSnapshot = null;
    ctx.beginPath();
    saveHistory();
}

function selectTool(selectedTool) {
    tool = selectedTool;

    const buttons = {
        brush: brushButton,
        eraser: eraserButton,
        line: lineButton,
        rectangle: rectangleButton,
        circle: circleButton,
        arrow: arrowButton
    };

    Object.entries(buttons).forEach(([name, button]) => {
        button.classList.toggle("active", name === tool);
    });
}

brushButton.addEventListener("click", () => selectTool("brush"));
eraserButton.addEventListener("click", () => selectTool("eraser"));
lineButton.addEventListener("click", () => selectTool("line"));
rectangleButton.addEventListener("click", () => selectTool("rectangle"));
circleButton.addEventListener("click", () => selectTool("circle"));
arrowButton.addEventListener("click", () => selectTool("arrow"));

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("lostpointercapture", stopDrawing);

window.addEventListener("resize", () => {
    resizeCanvas();
    resetHistory();
});

undoButton?.addEventListener("click", () => {
    console.log("Undo clicked:", historyIndex, history.length);
    restoreHistory(historyIndex - 1);
});

redoButton?.addEventListener("click", () => {
    restoreHistory(historyIndex + 1);
});

clearButton.addEventListener("click", () => {
    drawing = false;
    lastPoint = null;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    saveHistory();
});

exportButton.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "doodle.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
});

selectTool("brush");
resizeCanvas();
resetHistory();

document.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey || event.metaKey)) return;

    if (event.key.toLowerCase() === "z") {
        event.preventDefault();

        if (event.shiftKey) {
            restoreHistory(historyIndex + 1);
        } else {
            restoreHistory(historyIndex - 1);
        }
    }

    if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        restoreHistory(historyIndex + 1);
    }
});
