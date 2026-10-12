
const canvas = document.getElementById("pixel-canvas");
const ctx = canvas.getContext("2d");
const resolutionSelect = document.getElementById("resolution");
const canvasInfo = document.getElementById("canvas-info");

let resolution = Number(resolutionSelect.value);
let pixels = [];

function createPixels(size) {
    return Array.from({ length: size }, () => Array(size).fill(null));
}
