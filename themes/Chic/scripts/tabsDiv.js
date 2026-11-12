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
 * tab active. The tab names macOS, Linux, Windows, Java, Python and Scala get their brand icon automatically
 * (themes/Chic/source/images/os/). Headings inside fenced code are not tabs, so `# comment`
 * lines in a shell snippet are safe. Panel bodies stay markdown here: admonitionMarkdown.js
 * (priority 15) renders the inside of every `.tabset-panel`, since kramed does not recurse into
 * raw HTML.
 *
 * Groups can be nested. The outer fence has more colons than the inner one, and the inner
 * group's tab headings are one level deeper:
 *
 *   :::: {.tabs}
 *   # Java
 *   ::: {.tabs}
 *   ## Rectangle
 *   ...
 *   ## Vehicle
 *   ...
 *   :::
 *   # Python
 *   ...
 *   ::::
 *
 * A group that contains another group is rendered here, not by admonitionMarkdown.js: its
 * panels are written without the blank line after the opening tag, so that filter skips them
 * (its lazy match would otherwise end at the inner group's first panel).
 */
var TABS_RE = /^(:{3,})[ \t]*\{\.tabs\}\n([\s\S]*?)\n\1[ \t]*$/gm;

var ICONS = { macos: 'macos', linux: 'linux', windows: 'windows', java: 'java', python: 'python', scala: 'scala' };

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// split the body at each "# name" line of the group's own heading level (the first heading
// found), skipping lines inside a code fence
function splitTabs(body) {
  var tabs = [], cur = null, fence = null, level = 0;
  body.split('\n').forEach(function (line) {
    var f = /^\s*(```+|~~~+)/.exec(line);
    if (f) {
      if (!fence) fence = f[1].charAt(0);
      else if (f[1].charAt(0) === fence) fence = null;
    }
    var h = !fence && !f && /^(#+)[ \t]+(.+?)[ \t]*$/.exec(line);
    if (h && (!level || h[1].length === level)) {
      level = h[1].length;
      cur = { name: h[2], lines: [] };
      tabs.push(cur);
    } else if (cur) cur.lines.push(line);
  });
  return tabs;
}

var counter = 0;

function hasGroup(text) {
  return /^:{3,}[ \t]*\{\.tabs\}$/m.test(text);
}

// markdown of a panel that holds nested groups: the groups are swapped for placeholders, the
// rest is rendered, then the placeholders are swapped back for the groups' HTML
function renderPanel(text) {
  var groups = [];
  var withHolders = text.replace(TABS_RE, function (full, colons, body) {
    groups.push(buildGroup(body));
    return '\n\nTABSGROUP' + (groups.length - 1) + 'END\n\n';
  });
  var html = hexo.render.renderSync({ text: withHolders, engine: 'markdown' });
  html = html.replace(/<div class="table-container">([\s\S]*?)<\/div>/g, '<section class="table-container">$1</section>');
  return html.replace(/(?:<p>)?TABSGROUP(\d+)END(?:<\/p>)?/g, function (m, i) { return groups[+i]; }).trim();
}

function buildGroup(body) {
  var tabs = splitTabs(body);
  if (!tabs.length) return null;
  var id = 'tabs-' + (++counter), branded = false;
  var nested = tabs.some(function (t) { return hasGroup(t.lines.join('\n')); });
  var nav = tabs.map(function (t, i) {
    var key = ICONS[t.name.toLowerCase()];
    if (key) branded = true;
    var icon = key ? '<svg class="tabset-icon"><use href="/images/os/' + key + '.svg#icon-' + key + '"></use></svg>' : '';
    return '<button class="tabset-btn' + (i ? '' : ' active') + '" data-tab="t' + i + '">' + icon + escapeHtml(t.name) + '</button>';
  }).join('\n');
  var panels = tabs.map(function (t, i) {
    var cls = 'tabset-panel' + (i ? '' : ' active');
    var text = t.lines.join('\n').trim();
    if (nested) return '<div class="' + cls + '" data-tab="t' + i + '">' + renderPanel(text) + '</div>';
    return '<div class="' + cls + '" data-tab="t' + i + '">\n\n' + text + '\n\n</div>';
  }).join('\n');
  return '<div class="tabset' + (branded ? ' brand-tabset' : '') + (nested ? ' tabset-nested-outer' : '') + '" id="' + id + '">\n<div class="tabset-nav">\n' +
    nav + '\n</div>\n' + panels + '\n</div>';
}

hexo.extend.filter.register('before_post_render', function (data) {
  counter = 0;
  data.content = data.content.replace(TABS_RE, function (full, colons, body) {
    return buildGroup(body) || full;
  });
  return data;
}, 14);
