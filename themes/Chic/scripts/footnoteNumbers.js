/**
 * Footnotes are written with readable labels ([^zip] ... [^zip]: text), but
 * the page should show numbers, both at the reference and in the list below.
 * Relabel them 1, 2, 3 ... in order of first reference before kramed renders.
 * Fenced code and inline code are left alone.
 */
hexo.extend.filter.register('before_post_render', function (data) {
  var content = data.content;
  if (!/^\[\^[^\]\s]+\]:/m.test(content)) return data;

  var stash = [];
  var hold = function (m) { stash.push(m); return '\u0000' + (stash.length - 1) + '\u0000'; };
  content = content
    .replace(/^(```|~~~)[\s\S]*?^\1[^\n]*$/gm, hold)
    .replace(/`[^`\n]*`/g, hold);

  var defined = {};
  content.replace(/^\[\^([^\]\s]+)\]:/gm, function (m, label) { defined[label] = true; return m; });

  var order = [];
  content.split('\n').forEach(function (line) {
    if (/^\[\^[^\]\s]+\]:/.test(line)) {
      // a definition line may itself reference another note, but its own label is not a reference
      line = line.replace(/^\[\^[^\]\s]+\]:/, '');
    }
    line.replace(/\[\^([^\]\s]+)\]/g, function (m, label) {
      if (defined[label] && order.indexOf(label) === -1) order.push(label);
      return m;
    });
  });
  Object.keys(defined).forEach(function (label) {
    if (order.indexOf(label) === -1) order.push(label);
  });

  content = content.replace(/\[\^([^\]\s]+)\]/g, function (m, label) {
    var i = order.indexOf(label);
    return i === -1 ? m : '[^' + (i + 1) + ']';
  });

  data.content = content.replace(/\u0000(\d+)\u0000/g, function (m, i) { return stash[+i]; });
  return data;
}, 5);
