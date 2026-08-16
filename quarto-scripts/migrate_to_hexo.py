#!/usr/bin/env python3
"""
Quarto (.qmd) -> Hexo (source/_posts/*.md) migration, v2.

Preserves the legacy Quarto/Netlify URL structure as the Hexo slug by
placing each post at source/_posts/<original-relative-path-without-ext>.md
so Hexo's filename-derived slug reproduces the exact old path (permalink
in _config.yml is `:title/`, no date/lang prefix). English posts keep
their `-en` filename suffix in the same folder as the zh version.

Also converts Quarto/Pandoc-specific markup that Hexo/kramed doesn't
understand:
  - ```{=html} raw blocks -> unwrapped literal HTML (kramed would
    otherwise syntax-highlight it as a code block instead of running it)
  - ```{python} chunks -> plain ```python fences
  - ::: {.callout-*} -> hexo-admonition-new !!! blocks (with $$ math
    inside pre-converted to <script type="math/tex"> since kramed's
    $$-autoconversion doesn't run inside the admonition's raw HTML div)
  - ::: {layout-ncol=N} image pairs -> flex <div> of <img> tags
  - remaining ::: fenced divs (tabsets, columns) -> stripped, content
    kept flat
  - pandoc image/table attrs {width=...} {#fig-x} etc. -> stripped or
    translated to plain <img width="...">
  - table caption lines (": caption {#tbl-x}") -> <p class="caption">
  - Quarto crossrefs (@fig-x) -> "下圖"/figure text
"""

import re
import shutil
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "source" / "_posts"

SOURCE_BASES = ["articles/posts", "diary/posts", "dsa/posts", "projects/posts"]

CALLOUT_TITLES = {
    "zh-TW": {"note": "筆記", "tip": "提示", "warning": "警告", "caution": "注意", "important": "重要"},
    "en": {"note": "Note", "tip": "Tip", "warning": "Warning", "caution": "Caution", "important": "Important"},
}
CALLOUT_TYPE_MAP = {
    "note": "info", "tip": "tip", "warning": "warning",
    "caution": "caution", "important": "warning",
}


def fix_code_chunks(text: str) -> str:
    return re.sub(r"^```\{(\w+)[^}]*\}", r"```\1", text, flags=re.MULTILINE)


def fix_raw_html_blocks(text: str) -> str:
    return re.sub(
        r"^```\{=html\}\n(.*?)\n```[ \t]*$",
        lambda m: m.group(1),
        text,
        flags=re.MULTILINE | re.DOTALL,
    )


def fix_crossrefs(text: str) -> str:
    return re.sub(r"如\s*​?@fig-[\w-]+\s*​?所示", "如下圖所示", text)


def md_links_to_html(text: str) -> str:
    # single-line raw HTML (e.g. <p class="caption">...</p>) isn't run back
    # through kramed's markdown pass, so [text](url) has to become a real
    # <a> tag by hand or it shows up as literal bracket/paren text.
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    return re.sub(
        r"\[([^\]]+)\]\((https?://[^)\s]+)\)",
        r'<a href="\2" target="_blank" rel="noopener">\1</a>',
        text,
    )


def convert_table_captions(text: str) -> str:
    def repl(m):
        rest = m.group(1).strip()
        if re.match(r"^\{[^}]*\}$", rest):
            return ""
        caption = re.sub(r"\s*\{[^}]*\}\s*$", "", rest).strip()
        if not caption:
            return ""
        return f'<p class="caption">{md_links_to_html(caption)}</p>'
    return re.sub(r"^: (.+)$", repl, text, flags=re.MULTILINE)


def strip_images_prefix(src: str) -> str:
    return re.sub(r"^images/", "", src)


def img_tag(alt: str, src: str, attrs: str, figure: bool = True) -> str:
    src = strip_images_prefix(src)
    width_m = re.search(r'width="([^"]*)"', attrs)
    width = width_m.group(1) if width_m else None
    width_attr = f' width="{width}"' if width else ""
    tag = f'<img src="{src}" alt="{alt}"{width_attr}>'
    if figure and alt.strip():
        return f"<figure>{tag}<figcaption>{alt}</figcaption></figure>"
    return tag


def convert_layout_ncol(text: str) -> str:
    pattern = re.compile(
        r"^::: \{layout-ncol=\d+\}\n(.*?)\n:::[ \t]*$",
        re.MULTILINE | re.DOTALL,
    )

    def repl(m):
        body = m.group(1)
        imgs = re.findall(r"!\[(.*?)\]\(([^)\s]+)\)(?:\{([^}]*)\})?", body)
        tags = [img_tag(alt, src, attrs or "", figure=False) for alt, src, attrs in imgs]
        joined = "\n".join(tags)
        return f'<div style="display:flex; gap:16px; align-items:center;">\n{joined}\n</div>'

    return pattern.sub(repl, text)


def convert_callouts(text: str, lang: str) -> str:
    lines = text.split("\n")
    out = []
    i = 0
    titles = CALLOUT_TITLES.get(lang, CALLOUT_TITLES["zh-TW"])

    while i < len(lines):
        m = re.match(r"^(:{3,4}) \{\.callout-(\w+)\}\s*$", lines[i])
        if not m:
            out.append(lines[i])
            i += 1
            continue

        fence, ctype = m.group(1), m.group(2)
        i += 1
        body_lines = []
        while i < len(lines) and lines[i].rstrip() != fence:
            body_lines.append(lines[i])
            i += 1
        i += 1  # skip closing fence

        title = titles.get(ctype, ctype.capitalize())
        if body_lines and re.match(r"^#{1,6}\s+", body_lines[0]):
            heading_text = re.sub(r"^#{1,6}\s+", "", body_lines[0])
            heading_text = re.sub(r"\s*\{#[^}]*\}\s*$", "", heading_text)
            title = heading_text.strip()
            body_lines = body_lines[1:]
            if body_lines and body_lines[0].strip() == "":
                body_lines = body_lines[1:]

        body = "\n".join(body_lines)
        body = re.sub(
            r"^\$\$\n(.*?)\n\$\$",
            lambda mm: '<script type="math/tex; mode=display">\n' + mm.group(1) + "\n</script>",
            body,
            flags=re.MULTILINE | re.DOTALL,
        )

        admon_type = CALLOUT_TYPE_MAP.get(ctype, "info")
        indented = "\n".join(("    " + ln) if ln.strip() else "" for ln in body.split("\n"))
        out.append(f'!!! {admon_type} "{title}"')
        out.append(indented)
        out.append("")

    return "\n".join(out)


def strip_remaining_fenced_divs(text: str) -> str:
    lines = text.split("\n")
    out = []
    depth = 0
    for line in lines:
        stripped = line.strip()
        if re.match(r"^:{3,4}\s*\{", stripped):
            depth += 1
            continue
        if re.match(r"^:{3,4}\s*$", stripped):
            if depth > 0:
                depth -= 1
                continue
        out.append(line)
    return "\n".join(out)


def strip_pandoc_attrs(text: str) -> str:
    text = re.sub(r"\{#[^}]*\}", "", text)
    text = re.sub(r"\{\.[^}]*\}", "", text)
    return text


def convert_images_with_attrs(text: str) -> str:
    def repl_with_attrs(m):
        alt, src, attrs = m.group(1), m.group(2), m.group(3)
        return img_tag(alt, src, attrs)

    text = re.sub(r"!\[(.*?)\]\(([^)\s]+)\)\{([^}]*)\}", repl_with_attrs, text)

    def repl_bare(m):
        alt, src = m.group(1), m.group(2)
        return img_tag(alt, src, "")

    return re.sub(r"!\[(.*?)\]\(([^)\s]+)\)", repl_bare, text)


def fix_raw_html_img_src(text: str) -> str:
    return re.sub(r'(<img[^>]*\bsrc=")images/', r"\1", text)


def convert_body(text: str, lang: str) -> str:
    text = fix_raw_html_blocks(text)
    text = fix_code_chunks(text)
    text = convert_layout_ncol(text)
    text = convert_callouts(text, lang)
    text = strip_remaining_fenced_divs(text)
    text = fix_raw_html_img_src(text)
    text = convert_images_with_attrs(text)
    text = strip_pandoc_attrs(text)
    text = convert_table_captions(text)
    text = fix_crossrefs(text)
    return text.strip() + "\n"


def target_rel_path(qmd_path: Path) -> Path:
    rel = qmd_path.relative_to(ROOT).with_suffix(".md")
    return rel


def migrate_file(src: Path, dry_run=False):
    raw = src.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", raw, re.DOTALL)
    if not m:
        print(f"  SKIP (no frontmatter): {src}")
        return
    fm_text, body = m.groups()
    fm = yaml.safe_load(fm_text) or {}

    if not body.strip():
        print(f"  SKIP (empty body): {src}")
        return

    title = fm.get("title", src.stem)
    lang = fm.get("lang", "zh-TW")
    date = fm.get("date", "")
    categories = fm.get("categories", [])
    if isinstance(categories, str):
        categories = [categories]
    description = fm.get("description", "")

    new_fm = {
        "title": title,
        "date": str(date),
        "lang": lang,
        "categories": categories,
        "tags": categories,
    }
    if description:
        new_fm["excerpt"] = re.sub(r"<[^>]+>", "", str(description))[:200]

    new_body = convert_body(body, lang)
    if "$" in new_body:
        new_fm["mathjax"] = True

    rel_target = target_rel_path(src)
    dst_md = POSTS_DIR / rel_target
    images_dir = src.parent / "images"

    fm_yaml = yaml.safe_dump(new_fm, allow_unicode=True, sort_keys=False, default_flow_style=False)
    dst_content = f"---\n{fm_yaml}---\n\n{new_body}"

    if dry_run:
        print(f"  would write: {dst_md}")
        return

    dst_md.parent.mkdir(parents=True, exist_ok=True)
    dst_md.write_text(dst_content, encoding="utf-8")

    if images_dir.is_dir():
        asset_dir = dst_md.with_suffix("")
        if asset_dir.exists():
            shutil.rmtree(asset_dir)
        asset_dir.mkdir(parents=True, exist_ok=True)
        for item in images_dir.iterdir():
            dest_item = asset_dir / item.name
            if item.is_dir():
                shutil.copytree(item, dest_item, dirs_exist_ok=True)
            else:
                shutil.copy2(item, dest_item)

    print(f"  OK: {src.relative_to(ROOT)} -> {dst_md.relative_to(ROOT)}")


def main():
    dry_run = "--dry-run" in sys.argv

    if POSTS_DIR.exists():
        shutil.rmtree(POSTS_DIR)
    POSTS_DIR.mkdir(parents=True)

    targets = []
    for base in SOURCE_BASES:
        for p in sorted((ROOT / base).rglob("*.qmd")):
            if p.name in ("index.qmd", "index-en.qmd"):
                continue
            targets.append(p)

    print(f"Found {len(targets)} posts to migrate (zh + en).\n")
    for p in targets:
        migrate_file(p, dry_run=dry_run)


if __name__ == "__main__":
    main()
