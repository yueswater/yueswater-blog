/**
 * Minimal BibTeX + natbib-style citations, resolved from a
 * references.bib file sitting next to the post (same sibling-file
 * convention indexImages.js uses for images/). Formats in APA style:
 *
 *   @citet[key]    -> Author (Year)     (textual/narrative)
 *   @citep[key]    -> (Author, Year)    (parenthetical)
 *   @citeyear[key] -> (Year)            (year only)
 *   [references]   -> expands into a full APA reference list, sorted
 *                      by author surname, for every key actually cited
 *                      in the post
 *
 * .bib author fields must use "Last, First" (BibTeX convention),
 * multiple authors joined by " and ".
 */
var fs = require('fs');
var pathFn = require('path');

function parseBibAuthors(raw) {
  return raw.split(/\s+and\s+/).map(function (name) {
    var parts = name.split(',');
    if (parts.length >= 2) {
      return { last: parts[0].trim(), first: parts.slice(1).join(',').trim() };
    }
    var words = name.trim().split(/\s+/);
    return { last: words[words.length - 1], first: words.slice(0, -1).join(' ') };
  });
}

function parseBib(text) {
  var entries = {};
  var entryRe = /@(\w+)\s*\{\s*([^,\s]+)\s*,([\s\S]*?)\n\}/g;
  var m;
  while ((m = entryRe.exec(text)) !== null) {
    var key = m[2];
    var body = m[3];
    var fields = {};
    var fieldRe = /(\w+)\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    var fm;
    while ((fm = fieldRe.exec(body)) !== null) {
      fields[fm[1].toLowerCase()] = fm[2].trim();
    }
    entries[key] = {
      type: m[1],
      fields: fields,
      authors: fields.author ? parseBibAuthors(fields.author) : []
    };
  }
  return entries;
}

function authorListInline(authors) {
  if (authors.length === 0) return 'n.a.';
  if (authors.length === 1) return authors[0].last;
  if (authors.length === 2) return authors[0].last + ' & ' + authors[1].last;
  return authors[0].last + ' et al.';
}

function apaAuthorsFull(authors) {
  var formatted = authors.map(function (a) {
    var initials = a.first
      .split(/\s+/)
      .filter(Boolean)
      .map(function (w) { return w.charAt(0).toUpperCase() + '.'; })
      .join(' ');
    return a.last + ', ' + initials;
  });
  if (formatted.length <= 1) return formatted[0] || 'n.a.';
  if (formatted.length === 2) return formatted[0] + ', & ' + formatted[1];
  return formatted.slice(0, -1).join(', ') + ', & ' + formatted[formatted.length - 1];
}

function apaFullEntryHtml(key, entry) {
  var f = entry.fields;
  var authors = apaAuthorsFull(entry.authors);
  var year = f.year || 'n.d.';
  var title = f.title || '';
  var urlMatch = (f.howpublished || '').match(/\\url\{([^}]*)\}/);
  var url = f.url || (urlMatch ? urlMatch[1] : '');
  var note = f.note ? ' (' + f.note + ')' : '';
  var text = authors + ' (' + year + '). ' + title + '.' + note;
  var link = url ? ' <a target="_blank" rel="noopener" href="' + url + '">' + url + '</a>' : '';
  return '<p class="reference-entry" lang="en" id="ref-' + key + '">' + text.trim() + link + '</p>';
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (!data.full_source) return data;

  var bibPath = pathFn.join(pathFn.dirname(data.full_source), 'references.bib');
  if (!fs.existsSync(bibPath)) return data;

  var entries = parseBib(fs.readFileSync(bibPath, 'utf8'));
  var usedKeys = [];

  data.content = data.content.replace(/@(citet|citep|citeyear)\[([\w:-]+)\]/g, function (match, cmd, key) {
    var entry = entries[key];
    if (!entry) return match;
    if (usedKeys.indexOf(key) === -1) usedKeys.push(key);

    var text;
    if (cmd === 'citet') text = authorListInline(entry.authors) + ' (' + entry.fields.year + ')';
    else if (cmd === 'citep') text = '(' + authorListInline(entry.authors) + ', ' + entry.fields.year + ')';
    else text = '(' + entry.fields.year + ')';

    return '<a class="citation-link" href="#ref-' + key + '">' + text + '</a>';
  });

  if (usedKeys.length) {
    usedKeys.sort(function (a, b) {
      var la = (entries[a].authors[0] || {}).last || '';
      var lb = (entries[b].authors[0] || {}).last || '';
      return la.localeCompare(lb);
    });
    var list = '<div class="references">\n' +
      usedKeys.map(function (k) { return apaFullEntryHtml(k, entries[k]); }).join('\n') +
      '\n</div>';
    data.content = data.content.replace(/\[references\]/, list);
  }

  return data;
}, 10);
