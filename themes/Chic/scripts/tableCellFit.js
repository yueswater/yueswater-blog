/**
 * Keeps a table inside the text column without breaking its cells in the wrong place. On the rendered table:
 *
 *   header cells (<th>)  may wrap (css thead th). The break should fall between the parts of a header: a unit or
 *                        range in parentheses stays in one piece ("(5% to 95%)", "(seconds per word)") and "÷"
 *                        stays with the word after it ("÷ projection"), by turning the spaces inside such a piece
 *                        into no-break spaces. A parenthesis after a space starts a new line ("Projected median" /
 *                        "(5% to 95%)"), except in the second header line ({sub} row), which is a short name.
 *   short body cells     get class "nw" (white-space: nowrap), so a label like "教學文章" or a number never splits.
 *   longer body cells    may wrap, which is what keeps a wide table from overflowing, but with the same glue: a
 *                        parenthesis stays whole and a number stays with its unit ("11.2 min", "60 lines"), so
 *                        "6.6 (3.7 to 11.2) min" can only break after the 6.6.
 *
 * Only text between tags is touched.
 */
const NBSP = ' ';
const SHORT_CELL = 16; // characters of visible text

function glue(text, lineBreak) {
  return text
    .replace(/\([^()]*\)|（[^（）]*）/g, function (m) { return m.replace(/ /g, NBSP); })
    .replace(lineBreak ? / (?=[(（])/g : /(?!)/g, '<br>')
    .replace(/÷ /g, '÷' + NBSP)
    .replace(/(\d) (?=[A-Za-z])/g, '$1' + NBSP);
}

function visibleLength(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim().length;
}

function gluedText(inner, lineBreak) {
  return inner.split(/(<[^>]+>)/g).map(function (part) {
    return part.charAt(0) === '<' ? part : glue(part, lineBreak);
  }).join('');
}

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.content || data.content.indexOf('<t') < 0) return data;
  data.content = data.content.replace(/<tr([^>]*)>([\s\S]*?)<\/tr>/g, function (m, rowAttrs, row) {
    const sub = /head-sub/.test(rowAttrs);
    row = row
      .replace(/<th([^>]*)>([\s\S]*?)<\/th>/g, function (mm, attrs, inner) {
        return '<th' + attrs + '>' + gluedText(inner, !sub) + '</th>';
      })
      .replace(/<td([^>]*)>([\s\S]*?)<\/td>/g, function (mm, attrs, inner) {
        if (visibleLength(inner) <= SHORT_CELL) return '<td class="nw"' + attrs + '>' + inner + '</td>';
        return '<td' + attrs + '>' + gluedText(inner, false) + '</td>';
      });
    return '<tr' + rowAttrs + '>' + row + '</tr>';
  });
  return data;
});
