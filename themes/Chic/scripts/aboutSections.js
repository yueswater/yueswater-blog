/**
 * about_sections(html): split the rendered About page at its <h2> headings into
 * [{ id, title, body }] so the template can lay each section out as a numbered row.
 * Emoji are dropped from the titles (e.g. "Hi, I'm Anthony 👋"). Anything before the
 * first heading is folded into the first row.
 */
hexo.extend.helper.register('about_sections', function (html) {
  var parts = String(html || '').split(/(?=<h2 id=)/).filter(function (s) { return s.trim(); });
  var out = [];
  var lead = '';
  parts.forEach(function (part) {
    var m = part.match(/^<h2 id="([^"]*)"[^>]*>([\s\S]*?)<\/h2>/);
    if (!m) { lead += part; return; }
    out.push({
      id: m[1],
      title: m[2].replace(/<[^>]+>/g, '').replace(/\s*[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim(),
      body: part.slice(m[0].length)
    });
  });
  if (lead && out.length) out[0].body = lead + out[0].body;
  return out;
});
