const canvas = document.getElementById("pixel-canvas");
const ctx = canvas.getContext("2d");
const resolutionSelect = document.getElementById("resolution");
const colorPicker = document.getElementById("color-picker");
const gridToggle = document.getElementById("grid-toggle");
const transparentToggle = document.getElementById("transparent-toggle");
const canvasInfo = document.getElementById("canvas-info");
const toolStatus = document.getElementById("tool-status");
const cursorStatus = document.getElementById("cursor-status");

const previewSize = 512;
let resolution = Number(resolutionSelect.value);
let pixels = [];
let selectedColor = colorPicker.value;
let selectedTool = "pencil";
let drawing = false;
let lastPixel = null;

canvas.width = previewSize;
canvas.height = previewSize;

function createPixels(size) {
    return Array.from({ length: size }, () => Array(size).fill(null));
}

function render() {
    const cell = previewSize / resolution;

    ctx.clearRect(0, 0, previewSize, previewSize);

    if (!transparentToggle.checked) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, previewSize, previewSize);
    }

    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            if (!pixels[y][x]) continue;

            ctx.fillStyle = pixels[y][x];
            ctx.fillRect(x * cell, y * cell, Math.ceil(cell), Math.ceil(cell));
        }
    }

    if (gridToggle.checked && resolution <= 64) {
        ctx.beginPath();
        ctx.strokeStyle = "#77777755";
        ctx.lineWidth = 1;

        for (let i = 0; i <= resolution; i++) {
            const position = i * cell + 0.5;

            ctx.moveTo(position, 0);
            ctx.lineTo(position, previewSize);
            ctx.moveTo(0, position);
            ctx.lineTo(previewSize, position);
        }

        ctx.stroke();
    }

    canvas.classList.toggle("transparent-preview", transparentToggle.checked);
    canvasInfo.textContent = `${resolution} × ${resolution}`;
}

function getPixel(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / rect.width * resolution);
    const y = Math.floor((event.clientY - rect.top) / rect.height * resolution);

    if (x < 0 || y < 0 || x >= resolution || y >= resolution) return null;

    return { x, y };
}

function paintPixel(x, y) {
    const nextColor = selectedTool === "eraser" ? null : selectedColor;

    if (pixels[y][x] === nextColor) return false;

    pixels[y][x] = nextColor;
    return true;
}

canvas.addEventListener("pointerdown", event => {
    const point = getPixel(event);
    if (!point) return;

    event.preventDefault();

    drawing = true;
    lastPixel = point;
    canvas.setPointerCapture(event.pointerId);

    paintPixel(point.x, point.y);
    render();
});

canvas.addEventListener("pointermove", event => {
    const point = getPixel(event);

    cursorStatus.textContent = point
        ? `X: ${point.x + 1}, Y: ${point.y + 1}`
        : "Ready";

    if (!drawing || !point || !lastPixel) return;
    if (point.x === lastPixel.x && point.y === lastPixel.y) return;

    paintPixel(point.x, point.y);
    lastPixel = point;
    render();
});

function stopDrawing() {
    drawing = false;
    lastPixel = null;
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("lostpointercapture", stopDrawing);

colorPicker.addEventListener("input", () => {
    selectedColor = colorPicker.value;
});

gridToggle.addEventListener("change", render);
transparentToggle.addEventListener("change", render);

pixels = createPixels(resolution);
render();