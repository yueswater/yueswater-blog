/**
 * A foldable stretch of body text (not a callout): the text stays plain prose, only hidden until the reader asks.
 * Meant for derivations, so the main line of a post reads without them.
 *
 *   :::: {.fold summary="展開查看數學推導"}
 *   Any markdown: paragraphs, numbered equations (`::: {.equation #eq:x}`), `::: {.example}` callouts, code.
 *   ::::
 *
 * The fence has four colons so that the `:::` blocks inside do not close it. `summary="..."` is the text of the
 * toggle (default: 展開查看數學推導 / Show derivation); `open` as a bare word starts it open. Compiles to
 *
 *   <details class="fold"><summary>...</summary><section class="fold-body">...</section></details>
 *
 * Runs after the other fenced-div filters (priority 16), so the equations (already `$$` blocks) and callouts
 * inside are in their final form. The body is rendered here because kramed does not recurse into raw HTML
 * (same reason as problemDiv.js / theoremDiv.js). References to an equation inside a closed fold open it
 * (js/post/fold.js); css/_pages/post/post_fold.styl.
 */
var FOLD = /^:::: *\{\.fold((?:[ \t]+[^}\n]*)?)\}[ \t]*\n([\s\S]*?)\n::::[ \t]*$/gm;

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (!data.content || data.content.indexOf('{.fold') < 0) return data;
  var en = data.lang === 'en';
  data.content = data.content.replace(FOLD, function (full, attrs, body) {
    var s = /summary="([^"\n]*)"/.exec(attrs);
    var label = s ? s[1] : (en ? 'Show derivation' : '展開查看數學推導');
    var open = /(^|\s)open(\s|$)/.test(attrs.replace(/summary="[^"\n]*"/, ''));
    var html = hexo.render.renderSync({ text: body, engine: 'markdown' });
    // a nested div ends kramed's raw-HTML block early (see admonitionMarkdown.js)
    html = html.replace(/<div class="table-container">([\s\S]*?)<\/div>/g, '<section class="table-container">$1</section>');
    // headings inside a fold stay out of the TOC
    html = html.replace(/<(h[1-6])\b/g, '<$1 class="no-toc"');
    return '\n\n<details class="fold"' + (open ? ' open' : '') + '><summary>' + escapeHtml(label) + '</summary>\n' +
      '<section class="fold-body">\n' + html.trim() + '\n</section></details>\n\n';
  });
  return data;
}, 16);
