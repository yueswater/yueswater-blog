"""Draw boxes, hand-drawn arrows and labels on a screenshot, from a YAML spec.

    python3 tools/annotate/annotate.py tools/annotate/specs/vscode-go-extension.yml           # render once
    python3 tools/annotate/annotate.py tools/annotate/specs/vscode-go-extension.yml --watch   # redraw whenever the spec changes
    python3 tools/annotate/annotate.py tools/annotate/specs/vscode-go-extension.yml --grid    # also write tools/annotate/grid/<name>.grid.png to read coordinates from

Needs Pillow, NumPy and PyYAML. The arrow sprite is assets/arrow.png (black sketch on white).
"""
import argparse, math, os, sys, time
from collections import deque
from pathlib import Path

import numpy as np
import yaml
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

HERE = Path(__file__).resolve().parent
SS = 2  # supersampling for smooth overlay edges


def rgb(hex_):
    h = hex_.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def find_font(paths):
    for p in paths if isinstance(paths, list) else [paths]:
        p = os.path.expanduser(p)
        if os.path.exists(p):
            return p
    sys.exit("no font found: " + str(paths))


def arrow_sprite():
    a = Image.open(HERE / "assets/arrow.png").convert("RGBA")
    bg = Image.new("RGBA", a.size, (255, 255, 255, 255))
    bg.alpha_composite(a)
    lum = np.array(bg.convert("L")).astype(float)
    alpha = np.clip(255 - lum, 0, 255).astype("uint8")
    s = Image.new("RGBA", a.size, (0, 0, 0, 0))
    s.putalpha(Image.fromarray(alpha))
    return s.crop(s.getbbox())


def draw_arrow(ov, spec, color):
    sp = ImageOps.mirror(arrow_sprite())          # tail top-right, head pointing left-down
    sc, rot = spec.get("scale", 0.2), spec.get("rotate", 0)
    sp = sp.resize((int(sp.width * sc * SS), int(sp.height * sc * SS)), Image.LANCZOS)
    solid = Image.new("RGBA", sp.size, color + (0,))
    solid.putalpha(sp.split()[3])
    sp = solid.rotate(rot, expand=True, resample=Image.BICUBIC)
    th = math.radians(rot)
    v0 = (-0.94, 0.33)                            # head direction before rotating
    v = (v0[0] * math.cos(th) + v0[1] * math.sin(th), -v0[0] * math.sin(th) + v0[1] * math.cos(th))
    ys, xs = np.where(np.array(sp.split()[3]) > 128)
    i = int(np.argmax(xs * v[0] + ys * v[1]))
    tx, ty = int(xs[i]), int(ys[i])               # tip inside the sprite
    ox, oy = int(spec["tip"][0] * SS) - tx, int(spec["tip"][1] * SS) - ty
    ov.alpha_composite(sp, (ox, oy))
    far = int(np.argmax((xs - tx) ** 2 + (ys - ty) ** 2))
    return (ox + int(xs[far])) / SS, (oy + int(ys[far])) / SS   # tail point, for placing a label


def transparent_corners(img):
    a = np.array(img.convert("RGBA"))
    h, w = a.shape[:2]
    near = a[..., :3].astype(int).sum(axis=2) < 30
    R = 110
    allowed = np.zeros((h, w), bool)
    for ys in (slice(0, R), slice(h - R, h)):
        for xs in (slice(0, R), slice(w - R, w)):
            allowed[ys, xs] = True
    seen = np.zeros((h, w), bool)
    q = deque()
    for y, x in ((0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)):
        if near[y, x]:
            q.append((y, x)); seen[y, x] = True
    while q:
        y, x = q.popleft()
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and near[ny, nx] and allowed[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True; q.append((ny, nx))
    soft = Image.fromarray(np.where(seen, 0, 255).astype("uint8")).filter(ImageFilter.GaussianBlur(1.0))
    a[..., 3] = np.minimum(a[..., 3], np.array(soft))
    return Image.fromarray(a)


def crop_window(img):
    """Crop away the black margin around a macOS window screenshot."""
    a = np.array(img.convert("RGB")).astype(int).sum(axis=2)
    h, w = a.shape
    row, col = a[h // 2], a[:, w // 2]
    x0, x1 = int(np.argmax(row > 60)), w - 1 - int(np.argmax(row[::-1] > 60))
    y0, y1 = int(np.argmax(col > 60)), h - 1 - int(np.argmax(col[::-1] > 60))
    return (x0, y0, x1 + 1, y1 + 1)


def render(spec_path, grid=False):
    spec = yaml.safe_load(Path(spec_path).read_text(encoding="utf-8"))
    base = Path(spec_path).resolve().parent
    src = Image.open((base / spec["source"]).resolve()).convert("RGBA")
    W, H = src.size
    color, tcolor = rgb(spec.get("color", "#00ADD8")), rgb(spec.get("text_color", "#007D9C"))
    font_path = find_font(spec.get("font", []))
    ov = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for b in spec.get("boxes", []):
        d.rounded_rectangle([b["x"] * SS, b["y"] * SS, (b["x"] + b["w"]) * SS, (b["y"] + b["h"]) * SS],
                            radius=b.get("radius", 8) * SS, outline=color + (255,), width=b.get("stroke", 5) * SS)
    for a in spec.get("arrows", []):
        tail = draw_arrow(ov, a, color)
        print("arrow tail at", tuple(round(t) for t in tail))
    for l in spec.get("labels", []):
        d.text((l["x"] * SS, l["y"] * SS), l["text"], font=ImageFont.truetype(font_path, l.get("size", 40) * SS), fill=tcolor + (255,))
    out = Image.alpha_composite(src, ov.resize((W, H), Image.LANCZOS))
    if spec.get("window_corners", False):
        box = crop_window(src.convert("RGB"))
        out = transparent_corners(out.crop(box))
    width = spec.get("width")
    if width:
        out = out.resize((width, round(out.height * width / out.width)), Image.LANCZOS)
    dest = (base / spec["output"]).resolve()
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, quality=90, method=6) if dest.suffix == ".webp" else out.save(dest)
    print("wrote", dest, out.size, dest.stat().st_size // 1024, "KB")
    if grid:
        g = src.convert("RGB")
        gd = ImageDraw.Draw(g)
        f = ImageFont.truetype(font_path, 22)
        for x in range(0, W, 100):
            gd.line([(x, 0), (x, H)], fill=(255, 0, 0), width=1 if x % 500 else 3)
            gd.text((x + 4, 4), str(x), font=f, fill=(255, 0, 0))
        for y in range(0, H, 100):
            gd.line([(0, y), (W, y)], fill=(255, 0, 0), width=1 if y % 500 else 3)
            gd.text((4, y + 4), str(y), font=f, fill=(255, 0, 0))
        (HERE / "grid").mkdir(exist_ok=True)
        gp = HERE / "grid" / (dest.stem + ".grid.png")
        g.save(gp)
        print("grid image:", gp)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("spec")
    ap.add_argument("--watch", action="store_true", help="redraw whenever the spec or the source image changes")
    ap.add_argument("--grid", action="store_true", help="also write a coordinate grid over the source image")
    a = ap.parse_args()
    render(a.spec, a.grid)
    if not a.watch:
        return
    spec = yaml.safe_load(Path(a.spec).read_text(encoding="utf-8"))
    files = [Path(a.spec), (Path(a.spec).resolve().parent / spec["source"]).resolve(), HERE / "assets/arrow.png"]
    seen = [f.stat().st_mtime for f in files]
    print("watching", [f.name for f in files], "- Ctrl+C to stop")
    try:
        while True:
            time.sleep(0.4)
            now = [f.stat().st_mtime for f in files]
            if now != seen:
                seen = now
                try:
                    render(a.spec, a.grid)
                except Exception as e:  # keep watching after a typo in the spec
                    print("error:", e)
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
