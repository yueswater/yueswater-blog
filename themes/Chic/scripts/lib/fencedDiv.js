/**
 * Shared parser for this theme's Quarto-style fenced div blocks:
 *
 *   ::: {attrs}
 *   body
 *   :::
 *
 * Used by any before_post_render filter that needs its own `::: {...}`
 * syntax (figureDiv.js's `::: {#fig-...}`, problemDiv.js's
 * `::: {.problem}`, etc.) -- each filter supplies its own `attrsPattern`
 * (the regex source matched inside `{}`) and gets back either the raw
 * matches (to scan without modifying, e.g. for numbering) or the content
 * with every match replaced by a handler's return value.
 *
 * attrsPattern is wrapped in its own capturing group internally, so it
 * must NOT contain a top-level capturing group of its own (use `(?:...)`
 * for grouping without capturing) -- otherwise the group indices this
 * module relies on for `body` shift and parsing breaks silently.
 *
 * Plain CommonJS module, no hexo.extend calls -- safe to `require()` from
 * another script even if Hexo's script loader also runs this file once
 * on its own (it has no side effects either way).
 */
function buildRegex(attrsPattern) {
  return new RegExp('^::: *\\{(' + attrsPattern + ')\\}\\n([\\s\\S]*?)\\n?:::[ \\t]*$', 'gm');
}

function findFencedDivs(content, attrsPattern) {
  var re = buildRegex(attrsPattern);
  var results = [];
  var m;
  while ((m = re.exec(content)) !== null) {
    results.push({ attrs: m[1], body: m[2], match: m[0] });
  }
  return results;
}

function replaceFencedDivs(content, attrsPattern, handler) {
  var re = buildRegex(attrsPattern);
  return String(content).replace(re, function (full, attrs, body) {
    return handler(attrs, body, full);
  });
}

module.exports = {
  findFencedDivs: findFencedDivs,
  replaceFencedDivs: replaceFencedDivs
};
