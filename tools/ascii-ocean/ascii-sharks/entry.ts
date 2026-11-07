import { OceanEngine } from "./src";

const canvas = document.getElementById("ascii-ocean") as HTMLCanvasElement | null;
if (canvas) new OceanEngine(canvas);
