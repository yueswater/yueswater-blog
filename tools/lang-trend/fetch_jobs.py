"""Read the Go demand-trend chart of IT Jobs Watch (UK) back into numbers -> jobs_go.json.

The site only publishes the chart as an image (6-month rolling share of ads), no table, so the values are
read off the plot: gridlines give the axes (y=276 px is 0 %, 80 px = 1 %; x=40 px is 1 Jan 2012, 39.53 px = 1 year),
the orange (Permanent) and blue (Contract) line are traced column by column. Precision is about +-0.05 percentage points.
Chart: https://www.itjobswatch.co.uk/jobs/uk/go.do  (CC BY-NC-SA 4.0)

Usage: python3 tools/lang-trend/fetch_jobs.py
"""
import io
import json
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

HERE = Path(__file__).resolve().parent
URL = "https://www.itjobswatch.co.uk/charts/demand-trend/permanent/m/uk/go.webp"
X0, PX_YEAR, Y0, PX_PCT = 40.0, 39.53, 276.0, 80.0

raw = subprocess.run(["curl", "-sL", "-A", "Mozilla/5.0", URL], check=True, capture_output=True).stdout
im = np.array(Image.open(io.BytesIO(raw)).convert("RGB")).astype(float)
H, W, _ = im.shape
r, g, b = im[..., 0], im[..., 1], im[..., 2]
weights = {
    "permanent": np.clip((r - b) / 231, 0, 1) * (r > b),  # orange
    "contract": np.clip((b - r) / 205, 0, 1) * (b > r),  # blue
}
plot = np.zeros((H, W), bool)
plot[20:280, 41:640] = True  # inside the axes, away from legend and labels


def trace(w):
    ys = np.full(W, np.nan)
    for x in range(W):
        col = np.where(plot[:, x], w[:, x], 0)
        if col.sum() > 0.35:
            ys[x] = (col * np.arange(H)).sum() / col.sum()
    return ys


out = {}
for name, w in weights.items():
    ys = trace(w)
    pts = []
    for k in range(0, 12 * 15):  # month k after Jan 2012
        x = X0 + PX_YEAR * k / 12
        xi = int(round(x))
        if not (41 <= xi < 640) or not np.isfinite(ys[xi]):
            continue
        pts.append([2012 * 12 + k, round(max(0.0, (Y0 - ys[xi]) / PX_PCT), 3)])
    out[name] = pts
    print(name, len(pts), "points; first", pts[0], "last", pts[-1])
(HERE / "jobs_go.json").write_text(json.dumps(out))
