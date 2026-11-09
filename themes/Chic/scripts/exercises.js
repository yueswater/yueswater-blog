/**
 * Practice questions. One callout holds every question of a section:
 *
 *   ::: exercises
 *   ::: q
 *   Question text (any markdown, code fences included).
 *
 *   - option one
 *   - option two
 *
 *   ::: answer
 *   **Answer: B**
 *
 *   Why.
 *   :::
 *   :::
 *   :::
 *
 * A bare `:::` closes the innermost block. The trailing list of a question becomes its
 * options (lettered A, B, C... by CSS); a question without a list is an open question.
 * The answer sits in a <details>. Layout, numbering and the 4 / 2 / 1 column choice for
 * the options are in _post/post_exercises.styl and js/exercises.js.
 *
 * This filter only builds the HTML skeleton; the markdown inside each `.q-md` div is rendered
 * by admonitionMarkdown.js (kramed does not recurse into raw HTML blocks).
 */
var LABEL = {
  zh: { title: function (n) { return '共 ' + n + ' 題'; }, answer: '顯示答案' },
  en: { title: function (n) { return n + (n === 1 ? ' question' : ' questions'); }, answer: 'Show answer' }
};

function splitOptions(lines) {
  // trailing run of list items (with indented continuation lines) = the options
  var end = lines.length;
  while (end > 0 && lines[end - 1].trim() === '') end--;
  var i = end;
  while (i > 0) {
    var l = lines[i - 1];
    if (/^[-*]\s+\S/.test(l) || /^\s{2,}\S/.test(l)) i--;
    else break;
  }
  // the run must start with a list item
  while (i < end && !/^[-*]\s+\S/.test(lines[i])) i++;
  if (i >= end) return { stem: lines, options: [] };
  return { stem: lines.slice(0, i), options: lines.slice(i, end) };
}

function md(cls, lines) {
  var text = lines.join('\n').replace(/^\n+|\n+$/g, '');
  return '<div class="q-md ' + cls + '">\n\n' + text + '\n\n</div>';
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (!/^:::\s*exercises\b/m.test(data.content)) return data;
  var lang = data.lang && /^en/.test(data.lang) ? 'en' : 'zh';
  var T = LABEL[lang];

  var lines = data.content.split('\n');
  var out = [];
  var inFence = false;
  var stack = [];          // { name, body: [] , title }
  var cur = null;          // innermost block being collected

  var emit = function (s) { (cur ? cur.body : out).push(s); };

  for (var n = 0; n < lines.length; n++) {
    var line = lines[n];
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    var open = !inFence && /^:::\s*([a-z]+)\s*(.*)$/.exec(line);
    var close = !inFence && /^:::\s*$/.test(line);

    if (open && /^(exercises|q|answer)$/.test(open[1])) {
      cur = { name: open[1], title: open[2].trim(), body: [], parent: cur };
      continue;
    }
    if (close && cur) {
      var done = cur;
      cur = cur.parent;
      var html;
      if (done.name === 'answer') {
        html = '<details class="q-answer"><summary>' + T.answer + '</summary>\n' + md('q-answer-body', done.body) + '\n</details>';
      } else if (done.name === 'q') {
        var parts = splitOptions(done.body.filter(function (x) { return typeof x === 'string'; }));
        var kids = done.body.filter(function (x) { return typeof x !== 'string'; });
        var chunk = md('q-stem', parts.stem);
        if (parts.options.length) chunk += '\n' + md('q-options', parts.options);
        html = '<div class="exercise">\n' + chunk + '\n' + kids.map(function (k) { return k.html; }).join('\n') + '\n</div>';
      } else {
        var qs = done.body.filter(function (x) { return typeof x !== 'string'; });
        html = '<div class="exercises" data-title="' + (done.title || T.title(qs.length)) + '">\n' +
          qs.map(function (k) { return k.html; }).join('\n') + '\n</div>';
      }
      if (cur) cur.body.push({ html: html });
      else out.push('', html, '');
      continue;
    }
    emit(line);
  }
  data.content = out.join('\n');
  return data;
}, 9);
