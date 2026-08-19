/**
 * Language-aware, weighted reading time. Three cost components are each
 * estimated in minutes, then scaled by their own weight before summing:
 *
 *   - text:    CJK chars / 400 per min (zh posts) or words / 200 per min
 *              (everything else) -- reading speed differs a lot by script
 *   - code:    lines inside fenced code blocks / 40 per min -- tracing
 *              through logic is much slower than reading prose, and the
 *              old version excluded code entirely
 *   - heading: h3/h4 count * a per-heading context-switch cost (20s / 10s)
 *              -- more subsections means more mental gear-shifting, even
 *              at the same word/line count
 *
 * Weights (TEXT/HEADING/CODE) are a deliberately tuned judgment call, not
 * a formula with a "correct" answer -- adjust the constants below to
 * retune the estimate.
 */
var CJK_CHARS_PER_MIN = 400;
var EN_WORDS_PER_MIN = 200;
var CODE_LINES_PER_MIN = 40;
var H3_SECONDS = 20;
var H4_SECONDS = 10;

var TEXT_WEIGHT = 1.5;
var HEADING_WEIGHT = 1.2;
var CODE_WEIGHT = 1.3;

function stripMarkup(html) {
  return String(html)
    .replace(/<pre[\s\S]*?<\/pre>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
}

// Hexo's highlighter (line_number: true) wraps each code block as a
// gutter <td> (line numbers) + a code <td class="code"> -- both contain
// one <br>-separated <pre><span class="line">...</span> per source line,
// so only the "code" td is counted to avoid double-counting via the gutter.
function countCodeLines(html) {
  var blocks = String(html).match(/<td class="code"><pre>[\s\S]*?<\/pre><\/td>/g) || [];
  var lines = 0;
  blocks.forEach(function (block) {
    lines += (block.match(/<br>/g) || []).length;
  });
  return lines;
}

function countHeadings(html, tag) {
  var re = new RegExp('<' + tag + '[ >]', 'g');
  return (String(html).match(re) || []).length;
}

hexo.extend.helper.register('reading_time', function (post) {
  if (!post || !post.content) return 1;

  var isZh = post.lang && post.lang.indexOf('zh') === 0;
  var text = stripMarkup(post.content);
  var textMinutes;
  if (isZh) {
    var cjkChars = text.match(/[一-鿿㐀-䶿]/g) || [];
    textMinutes = cjkChars.length / CJK_CHARS_PER_MIN;
  } else {
    var words = text.trim().split(/\s+/).filter(Boolean);
    textMinutes = words.length / EN_WORDS_PER_MIN;
  }

  var codeMinutes = countCodeLines(post.content) / CODE_LINES_PER_MIN;

  var h3Count = countHeadings(post.content, 'h3');
  var h4Count = countHeadings(post.content, 'h4');
  var headingMinutes = (h3Count * H3_SECONDS + h4Count * H4_SECONDS) / 60;

  var total =
    textMinutes * TEXT_WEIGHT +
    headingMinutes * HEADING_WEIGHT +
    codeMinutes * CODE_WEIGHT;

  return Math.max(1, Math.ceil(total));
});
