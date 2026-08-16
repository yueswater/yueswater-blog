/**
 * Language-aware reading time. Chinese posts are measured in characters
 * (CJK reading speed ~400 chars/min); everything else is measured in
 * whitespace-separated words (~200 wpm) -- the two scripts read at very
 * different speeds so they can't share one constant.
 */
var CJK_CHARS_PER_MIN = 400;
var EN_WORDS_PER_MIN = 200;

function stripMarkup(html) {
  return String(html)
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

hexo.extend.helper.register('reading_time', function (post) {
  if (!post || !post.content) return 1;
  var text = stripMarkup(post.content);
  var isZh = post.lang && post.lang.indexOf('zh') === 0;
  var minutes;

  if (isZh) {
    var cjkChars = text.match(/[一-鿿㐀-䶿]/g) || [];
    minutes = cjkChars.length / CJK_CHARS_PER_MIN;
  } else {
    var words = text.trim().split(/\s+/).filter(Boolean);
    minutes = words.length / EN_WORDS_PER_MIN;
  }

  return Math.max(1, Math.ceil(minutes));
});
