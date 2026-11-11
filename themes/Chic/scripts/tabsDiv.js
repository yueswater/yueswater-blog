/**
 * Tab group written as a fenced div, one `#` heading per tab:
 *
 *   ::: {.tabs}
 *   # macOS
 *   ```bash
 *   brew install go
 *   ```
 *
 *   # Linux
 *   ```bash
 *   sudo snap install go --classic
 *   ```
 *   :::
 *
 * compiles to the markup the theme's tab widget expects (see css/_components/tabset.css and
 * js/post/tabset.js): a `.tabset` with a button row and one `.tabset-panel` per tab, the first
 * tab active. The tab names macOS, Linux and Windows get their brand icon automatically
 * (themes/Chic/source/images/os/). Headings inside fenced code are not tabs, so `# comment`
 * lines in a shell snippet are safe. Panel bodies stay markdown here: admonitionMarkdown.js
 * (priority 15) renders the inside of every `.tabset-panel`, since kramed does not recurse into
 * raw HTML. Outer fence parsed by the shared lib/fencedDiv helper.
 */
var fencedDiv = require('./lib/fencedDiv');

var ICONS = { macos: 'macos', linux: 'linux', windows: 'windows' };

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// split the body at each top-level "# name" line that is not inside a code fence
function splitTabs(body) {
  var tabs = [], cur = null, fence = null;
  body.split('\n').forEach(function (line) {
    var f = /^\s*(```+|~~~+)/.exec(line);
    if (f) {
      if (!fence) fence = f[1].charAt(0);
      else if (f[1].charAt(0) === fence) fence = null;
    }
    var h = !fence && !f && /^#[ \t]+(.+?)[ \t]*$/.exec(line);
    if (h) { cur = { name: h[1], lines: [] }; tabs.push(cur); }
    else if (cur) cur.lines.push(line);
  });
  return tabs;
}

var counter = 0;

hexo.extend.filter.register('before_post_render', function (data) {
  counter = 0;
  data.content = fencedDiv.replaceFencedDivs(data.content, '\\.tabs', function (attrs, body, full) {
    var tabs = splitTabs(body);
    if (!tabs.length) return full;
    var id = 'tabs-' + (++counter), branded = false;
    var nav = tabs.map(function (t, i) {
      var key = ICONS[t.name.toLowerCase()];
      if (key) branded = true;
      var icon = key ? '<svg class="tabset-icon"><use href="/images/os/' + key + '.svg#icon-' + key + '"></use></svg>' : '';
      return '<button class="tabset-btn' + (i ? '' : ' active') + '" data-tab="t' + i + '">' + icon + escapeHtml(t.name) + '</button>';
    }).join('\n');
    var panels = tabs.map(function (t, i) {
      return '<div class="tabset-panel' + (i ? '' : ' active') + '" data-tab="t' + i + '">\n\n' +
        t.lines.join('\n').trim() + '\n\n</div>';
    }).join('\n');
    return '<div class="tabset' + (branded ? ' brand-tabset' : '') + '" id="' + id + '">\n<div class="tabset-nav">\n' +
      nav + '\n</div>\n' + panels + '\n</div>';
  });
  return data;
}, 14);
