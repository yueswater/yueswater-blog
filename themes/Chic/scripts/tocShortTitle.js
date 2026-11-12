/**
 * LaTeX-style \section[short]{long}: headings whose body text starts with
 * "LeetCode <number>" (e.g. "### [LeetCode 167: Two Sum II - ...](url)")
 * keep their full text in the post body, but get a data-toc="LeetCode 167"
 * attribute added to the <hN> tag -- the TOC sidebar (see toc.ejs) reads
 * this attribute when present and shows just the short form instead of
 * the full heading text, which tocbot otherwise always pulls verbatim
 * from the heading's own text content.
 *
 * Runs on already-rendered HTML (after_post_render), so it doesn't
 * interfere with kramed's own heading id / headerlink generation.
 */
var texSvg = require('./lib/texSvg');

function decodeEntities(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

function escapeAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

var GREEK = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε', theta: 'θ',
  lambda: 'λ', mu: 'μ', pi: 'π', rho: 'ρ', sigma: 'σ', tau: 'τ', phi: 'φ', omega: 'ω',
  Delta: 'Δ', Sigma: 'Σ', Omega: 'Ω'
};

// the text of one formula as plain characters: \lambda -> λ, \text{x} -> x, braces dropped
function plainTex(tex) {
  return tex
    .replace(/\\(?:text|mathrm|mathbf|mathit)\{([^{}]*)\}/g, '$1')
    .replace(/\\([A-Za-z]+)/g, function (m, name) { return GREEK[name] || name; })
    .replace(/[{}\\]/g, '');
}

/**
 * A heading with inline maths ("### 對稱 $Nash$ 均衡") is still raw "$...$" text
 * when tocbot builds the sidebar (MathJax runs later), so the TOC would show the
 * dollar signs. For those headings the label is the heading text with each formula
 * reduced to plain characters ("對稱 Nash 均衡", "$\\lambda$-演算" -> "λ-演算") and
 * footnote markers left out.
 */
function mathLabel(inner) {
  // footnote markers (<sup>) are not part of the title
  var text = decodeEntities(inner.replace(/<sup>[\s\S]*?<\/sup>/g, '').replace(/<[^>]+>/g, ''));
  if (!/\$[^$]+\$/.test(text)) return null;
  return text.replace(/\$([^$]+)\$/g, function (m, tex) { return plainTex(tex); })
    .replace(/\s+/g, ' ').trim();
}

/**
 * Headings are typeset here, at build time, like the titles in lists (lib/texSvg.js): "$N$" in a
 * heading becomes inline SVG, so it shows at once and the page needs no MathJax for it. data-plain
 * is what copying the heading puts on the clipboard (js/post/title-copy.js). Formulas inside
 * <code> are left alone.
 */
function typesetHeading(inner) {
  var inCode = false;
  return inner.split(/(<[^>]+>)/g).map(function (part) {
    if (part.charAt(0) === '<') {
      // the anchor link's tooltip is plain text: no $ in it
      part = part.replace(/ title="([^"]*)"/, function (m, t) { return ' title="' + t.replace(/\$([^$]+)\$/g, '$1') + '"'; });
      if (/^<code[\s>]/i.test(part)) inCode = true;
      else if (/^<\/code>/i.test(part)) inCode = false;
      return part;
    }
    if (inCode) return part;
    return part.replace(/\$([^$]+)\$/g, function (m, escaped) {
      var tex = decodeEntities(escaped);
      return '<span class="title-math" data-plain="' + escapeAttr(plainTex(tex)) + '">' + texSvg(tex) + '</span>';
    });
  }).join('');
}

hexo.extend.filter.register('after_post_render', function (data) {
  data.content = data.content.replace(
    /<(h[1-6]) id="([^"]*)">((?:(?!<\/\1>)[\s\S])*)<\/\1>/g,
    function (full, tag, id, inner) {
      var m = inner.match(/LeetCode\s+(\d+)/);
      var label = m ? 'LeetCode ' + m[1] : mathLabel(inner);
      if (!label) return full;
      return '<' + tag + ' id="' + id + '" data-toc="' + escapeAttr(label) + '">' + typesetHeading(inner) + '</' + tag + '>';
    }
  );
  return data;
}, 30); // after mathProtect.js (priority 20) has turned its tokens back into $...$
