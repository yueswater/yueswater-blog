#!/usr/bin/env python3
"""One-shot migration: Quarto .qmd (zh-TW only) -> Hexo source/_posts/*.md."""

import re
import shutil
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "source" / "_posts"

SECTIONS = {
    "articles/posts/python": ("Python",),
    "articles/posts/backend": ("後端開發",),
    "articles/posts/typst": ("Typst",),
    "diary/posts": ("日記",),
    "dsa/posts": ("DSA",),
    "projects/posts": ("專案",),
}


def section_for(path: Path) -> str:
    rel = path.relative_to(ROOT).as_posix()
    for prefix, _ in SECTIONS.items():
        if rel.startswith(prefix):
            return SECTIONS[prefix][0]
    return "其他"


def strip_pandoc_attrs(text: str) -> str:
    # drop trailing {...} attribute lists on their own after ), ], or heading text
    text = re.sub(r"\{#[^}]*\}", "", text)
    text = re.sub(r"\{\.[^}]*\}", "", text)
    text = re.sub(r"\{width=\"[^\"]*\"[^}]*\}", "", text)
    text = re.sub(r"\{layout-ncol=\d+\}", "", text)
    return text


def strip_fenced_divs(text: str) -> str:
    lines = text.split("\n")
    out = []
    depth = 0
    for line in lines:
        stripped = line.strip()
        if re.match(r"^:::+\s*\{", stripped) or re.match(r"^:::+\s*$", stripped):
            # opening or closing fence
            if re.match(r"^:::+\s*\{", stripped):
                depth += 1
                continue
            else:
                if depth > 0:
                    depth -= 1
                    continue
        out.append(line)
    return "\n".join(out)


def fix_crossrefs(text: str) -> str:
    return re.sub(r"如\s*​?@fig-[\w-]+\s*​?所示", "如下圖所示", text)


def convert_body(text: str) -> str:
    text = strip_fenced_divs(text)
    text = strip_pandoc_attrs(text)
    text = fix_crossrefs(text)
    # drop "## 定義：..." mini-headers that were callout titles, keep as bold line
    text = re.sub(r"^## 定義：(.+)$", r"**定義：\1**", text, flags=re.MULTILINE)
    return text.strip() + "\n"


def migrate_file(src: Path, dry_run=False):
    raw = src.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.DOTALL)
    if not m:
        print(f"  SKIP (no frontmatter): {src}")
        return
    fm_text, body = m.groups()
    fm = yaml.safe_load(fm_text) or {}

    title = fm.get("title", src.stem)
    date = fm.get("date", "")
    categories = fm.get("categories", [])
    if isinstance(categories, str):
        categories = [categories]
    description = fm.get("description", "")
    section = section_for(src)

    slug = src.stem
    post_dir = src.parent
    images_dir = post_dir / "images"

    new_fm = {
        "title": title,
        "date": str(date),
        "categories": [section] + [c for c in categories if c and c != section],
        "tags": categories,
    }
    if description:
        new_fm["excerpt"] = re.sub(r"<[^>]+>", "", str(description))[:200]
    if "$" in body:
        new_fm["mathjax"] = True

    new_body = convert_body(body)

    if images_dir.is_dir():
        new_body = new_body.replace("images/", "")

    dst_md = POSTS_DIR / f"{slug}.md"
    fm_yaml = yaml.safe_dump(new_fm, allow_unicode=True, sort_keys=False, default_flow_style=False)
    dst_content = f"---\n{fm_yaml}---\n\n{new_body}"

    if dry_run:
        print(f"  would write: {dst_md} ({len(dst_content)} bytes)")
        return

    dst_md.write_text(dst_content, encoding="utf-8")

    if images_dir.is_dir():
        asset_dir = POSTS_DIR / slug
        if asset_dir.exists():
            shutil.rmtree(asset_dir)
        shutil.copytree(images_dir, asset_dir)

    # cover image at series level (../../cover/xxx.png) copy alongside if used
    print(f"  OK: {src.relative_to(ROOT)} -> source/_posts/{slug}.md")


def main():
    dry_run = "--dry-run" in sys.argv
    POSTS_DIR.mkdir(parents=True, exist_ok=True)

    targets = []
    for base in ["articles/posts", "diary/posts", "dsa/posts", "projects/posts"]:
        for p in sorted((ROOT / base).rglob("*.qmd")):
            if p.name.endswith("-en.qmd") or p.name in ("index.qmd", "index-en.qmd"):
                continue
            targets.append(p)

    print(f"Found {len(targets)} zh-TW posts to migrate.\n")
    for p in targets:
        migrate_file(p, dry_run=dry_run)


if __name__ == "__main__":
    main()
