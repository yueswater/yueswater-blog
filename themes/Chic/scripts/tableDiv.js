/**
 * Numbered three-line (booktabs-style) tables:
 *
 *   ::: {#tbl-emip}
 *   Caption text, can have **markdown**.
 *
 *   | term | coef |
 *   |---|---|
 *   | ... | ... |
 *
 *   Optional note under the table: one line, or a "1." list for several notes.
 *   :::
 *
 * Two markers in a row's first cell: "{sub}" turns the row into a second header line, and
 * "{rule}" (in front of the cell text) draws a thin rule above the row.
 *
 * The note gets a "註：" ("Note: ") label and small type. A line right after the table
 * (or before the "1." list) goes on the same line as the label; the numbered items are
 * listed below it. A note that starts straight with "1." puts the label on its own line.
 *
 * compiles to <figure id="tbl-emip" class="tbl"><figcaption><strong>表 1</strong> Caption</figcaption>
 * <table>...</table><p class="tbl-note">note</p></figure>. The caption sits above the
 * table, as tables usually have it; post_content.styl draws only the three rules
 * (top, under the header, bottom).
 *
 * Tables are numbered in document order per post ("表 1" or "Table 1" for lang: en
 * posts), and "@tbl-emip" elsewhere in the post becomes a link showing the number,
 * the same way figureDiv.js handles @fig-.
 */
var fencedDiv = require('./lib/fencedDiv');

var TBL_ATTRS_PATTERN = '#tbl-[\\w-]+';

function renderInline(text) {
  return hexo.render.renderSync({ text: text, engine: 'markdown' })
    .replace(/^<p>/, '').replace(/<\/p>\s*$/, '').trim();
}

// "註：" + one line; or "註：" with the first line right after it and a numbered list below
// (a note that starts straight with "1." puts the label on its own line above the list)
function noteHtml(note, label) {
  var lines = note.split('\n');
  var firstItem = lines.findIndex(function (l) { return /^\d+\.\s/.test(l); });
  if (firstItem < 0) {
    return '<div class="tbl-note"><span class="tbl-note-label">' + label + '</span>' + renderInline(note) + '</div>';
  }
  var lead = lines.slice(0, firstItem).join(' ').trim();
  var list = hexo.render.renderSync({ text: lines.slice(firstItem).join('\n'), engine: 'markdown' }).replace(/\n/g, '');
  return '<div class="tbl-note tbl-note-list' + (lead ? ' tbl-note-lead' : '') + '"><span class="tbl-note-label">' + label + '</span>' +
    (lead ? renderInline(lead) : '') + list + '</div>';
}

// Two row markers, written in the first cell:
//   {sub}   the row is a second header line (the name of the dependent variable under "模型 1"):
//           it moves into <thead>, so the rule under the header comes below it
//   {rule}  a thin rule above the row (the fit statistics under the coefficients)
function specialRows(html) {
  html = html.replace(/<\/tr><\/thead><tbody><tr><td>\{sub\}<\/td>(.*?)<\/tr>/, function (m, cells) {
    return '</tr><tr class="head-sub"><th></th>' + cells.replace(/<td/g, '<th').replace(/<\/td>/g, '</th>') + '</tr></thead><tbody>';
  });
  return html.replace(/<tr><td>\{rule\}\s*/g, '<tr class="rule-above"><td>');
}

// split the body into caption (paragraph before the table), table rows, note (paragraph after)
function splitBody(body) {
  var lines = body.split('\n');
  var first = lines.findIndex(function (l) { return /^\s*\|/.test(l); });
  if (first < 0) return null;
  var last = first;
  while (last + 1 < lines.length && /^\s*\|/.test(lines[last + 1])) last += 1;
  return {
    caption: lines.slice(0, first).join('\n').trim(),
    table: lines.slice(first, last + 1).join('\n'),
    note: lines.slice(last + 1).join('\n').trim()
  };
}

hexo.extend.filter.register('before_post_render', function (data) {
  var word = data.lang === 'en' ? 'Table' : '表';

  var numbers = {};
  var count = 0;
  fencedDiv.findFencedDivs(data.content, TBL_ATTRS_PATTERN).forEach(function (block) {
    count += 1;
    numbers[block.attrs.replace(/^#/, '')] = count;
  });
  if (!count) return data;

  data.content = fencedDiv.replaceFencedDivs(data.content, TBL_ATTRS_PATTERN, function (rawAttrs, body) {
    var id = rawAttrs.replace(/^#/, '');
    var parts = splitBody(body);
    if (!parts) return body;
    // one line of HTML, so the markdown renderer passes the block through untouched
    var tableHtml = specialRows(hexo.render.renderSync({ text: parts.table, engine: 'markdown' }).replace(/\n/g, ''));
    var html = '<figure id="' + id + '" class="tbl"><figcaption><strong>' + word + ' ' + numbers[id] + '</strong> ' +
      renderInline(parts.caption) + '</figcaption>' + tableHtml;
    if (parts.note) html += noteHtml(parts.note, data.lang === 'en' ? 'Note: ' : '註：');
    return html + '</figure>';
  });

  data.content = data.content.replace(/(?<![\w@])@(tbl-[\w-]+)/g, function (match, id) {
    if (!numbers[id]) return match;
    return '[' + word + ' ' + numbers[id] + '](#' + id + ')';
  });

  return data;
}, 14);
