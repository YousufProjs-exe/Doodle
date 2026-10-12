
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

function createPixels(size) {
    return Array.from({ length: size }, () => Array(size).fill(null));
}

pixels = createPixels(resolution);
render();
