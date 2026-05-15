local stringify = pandoc.utils.stringify

local SITE_URL = "https://yueswater.com"
local AUTHOR   = "Anthony Sung"

-- Resolve a (possibly relative) image path to an absolute URL.
-- Relative paths are resolved against the current input file's directory.
local function resolve_image(img, input_file)
  if img:match("^https?://") then return img end
  if img:match("^/") then return SITE_URL .. img end

  -- Relative: combine with input file's directory and normalise `..`
  local dir = input_file:match("(.+)/[^/]+$") or ""
  local abs = dir .. "/" .. img
  local prev
  repeat
    prev = abs
    abs = abs:gsub("/[^/]+/%.%./", "/")
  until abs == prev
  abs = abs:gsub("/[^/]+/%.$", "")

  local rel = abs:match(".+/yueswater%-blog/(.+)$") or abs
  return SITE_URL .. "/" .. rel
end

function Meta(meta)
  local injections = {}

  -- Get current input file path for relative-path resolution
  local input_file = ""
  if quarto and quarto.doc and quarto.doc.input_file then
    input_file = quarto.doc.input_file
  elseif PANDOC_STATE and PANDOC_STATE.input_files and #PANDOC_STATE.input_files > 0 then
    input_file = PANDOC_STATE.input_files[1]
  end

  -- ── JSON-LD ──────────────────────────────────────────────────────────
  local title       = meta.title       and stringify(meta.title)       or ""
  local pagetitle   = meta.pagetitle   and stringify(meta.pagetitle)   or ""
  local description = meta.description and stringify(meta.description) or ""
  local date_str    = meta.date        and stringify(meta.date)        or ""
  local image       = meta.image       and stringify(meta.image)       or "images/og-image.png"

  image = resolve_image(image, input_file)

  local display_title = (pagetitle ~= "" and pagetitle) or title
  local schema_type   = (date_str ~= "") and "BlogPosting" or "WebPage"

  local fields = {
    '"@context": "https://schema.org"',
    '"@type": "' .. schema_type .. '"',
    '"headline": "' .. display_title:gsub('"', '\\"') .. '"',
    '"author": {"@type": "Person", "name": "' .. AUTHOR .. '"}',
    '"image": "' .. image .. '"',
    '"publisher": {"@type": "Organization", "name": "Yueswater Blog", "url": "' .. SITE_URL .. '"}',
  }
  if description ~= "" then
    table.insert(fields, '"description": "' .. description:gsub('"', '\\"') .. '"')
  end
  if date_str ~= "" then
    table.insert(fields, '"datePublished": "' .. date_str .. '"')
  end

  table.insert(injections,
    '<script type="application/ld+json">\n{\n  '
    .. table.concat(fields, ',\n  ')
    .. '\n}\n</script>')

  -- ── hreflang ─────────────────────────────────────────────────────────
  -- Each bilingual page specifies its counterpart via `alternate-lang: /path.html`.
  -- This filter derives both URLs and emits all three <link> tags.
  local alt_path = meta["alternate-lang"] and stringify(meta["alternate-lang"]) or nil
  local lang     = meta.lang and stringify(meta.lang) or nil

  if alt_path and lang then
    local zh_path, en_path

    if lang == "en" then
      -- alt_path is the zh page; derive en from it
      zh_path = alt_path
      en_path = alt_path:gsub("%.html$", "-en.html")
    elseif lang == "zh-TW" then
      -- alt_path is the en page; derive zh from it
      en_path = alt_path
      zh_path = alt_path:gsub("%-en%.html$", ".html")
    end

    if zh_path and en_path then
      local tags = string.format(
        '<link rel="alternate" hreflang="zh-TW" href="%s%s" />\n' ..
        '<link rel="alternate" hreflang="en" href="%s%s" />\n' ..
        '<link rel="alternate" hreflang="x-default" href="%s%s" />',
        SITE_URL, zh_path,
        SITE_URL, en_path,
        SITE_URL, zh_path
      )
      table.insert(injections, tags)
    end
  end

  -- ── Inject into header-includes ──────────────────────────────────────
  if #injections > 0 then
    local existing = meta["header-includes"]
    local list = pandoc.List()
    if existing then
      if existing.t == "MetaList" then
        for _, v in ipairs(existing) do list:insert(v) end
      else
        list:insert(existing)
      end
    end
    for _, html in ipairs(injections) do
      list:insert(pandoc.MetaBlocks({ pandoc.RawBlock("html", html) }))
    end
    meta["header-includes"] = list
  end

  return meta
end
