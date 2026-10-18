const canvas = document.getElementById("pixel-canvas");
const resolutionSelect = document.getElementById("resolution");
const gridToggle = document.getElementById("grid-toggle");
const transparentToggle = document.getElementById("transparent-toggle");
const colorPicker = document.getElementById("color-picker");
const palette = document.getElementById("palette");
const undoButton = document.getElementById("undo-btn");
const redoButton = document.getElementById("redo-btn");
const canvasInfo = document.getElementById("canvas-info");
const toolStatus = document.getElementById("tool-status");
const cursorStatus = document.getElementById("cursor-status");
const clearButton = document.getElementById("clear-btn");
const exportButton = document.getElementById("export-btn");

const ctx = canvas.getContext("2d");
const previewSize = 512;
const historyLimit = 50;

let resolution = Number(resolutionSelect.value);
let pixels = [];
let selectedColor = colorPicker.value;
let selectedTool = "pencil";
let drawing = false;
let lastPixel = null;
let history = [];
let redoHistory = [];

canvas.width = previewSize;
canvas.height = previewSize;

function clonePixels(source) {
    return source.map(row => [...row]);
}

function samePixels(a, b) {
    return a.length === b.length &&
        a.every((row, y) =>
            row.length === b[y].length &&
            row.every((color, x) => color === b[y][x])
        );
}

function createSnapshot() {
    return {
        pixels: clonePixels(pixels),
        resolution
    };
}

function restoreSnapshot(snapshot) {
    pixels = clonePixels(snapshot.pixels);
    resolution = snapshot.resolution;
    resolutionSelect.value = String(resolution);
    render();
}

function updateHistoryButtons() {
    undoButton.disabled = history.length === 0;
    redoButton.disabled = redoHistory.length === 0;
}

function saveHistory() {
    history.push(createSnapshot());

    if (history.length > historyLimit) {
        history.shift();
    }

    redoHistory = [];
    updateHistoryButtons();
}

function undo() {
    if (!history.length) return;

    redoHistory.push(createSnapshot());

    if (redoHistory.length > historyLimit) {
        redoHistory.shift();
    }

    restoreSnapshot(history.pop());
    updateHistoryButtons();
}

function redo() {
    if (!redoHistory.length) return;

    history.push(createSnapshot());

    if (history.length > historyLimit) {
        history.shift();
    }

    restoreSnapshot(redoHistory.pop());
    updateHistoryButtons();
}

function createPixels(size, previous = null) {
    const next = Array.from({ length: size }, () =>
        Array(size).fill(null)
    );

    if (previous) {
        const oldSize = previous.length;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                next[y][x] = previous[
                    Math.floor(y * oldSize / size)
                ][
                    Math.floor(x * oldSize / size)
                ];
            }
        }
    }

    return next;
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
            const color = pixels[y][x];

            if (!color) continue;

            ctx.fillStyle = color;
            ctx.fillRect(
                x * cell,
                y * cell,
                Math.ceil(cell),
                Math.ceil(cell)
            );
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

    canvas.classList.toggle(
        "transparent-preview",
        transparentToggle.checked
    );

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

function floodFill(startX, startY) {
    const target = pixels[startY][startX];

    if (target === selectedColor) {
        return false;
    }

    const stack = [[startX, startY]];
    const visited = new Set();
    let changed = false;

    while (stack.length) {
        const [x, y] = stack.pop();

        if (
            x < 0 ||
            y < 0 ||
            x >= resolution ||
            y >= resolution
        ) {
            continue;
        }

        const key = `${x},${y}`;

        if (
            visited.has(key) ||
            pixels[y][x] !== target
        ) {
            continue;
        }

        visited.add(key);
        pixels[y][x] = selectedColor;
        changed = true;

        stack.push(
            [x + 1, y],
            [x - 1, y],
            [x, y + 1],
            [x, y - 1]
        );
    }

    return changed;
}

function paintPixel(x, y) {
    if (selectedTool === "eyedropper") {
        const color = pixels[y][x];

        if (color) {
            selectedColor = color;
            colorPicker.value = color;
        } else {
            selectTool("eraser");
        }

        return false;
    }

    if (selectedTool === "fill") {
        return floodFill(x, y);
    }

    const nextColor = selectedTool === "eraser"
        ? null
        : selectedColor;

    if (pixels[y][x] === nextColor) {
        return false;
    }

    pixels[y][x] = nextColor;
    return true;
}

function drawLine(from, to) {
    let x0 = from.x;
    let y0 = from.y;

    const x1 = to.x;
    const y1 = to.y;

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;

    let error = dx - dy;
    let changed = false;

    while (true) {
        if (paintPixel(x0, y0)) {
            changed = true;
        }

        if (x0 === x1 && y0 === y1) {
            break;
        }

        const twiceError = 2 * error;

        if (twiceError > -dy) {
            error -= dy;
            x0 += sx;
        }

        if (twiceError < dx) {
            error += dx;
            y0 += sy;
        }
    }

    return changed;
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

    toolStatus.textContent = `${names[tool] || tool} selected`;

    canvas.style.cursor = tool === "eyedropper"
        ? "copy"
        : "crosshair";
}

function recordChange(before) {
    if (samePixels(before.pixels, pixels) &&
        before.resolution === resolution) {
        return false;
    }

    history.push(before);

    if (history.length > historyLimit) {
        history.shift();
    }

    redoHistory = [];
    updateHistoryButtons();

    return true;
}

canvas.addEventListener("pointerdown", event => {
    const point = getPixel(event);

    if (!point) return;

    event.preventDefault();

    const before = createSnapshot();

    if (
        selectedTool === "fill" ||
        selectedTool === "eyedropper"
    ) {
        paintPixel(point.x, point.y);
        recordChange(before);
        render();
        return;
    }

    drawing = true;
    lastPixel = point;

    canvas.setPointerCapture(event.pointerId);

    paintPixel(point.x, point.y);
    recordChange(before);
    render();
});

canvas.addEventListener("pointermove", event => {
    const point = getPixel(event);

    cursorStatus.textContent = point
        ? `X: ${point.x + 1}, Y: ${point.y + 1}`
        : "Ready";

    if (!drawing || !point || !lastPixel) {
        return;
    }

    if (
        point.x === lastPixel.x &&
        point.y === lastPixel.y
    ) {
        return;
    }

    drawLine(lastPixel, point);
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

    if (
        !Number.isInteger(newResolution) ||
        newResolution < 1 ||
        newResolution === resolution
    ) {
        resolutionSelect.value = String(resolution);
        return;
    }

    saveHistory();

    pixels = createPixels(newResolution, pixels);
    resolution = newResolution;

    render();
});

gridToggle.addEventListener("change", render);
transparentToggle.addEventListener("change", render);

clearButton.addEventListener("click", () => {
    const hasPixels = pixels.some(row =>
        row.some(pixel => pixel !== null)
    );

    if (!hasPixels) return;

    saveHistory();
    pixels = createPixels(resolution);

    render();
});

undoButton.addEventListener("click", undo);
redoButton.addEventListener("click", redo);

exportButton.addEventListener("click", () => {
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
            const color = pixels[y][x];

            if (!color) continue;

            outputCtx.fillStyle = color;
            outputCtx.fillRect(x, y, 1, 1);
        }
    }

    const link = document.createElement("a");

    link.download = `doodle-pixel-art-${resolution}x${resolution}.png`;
    link.href = output.toDataURL("image/png");
    link.click();
});

pixels = createPixels(resolution);

updateHistoryButtons();
render();
selectTool("pencil");
