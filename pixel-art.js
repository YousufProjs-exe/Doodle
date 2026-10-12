
const canvas = document.getElementById("pixel-canvas");
const ctx = canvas.getContext("2d");
const resolutionSelect = document.getElementById("resolution");
const gridToggle = document.getElementById("grid-toggle");
const transparentToggle = document.getElementById("transparent-toggle");
const canvasInfo = document.getElementById("canvas-info");

const previewSize = 512;
let resolution = Number(resolutionSelect.value);
let pixels = [];

canvas.width = previewSize;
canvas.height = previewSize;

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

gridToggle.addEventListener("change", render);
transparentToggle.addEventListener("change", render);

function createPixels(size) {
    return Array.from({ length: size }, () => Array(size).fill(null));
}

pixels = createPixels(resolution);
render();
