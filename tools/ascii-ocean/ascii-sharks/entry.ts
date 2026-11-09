import { OceanEngine } from "./src";

// One ocean per canvas: the home page has one, post pages have two (side gutters and floor).
document.querySelectorAll<HTMLCanvasElement>("canvas.ascii-ocean").forEach((canvas) => {
  new OceanEngine(canvas);
});
