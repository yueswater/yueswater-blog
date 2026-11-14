/**
 * Merged cells and foldable row groups for a markdown table, written as a fenced div:
 *
 *   ::: {.table-fold}
 *   | 分類 | 型別 | 說明 |
 *   |---|---|---|
 *   | 布林 | `bool` | 真值 |
 *   | 整數 {fold} | `int8`、`int16` | 共 2 種 |
 *   | 整數 | `int8` | 8 位元 |
 *   | ^^ | `int16` | 16 位元 |
 *   :::
 *
 *   ^^         in the first column merges the cell with the one above it (rowspan).
 *   {fold}     marks a summary row: it stands for the rows that follow, which are the group's detail rows
 *              (the first of them starts with the category again, `^^` continues it). The summary row shows
 *              while the group is closed and the detail rows while it is open. `{fold open}` starts open.
 *
 * The category cell of the summary row and the merged cell of the detail rows are both toggle buttons
 * (js/post/table-fold.js flips `hidden` on the rows of one data-group; css/_pages/post/post_table_fold.styl).
 * The table is rendered by the markdown renderer first, so cells keep their inline markdown.
 */
var fencedDiv = require('./lib/fencedDiv');

var FOLD = /\s*\{fold( open)?\}\s*/;

function textOf(html) { return html.replace(/<[^>]+>/g, '').trim(); }

function parseRows(tbody) {
  var rows = [];
  tbody.replace(/<tr>([\s\S]*?)<\/tr>/g, function (m, row) {
    var cells = [];
    row.replace(/<td([^>]*)>([\s\S]*?)<\/td>/g, function (mm, attrs, inner) {
      cells.push({ attrs: attrs, inner: inner, span: 1 });
      return mm;
    });
    rows.push(cells);
    return m;
  });
  return rows;
}

function button(id, open, label) {
  return '<button type="button" class="tf-toggle" data-group="' + id + '" aria-expanded="' + open + '">' + label + '</button>';
}

function cellHtml(c) {
  return '<td' + c.attrs + (c.span > 1 ? ' rowspan="' + c.span + '"' : '') + '>' + c.inner + '</td>';
}

function rowHtml(cells, attrs) {
  return '<tr' + attrs + '>' + cells.map(cellHtml).join('') + '</tr>';
}

function build(html) {
  var thead = (/<thead>[\s\S]*?<\/thead>/.exec(html) || [''])[0];
  var rows = parseRows(/<tbody>([\s\S]*?)<\/tbody>/.exec(html)[1]);
  var out = [], above = null, group = null, n = 0;
  rows.forEach(function (cells) {
    var first = cells[0], plain = textOf(first.inner), fold = FOLD.exec(plain);
    var merge = plain === '^^';
    if (fold) {
      n += 1;
      group = { id: 'tf' + n, open: !!fold[1], started: false };
      first.inner = button(group.id, group.open, first.inner.replace(FOLD, ''));
      above = null;
      out.push({ cells: cells, attrs: ' class="tf-sum" data-group="' + group.id + '"' + (group.open ? ' hidden' : '') });
      return;
    }
    if (group && !merge && group.started) group = null; // a new category ends the group
    if (merge && above) {
      above.span += 1;
      cells.shift();
    } else if (group && !group.started) {
      group.started = true;
      first.inner = button(group.id, group.open, first.inner);
      above = first;
    } else {
      above = first;
    }
    out.push({ cells: cells, attrs: group ? ' class="tf-row" data-group="' + group.id + '"' + (group.open ? '' : ' hidden') : '' });
  });
  // rendered last: a merged cell's rowspan is only known once the rows below it have been seen
  var rowsHtml = out.map(function (r) { return rowHtml(r.cells, r.attrs); }).join('');
  return ('<table>' + thead + '<tbody>' + rowsHtml + '</tbody></table>').replace(/\n/g, '');
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (!data.content || data.content.indexOf('{.table-fold}') < 0) return data;
  data.content = fencedDiv.replaceFencedDivs(data.content, '\\.table-fold', function (attrs, body) {
    return build(hexo.render.renderSync({ text: body, engine: 'markdown' }));
  });
  return data;
}, 14);
