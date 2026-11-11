"""Download the TIOBE index page and pull the monthly series out of its embedded Highcharts config.

Usage: python3 fetch_tiobe.py   (writes tiobe_series.json next to this file)
Each series is a list of [year, month, rating %]. TIOBE publishes the ten languages on its index page.
"""
import json
import re
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
req = urllib.request.Request("https://www.tiobe.com/tiobe-index/", headers={"User-Agent": "Mozilla/5.0"})
html = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "ignore")
start = html.find("series: [")
end = html.find("]\n  });", start)
block = html[start : end if end > 0 else None]
out = {}
for m in re.finditer(r"\{name\s*:\s*'([^']+)'\s*,\s*data\s*:\s*\[(.*?)\]\s*\}", block, re.S):
    pts = [[int(y), int(mo) + 1, float(v)] for y, mo, _d, v in re.findall(r"Date\.UTC\((\d+),\s*(\d+),\s*(\d+)\),\s*([-\d.]+)", m.group(2))]
    out[m.group(1)] = pts
(HERE / "tiobe_series.json").write_text(json.dumps(out))
for k, v in out.items():
    print(f"{k:14s} {len(v):4d} months, {v[0][:2]} .. {v[-1][:2]}")
