"""
Create a new bilingual article scaffold.

Usage:
    python scripts/new_article.py --series latex --slug math-equations
    python scripts/new_article.py --series python --slug list-comprehension \\
        --title "串列推導式" --title-en "List Comprehensions" --date 2026-06-01

To add a new series, edit scripts/series.yml — no code changes needed.
"""

import argparse
import sys
from datetime import date
from pathlib import Path

try:
    import yaml
except ImportError:
    print("Error: PyYAML not found. Run 'make install' first.")
    sys.exit(1)

# ── Paths ──────────────────────────────────────────────────────────────────────

SCRIPT_DIR       = Path(__file__).parent
SERIES_CONFIG    = SCRIPT_DIR / "series.yml"
POSTS_DIR        = Path("articles/posts")
LANG_SWITCH_FILE = Path("assets/js/lang-switch.js")
LANG_SWITCH_MARK = "  };"  # insert entries just before this line

# ── Templates ──────────────────────────────────────────────────────────────────

ZH_TEMPLATE = """\
---
title: "{title}"
lang: zh-TW
date: {date}
author: Anthony
categories: {categories}
description: ""
image: ../../cover/{cover}
glossary:
  path: ../../../../_glossary/{glossary}
  popup: hover
---
"""

EN_TEMPLATE = """\
---
title: "{title}"
lang: en
date: {date}
author: Anthony
categories: {categories}
description: ""
image: ../../cover/{cover}
glossary:
  path: ../../../../_glossary/{glossary}
  popup: hover
---
"""

LANG_SWITCH_ENTRY = (
    "    // {series}/{slug}\n"
    "    '/articles/posts/{series}/{slug}/{slug}.html':    "
    "'/articles/posts/{series}/{slug}/{slug}-en.html',\n"
    "    '/articles/posts/{series}/{slug}/{slug}-en.html': "
    "'/articles/posts/{series}/{slug}/{slug}.html',"
)

# ── Helpers ────────────────────────────────────────────────────────────────────

def load_series() -> dict:
    if not SERIES_CONFIG.exists():
        print(f"Error: series config not found at {SERIES_CONFIG}")
        sys.exit(1)
    with open(SERIES_CONFIG) as f:
        return yaml.safe_load(f)


def update_lang_switch(series: str, slug: str) -> None:
    marker = f"/articles/posts/{series}/{slug}/{slug}.html"
    text = LANG_SWITCH_FILE.read_text()

    if marker in text:
        print(f"  lang-switch: entry already exists, skipped")
        return

    entry = LANG_SWITCH_ENTRY.format(series=series, slug=slug)
    updated = text.replace(LANG_SWITCH_MARK, entry + "\n" + LANG_SWITCH_MARK, 1)

    if updated == text:
        print(f"  lang-switch: anchor '{LANG_SWITCH_MARK}' not found, skipped")
        return

    LANG_SWITCH_FILE.write_text(updated)
    print(f"  lang-switch: entries added")

# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    all_series = load_series()

    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--series",   required=True,
                        help=f"Series name. Available: {', '.join(all_series)}")
    parser.add_argument("--slug",     required=True,
                        help="URL slug and folder name (e.g. math-equations)")
    parser.add_argument("--title",    default="",
                        help="Chinese title (defaults to slug if omitted)")
    parser.add_argument("--title-en", default="", dest="title_en",
                        help="English title (defaults to slug if omitted)")
    parser.add_argument("--date",     default=str(date.today()),
                        help="Publication date YYYY-MM-DD (defaults to today)")
    args = parser.parse_args()

    series = args.series.lower()

    if series not in all_series:
        print(f"Error: unknown series '{series}'.")
        print(f"Available: {', '.join(all_series)}")
        print(f"To add a new series, edit {SERIES_CONFIG}")
        sys.exit(1)

    cfg        = all_series[series]
    slug       = args.slug
    article_dir = POSTS_DIR / series / slug

    if article_dir.exists():
        print(f"Error: directory already exists — {article_dir}")
        sys.exit(1)

    article_dir.mkdir(parents=True)
    print(f"  created: {article_dir}/")

    zh_file = article_dir / f"{slug}.qmd"
    zh_file.write_text(ZH_TEMPLATE.format(
        title=args.title or slug,
        date=args.date,
        categories=cfg["categories_zh"],
        cover=cfg["cover"],
        glossary=cfg["glossary"],
    ))
    print(f"  created: {zh_file}")

    en_file = article_dir / f"{slug}-en.qmd"
    en_file.write_text(EN_TEMPLATE.format(
        title=args.title_en or slug,
        date=args.date,
        categories=cfg["categories_en"],
        cover=cfg["cover"],
        glossary=cfg["glossary"],
    ))
    print(f"  created: {en_file}")

    update_lang_switch(series, slug)

    print(f"\nDone. Edit the files, then run 'make preview'.")


if __name__ == "__main__":
    main()
