/**
 * Minimal BibTeX + natbib-style citations, resolved from a
 * references.bib file sitting next to the post (same sibling-file
 * convention indexImages.js uses for images/). Formats in APA style:
 *
 *   @citet[key]    -> Author (Year)     (narrative; two authors: "A and B")
 *   @citep[key]    -> (Author, Year)    (parenthetical; two authors: "A & B")
 *   @citep[k1,k2]  -> (A, 1974; B, 1967) (several works, sorted, one pair of parentheses)
 *   @citeyear[key] -> (Year)            (year only)
 *   @citep[key|p. 291]  -> (Author, Year, p. 291)   (page / locator, one work only;
 *   @citet[key|p. 291]  -> Author (Year, p. 291)     also pp. 3-5, chap. 2 ...)
 *   [references]   -> expands into an APA 7 reference list, sorted by
 *                      author surname then year, for every key actually
 *                      cited in the post. @article, @incollection/@inbook,
 *                      @book get their own layout (journal, volume(issue),
 *                      pages, editors, booktitle, publisher, DOI);
 *                      @online (news article, web page) prints (Year, Month Day), title,
 *                      site and url; anything else (@misc ...) prints title, note and url.
 *
 * .bib author fields must use "Last, First" (BibTeX convention),
 * multiple authors joined by " and ".
 * An organisation is written with double braces, author = {{TIOBE Software BV}}, and is printed as is.
 */
var fs = require('fs');
var pathFn = require('path');

function parseBibAuthors(raw) {
  return raw.split(/\s+and\s+/).map(function (name) {
    // {Organisation name} (written {{...}} in the .bib file) is one unit: no first name, no initials
    var corp = name.trim().match(/^\{([^{}]+)\}$/);
    if (corp) return { last: corp[1].trim(), first: '' };
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

function authorListInline(authors, parenthetical) {
  if (authors.length === 0) return 'n.a.';
  if (authors.length === 1) return authors[0].last;
  if (authors.length === 2) return authors[0].last + (parenthetical ? ' & ' : ' and ') + authors[1].last;
  return authors[0].last + ' et al.';
}

function apaAuthorsFull(authors) {
  var formatted = authors.map(function (a) {
    if (!a.first) return a.last;
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

function esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// "J. M. Buchanan, R. D. Tollison, & G. Tullock" -- editors read initials first
function apaEditors(authors) {
  var names = authors.map(function (a) {
    var initials = a.first.split(/\s+/).filter(Boolean).map(function (w) { return w.charAt(0).toUpperCase() + '.'; }).join(' ');
    return (initials ? initials + ' ' : '') + a.last;
  });
  if (names.length <= 1) return names[0] || '';
  if (names.length === 2) return names[0] + ' & ' + names[1];
  return names.slice(0, -1).join(', ') + ', & ' + names[names.length - 1];
}

function enDash(pages) {
  return String(pages).replace(/\s*-{1,3}\s*|\u2014/g, '\u2013');
}

// a title ends with a full stop unless it already ends with ? or !
function endStop(t) {
  return /[.?!]$/.test(t) ? t : t + '.';
}

function linkOf(f) {
  var urlMatch = (f.howpublished || '').match(/\\url\{([^}]*)\}/);
  var url = f.doi ? 'https://doi.org/' + f.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, '') : (f.url || (urlMatch ? urlMatch[1] : ''));
  return url ? ' <a target="_blank" rel="noopener" href="' + url + '">' + url + '</a>' : '';
}

function apaFullEntryHtml(key, entry) {
  var f = entry.fields;
  var authors = apaAuthorsFull(entry.authors);
  var year = f.year || 'n.d.';
  var title = esc(f.title || '');
  var head = authors + ' (' + year + '). ';
  var text;
  var type = entry.type.toLowerCase();

  if (type === 'article') {
    // Author. (Year). Title. Journal, volume(issue), pages. DOI
    var src = f.journal ? '<em>' + esc(f.journal) + '</em>' : '';
    if (f.volume) src += ', <em>' + esc(f.volume) + '</em>' + (f.number ? '(' + esc(f.number) + ')' : '');
    if (f.pages) src += ', ' + enDash(f.pages);
    text = head + endStop(title) + (src ? ' ' + src + '.' : '');
  } else if (type === 'incollection' || type === 'inbook' || type === 'inproceedings') {
    // Author. (Year). Title. In E. Editor (Eds.), Book title (pp. xx-xx). Publisher.
    var eds = f.editor ? parseBibAuthors(f.editor) : [];
    var inPart = 'In ' + (eds.length ? esc(apaEditors(eds)) + ' (' + (eds.length > 1 ? 'Eds.' : 'Ed.') + '), ' : '') +
      '<em>' + esc(f.booktitle || '') + '</em>' + (f.pages ? ' (pp. ' + enDash(f.pages) + ')' : '') + '.';
    text = head + endStop(title) + ' ' + inPart + (f.publisher ? ' ' + esc(f.publisher) + '.' : '');
  } else if (type === 'book') {
    // Author. (Year). Title (edition). Publisher.
    text = head + '<em>' + endStop(title).replace(/\.$/, '') + '</em>' + (f.edition ? ' (' + esc(f.edition) + ' ed.)' : '') + '.' +
      (f.publisher ? ' ' + esc(f.publisher) + '.' : '');
  } else if (type === 'online') {
    // news article / web page: Author. (Year, Month Day). Title. Site name. URL
    var date = year + (f.month ? ', ' + esc(f.month) + (f.day ? ' ' + esc(f.day) : '') : '');
    text = authors + ' (' + date + '). ' + endStop(title) + (f.site ? ' ' + esc(f.site) + '.' : '');
  } else {
    var note = f.note ? ' (' + esc(f.note) + ')' : '';
    text = head + endStop(title) + note;
  }
  return '<p class="reference-entry" lang="en" id="ref-' + key + '">' + text.trim() + linkOf(f) + '</p>';
}

// first author surname, then the rest of the authors, then year
function sortKey(entry) {
  var names = entry.authors.map(function (a) { return a.last + ' ' + a.first; }).join(' ');
  return names.toLowerCase() + ' ' + (entry.fields.year || '');
}

hexo.extend.filter.register('before_post_render', function (data) {
  if (!data.full_source) return data;

  var bibPath = pathFn.join(pathFn.dirname(data.full_source), 'references.bib');
  if (!fs.existsSync(bibPath)) return data;

  var entries = parseBib(fs.readFileSync(bibPath, 'utf8'));
  var usedKeys = [];

  function mark(key) {
    if (usedKeys.indexOf(key) === -1) usedKeys.push(key);
  }

  data.content = data.content.replace(/@(citet|citep|citeyear)\[([\w:,\s-]+)(?:\|([^\]\n]+))?\]/g, function (match, cmd, raw, locator) {
    var keys = raw.split(',').map(function (k) { return k.trim(); }).filter(Boolean);
    if (!keys.length || keys.some(function (k) { return !entries[k]; })) return match;
    keys.forEach(mark);

    // several works in one pair of parentheses are sorted by surname, then year
    keys.sort(function (a, b) {
      return sortKey(entries[a]).localeCompare(sortKey(entries[b]));
    });
    var link = function (k, text) {
      return '<a class="citation-link" href="#ref-' + k + '">' + text + '</a>';
    };

    // "|p. 291": a locator after the year, for a single work
    var loc = locator && keys.length === 1 ? ', ' + esc(locator.trim().replace(/-{1,2}/g, '\u2013')) : '';
    if (cmd === 'citet') {
      return keys.map(function (k) {
        return link(k, authorListInline(entries[k].authors, false) + ' (' + entries[k].fields.year + loc + ')');
      }).join(', ');
    }
    var parts = keys.map(function (k) {
      var e = entries[k];
      return link(k, cmd === 'citep' ? authorListInline(e.authors, true) + ', ' + e.fields.year + loc : e.fields.year + loc);
    });
    return '(' + parts.join('; ') + ')';
  });

  if (usedKeys.length) {
    usedKeys.sort(function (a, b) {
      return sortKey(entries[a]).localeCompare(sortKey(entries[b]));
    });
    var list = '<div class="references">\n' +
      usedKeys.map(function (k) { return apaFullEntryHtml(k, entries[k]); }).join('\n') +
      '\n</div>';
    data.content = data.content.replace(/\[references\]/, list);
  }

  return data;
}, 10);
