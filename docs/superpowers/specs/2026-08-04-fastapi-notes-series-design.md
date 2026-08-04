# FastAPI Notes Series — Design

## Goal

Add a new bilingual (zh-TW + en) note series under `articles/posts/fastapi/`,
covering 3 progressively harder practice projects:

1. Simplest — Todo App
2. Mid — project with login/auth
3. Larger project (topic TBD)

Each project is broken into multiple short notes (one concept per note),
matching the style of the existing `python` series, rather than one long
build-log article per project.

## Directory & naming

`scripts/new_article.py` only supports one nesting level
(`articles/posts/<series>/<slug>/`). No script change needed — project
grouping is encoded as a slug prefix, not a real subfolder:

```
articles/posts/fastapi/
  todo-routing/
  todo-crud/
  todo-pydantic-models/
  auth-jwt/
  auth-db-relations/
  advanced-*/              # topic TBD
```

Each slug folder gets `slug.qmd` + `slug-en.qmd` via the existing scaffold
script.

## series.yml entry

```yaml
fastapi:
  cover: FastAPI_logo.png
  glossary: fastapi.yml
  categories_zh: "[FastAPI, 程式語言]"
  categories_en: "[FastAPI, Programming Languages]"
```

## Glossary seed file

New `_glossary/fastapi.yml`, same format as `_glossary/python.yml`, used by
the existing hover-glossary Quarto extension. Seeded with a handful of core
terms: path operation, dependency injection, Pydantic model, ASGI,
middleware. Grows over time as notes are written.

## Cover image

`articles/posts/cover/FastAPI_logo.png` — same slot as `Python_logo.png`.
Not fetched automatically (file download requires explicit user action);
user supplies this file themselves.

## Project tagging

`new_article.py` applies one fixed `categories_zh`/`categories_en` per
series call — no per-article override. To let readers filter by project
(Todo / Auth / Advanced) on the `articles/index.qmd` hub (which already has
`categories: true` + `filter-ui: true`), hand-edit the generated
`categories:` frontmatter line per note to append the project name, e.g.
`[FastAPI, Todo App]`.

## Explicitly out of scope

- No changes to `new_article.py`, `netlify.toml`, or `articles/index.qmd`.
- No real nested subfolders per project (flat slug namespace only).
- Project 3's concrete topic is undecided; slug names for it are placeholders
  until the user picks a topic.
