
const canvas = document.getElementById("pixel-canvas");
const ctx = canvas.getContext("2d");
const resolutionSelect = document.getElementById("resolution");
const colorPicker = document.getElementById("color-picker");
const palette = document.getElementById("palette");
const gridToggle = document.getElementById("grid-toggle");
const transparentToggle = document.getElementById("transparent-toggle");
const canvasInfo = document.getElementById("canvas-info");
const toolStatus = document.getElementById("tool-status");
const cursorStatus = document.getElementById("cursor-status");
const undoButton = document.getElementById("undo-btn");

const previewSize = 512;
let resolution = Number(resolutionSelect.value);
let pixels = [];
let selectedColor = colorPicker.value;
let selectedTool = "pencil";
let drawing = false;
let lastPixel = null;
let history = [];

canvas.width = previewSize;
canvas.height = previewSize;

function createPixels(size, previous = null) {
    const next = Array.from({ length: size }, () =>
        Array(size).fill(null)
    );

    if (previous) {
        const oldSize = previous.length;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const oldX = Math.floor(x * oldSize / size);
                const oldY = Math.floor(y * oldSize / size);
                next[y][x] = previous[oldY][oldX];
            }
        }
    }

    return next;
}

function saveHistory() {
    history.push(pixels.map(row => [...row]));

    if (history.length > 50) {
        history.shift();
    }

    undoButton.disabled = history.length === 0;
}

function restoreHistory() {
    if (!history.length) return;

    pixels = history.pop().map(row => [...row]);
    undoButton.disabled = history.length === 0;
    render();
}

function render() {
    const cell = previewSize / resolution;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!transparentToggle.checked) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, previewSize, previewSize);
    }

    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            const color = pixels[y][x];

            if (color) {
                ctx.fillStyle = color;
                ctx.fillRect(
                    x * cell,
                    y * cell,
                    Math.ceil(cell),
                    Math.ceil(cell)
                );
            }
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

    canvasInfo.textContent = `${resolution} × ${resolution}`;
}

function getPixel(event) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(
        (event.clientX - rect.left) / rect.width * resolution
    );
    const y = Math.floor(
        (event.clientY - rect.top) / rect.height * resolution
    );

    if (x < 0 || y < 0 || x >= resolution || y >= resolution) {
        return null;
    }

    return { x, y };
}

function paintPixel(x, y) {
    if (selectedTool === "eyedropper") {
        const color = pixels[y][x];

        if (color) {
            selectedColor = color;
            colorPicker.value = color;
        }

        return;
    }

    if (selectedTool === "fill") {
        floodFill(x, y);
        return;
    }

    pixels[y][x] = selectedTool === "eraser"
        ? null
        : selectedColor;

    render();
}

function floodFill(startX, startY) {
    const target = pixels[startY][startX];

    if (target === selectedColor) return;

    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;

        if (
            x < 0 || y < 0 ||
            x >= resolution || y >= resolution ||
            visited.has(key) ||
            pixels[y][x] !== target
        ) {
            continue;
        }

        visited.add(key);
        pixels[y][x] = selectedColor;

        stack.push(
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1]
        );
    }
}

function selectTool(tool) {
    selectedTool = tool;

    document.querySelectorAll(".tool").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.tool === tool
        );
    });

    const names = {
        pencil: "Pencil",
        eraser: "Eraser",
        fill: "Fill",
        eyedropper: "Color picker"
    };

    toolStatus.textContent = `${names[tool]} selected`;
    canvas.style.cursor = tool === "eyedropper" ? "copy" : "crosshair";
}

canvas.addEventListener("pointerdown", event => {
    const point = getPixel(event);
    if (!point) return;

    event.preventDefault();

    saveHistory();

    if (selectedTool === "fill" || selectedTool === "eyedropper") {
        paintPixel(point.x, point.y);
        return;
    }

    drawing = true;
    lastPixel = point;
    canvas.setPointerCapture(event.pointerId);
    paintPixel(point.x, point.y);
});

canvas.addEventListener("pointermove", event => {
    const point = getPixel(event);

    cursorStatus.textContent = point
        ? `X: ${point.x + 1}, Y: ${point.y + 1}`
        : "Ready";

    if (!drawing || !point) return;

    if (
        lastPixel &&
        point.x === lastPixel.x &&
        point.y === lastPixel.y
    ) {
        return;
    }

    paintPixel(point.x, point.y);
    lastPixel = point;
});

function stopDrawing() {
    drawing = false;
    lastPixel = null;
}

canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("lostpointercapture", stopDrawing);

document.querySelectorAll(".tool").forEach(button => {
    button.addEventListener("click", () => {
        selectTool(button.dataset.tool);
    });
});

colorPicker.addEventListener("input", () => {
    selectedColor = colorPicker.value;
});

palette.addEventListener("click", event => {
    const button = event.target.closest("[data-color]");
    if (!button) return;

    selectedColor = button.dataset.color;
    colorPicker.value = selectedColor;
});

resolutionSelect.addEventListener("change", () => {
    const newResolution = Number(resolutionSelect.value);
    if (newResolution === resolution) return;

    saveHistory();
    pixels = createPixels(newResolution, pixels);
    resolution = newResolution;
    render();
});

gridToggle.addEventListener("change", render);
transparentToggle.addEventListener("change", render);

document.getElementById("clear-btn").addEventListener("click", () => {
    if (!pixels.some(row => row.some(pixel => pixel !== null))) return;

    saveHistory();
    pixels = createPixels(resolution);
    render();
});

undoButton.addEventListener("click", restoreHistory);

document.getElementById("export-btn").addEventListener("click", () => {
    const output = document.createElement("canvas");
    output.width = resolution;
    output.height = resolution;

    const outputCtx = output.getContext("2d");

    if (!transparentToggle.checked) {
        outputCtx.fillStyle = "#ffffff";
        outputCtx.fillRect(0, 0, resolution, resolution);
    }

    for (let y = 0; y < resolution; y++) {
        for (let x = 0; x < resolution; x++) {
            if (!pixels[y][x]) continue;

            outputCtx.fillStyle = pixels[y][x];
            outputCtx.fillRect(x, y, 1, 1);
        }
    }

    const link = document.createElement("a");
    link.download = `doodle-pixel-art-${resolution}x${resolution}.png`;
    link.href = output.toDataURL("image/png");
    link.click();
});

pixels = createPixels(resolution);
render();
selectTool("pencil");
