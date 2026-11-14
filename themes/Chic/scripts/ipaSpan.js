/**
 * Puts IPA transcriptions in their own font. In a post with `ipa: true` in the front matter, every
 * /phonemic/ or [phonetic] transcription in the text (the letters between the slashes or brackets
 * are Latin or IPA letters, at most 10 of them) is wrapped in <span class="ipa"> so that
 * css/_pages/post/post_ipa.styl can set it in Charis SIL, a font that has the whole IPA set.
 *
 * Runs on the rendered HTML (after_post_render). Only text between tags is touched, and not the text of
 * <a>, <code>, <pre>, <script> or <style>, so a URL such as "https://doi.org/10.1017/..." is never mistaken
 * for a transcription. A [bracketed] piece counts only if it holds a non-ASCII IPA letter.
 */
// Latin letters (and Latin Extended-A, which has ŋ), IPA Extensions (U+0250-02AF), modifier letters (U+02B0-02FF), combining marks (U+0300-036F)
var LETTERS = 'A-Za-z\\u0100-\\u017F\\u0250-\\u02FF\\u0300-\\u036F';
var SLASHED = new RegExp('/([' + LETTERS + ']{1,10})/', 'g');
var BRACKETED = new RegExp('\\[([' + LETTERS + ']{1,10})\\]', 'g');
var NON_ASCII = /[^\x00-\x7F]/;
var SKIP = /^<(a|code|pre|script|style)[\s>]/i;
var SKIP_END = /^<\/(a|code|pre|script|style)>/i;

function wrap(text) {
  return text
    .replace(SLASHED, '<span class="ipa">/$1/</span>')
    .replace(BRACKETED, function (m, inner) {
      return NON_ASCII.test(inner) ? '<span class="ipa">[' + inner + ']</span>' : m;
    });
}

hexo.extend.filter.register('after_post_render', function (data) {
  if (!data.ipa || !data.content) return data;
  var depth = 0;
  data.content = data.content.split(/(<[^>]+>)/g).map(function (part) {
    if (part.charAt(0) === '<') {
      if (SKIP.test(part)) depth++;
      else if (SKIP_END.test(part)) depth = Math.max(0, depth - 1);
      return part;
    }
    return depth > 0 ? part : wrap(part);
  }).join('');
  return data;
});
