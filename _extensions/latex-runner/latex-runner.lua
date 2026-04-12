-- latex-runner.lua
-- Converts:
--
--   ::: {.latex-runner}
--   ```latex
--   \documentclass{article}
--   ...
--   ```
--   :::
--
-- Into the HTML structure expected by latex-runner.html.
-- Optional attribute: engine="lualatex" (default: pdflatex)

function Div(el)
  if not el.classes:includes('latex-runner') then
    return nil
  end

  -- Extract the first CodeBlock inside the div
  local code = nil
  for _, block in ipairs(el.content) do
    if block.t == 'CodeBlock' then
      code = block.text
      break
    end
  end

  if not code then
    return nil
  end

  -- HTML-escape so the raw LaTeX is safe inside <pre>
  local escaped = code
    :gsub('&', '&amp;')
    :gsub('<', '&lt;')
    :gsub('>', '&gt;')

  local engine = el.attributes['engine'] or 'pdflatex'

  local html =
    '<div class="latex-runner" data-engine="' .. engine .. '">' ..
    '<pre class="latex-source">' .. escaped .. '</pre>' ..
    '</div>'

  return pandoc.RawBlock('html', html)
end
