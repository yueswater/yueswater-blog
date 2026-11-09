# reports

Every post becomes a PDF in the site's own template (cover, header band, styled lists, code, tables),
one folder per post, one file per language.

```
make reports          # convert all posts  -> reports/out/<post>/<zh|en>.pdf   (not tracked by git)
make reports-upload   # push reports/out/ to the public Supabase bucket "pdfs"   (needs the service-role key)
```

Both steps run on this machine. The PDFs are not committed; the site links to the bucket.

```
template/theme.typ       palette, fonts (edit this to restyle)
template/template.typ    cover, header, footer, figures, contents
template/assets/         logo (white + ink)
tools/build.mjs          every post under source/_posts: Markdown -> Typst -> PDF
tools/upload.mjs         reports/out -> Supabase Storage
```

Diary entries are skipped (`SKIP` in `tools/build.mjs`, and the button is hidden for them in `post.ejs`).

`node reports/tools/build.mjs line-sticker` converts only the posts whose path contains that text.

## Needs

- `typst` (Homebrew), with Roboto, Noto Sans TC and JetBrains Mono installed.
- `.env` (untracked) with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` for the upload. The service-role
  key bypasses row-level security: keep it out of the repo and out of the theme config.
- Math uses the `@preview/mitex` package, which Typst downloads on first use.

## Site side

`pdf_enable: true` in `themes/Chic/_config.yml` shows the download button on every post. The link is
`<supabase_url>/storage/v1/object/public/pdfs/<post path>/<zh|en>.pdf?download=<file name>`; the
`download` parameter makes Supabase save it as `岳氏礦泉水-<title>.pdf` or `Yueswater-<title>.pdf`.
Download counts reuse the `page_views` counter, keyed by `/<post path>/<zh|en>.pdf`.

## Converter coverage

Headings, paragraphs, emphasis, links, inline code, fenced code, lists, tables, blockquotes, images and
`<figure>`s, the theme's tab sets, footnotes, and LaTeX math (inline `$..$`, block `$$..$$`).
Anything else is reported as `unhandled token` and left out of the PDF.
