
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const colorInput = document.getElementById("color");
const sizeInput = document.getElementById("size");
const brushButton = document.getElementById("brush");
const eraserButton = document.getElementById("eraser");

let drawing = false;
let tool = "brush";
let lastPoint = null;
let canvasWidth = 1000;
let canvasHeight = 650;

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

function startDrawing(event) {
    if (event.button !== undefined && event.button !== 0) return;

    drawing = true;
    lastPoint = getPoint(event);
    canvas.setPointerCapture(event.pointerId);

    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, Number(sizeInput.value) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === "eraser" ? "#ffffff" : colorInput.value;
    ctx.fill();
}

function draw(event) {
    if (!drawing || !lastPoint) return;

    const point = getPoint(event);

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

function stopDrawing() {
    drawing = false;
    lastPoint = null;
    ctx.beginPath();
}

function selectTool(selectedTool) {
    tool = selectedTool;
    brushButton.classList.toggle("active", tool === "brush");
    eraserButton.classList.toggle("active", tool === "eraser");
}

brushButton.addEventListener("click", () => selectTool("brush"));
eraserButton.addEventListener("click", () => selectTool("eraser"));

canvas.addEventListener("pointerdown", startDrawing);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("lostpointercapture", stopDrawing);

window.addEventListener("resize", resizeCanvas);

selectTool("brush");
resizeCanvas();
