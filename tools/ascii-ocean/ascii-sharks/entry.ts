import { OceanEngine } from "./src";

// One ocean per canvas: the home page has one, post pages have two (side gutters and floor),
// and every page with a footer has one more in the footer. The footer partial always loads this
// script, so a page that also includes it itself runs it twice: the flag keeps each canvas to one engine.
document.querySelectorAll<HTMLCanvasElement>("canvas.ascii-ocean").forEach((canvas) => {
  if (canvas.dataset.ocean) return;
  canvas.dataset.ocean = "1";
  new OceanEngine(canvas, canvas.hasAttribute("data-school-only") ? [] : undefined);
});
