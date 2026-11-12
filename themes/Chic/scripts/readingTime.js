/**
 * Language-aware reading time, from the median speeds in public reading data
 * (see the post articles/statistics/reading-time):
 *
 *   - text: CJK chars / 450 per min (zh posts), from the MECO wave 2 Chinese
 *           readers (median of reader medians about 458), or words / 250 per
 *           min (everything else), from Weller et al. 2020 (median 258)
 *   - code: 2.5 seconds per line inside highlighted code blocks, from EMIP
 *           (about 2.6 s per line, task time including answering)
 *
 * The two parts are added and rounded to whole minutes, at least 1. Headings,
 * images and formulas add nothing: there is no data on their reading cost.
 */
var CJK_CHARS_PER_MIN = 450;
var EN_WORDS_PER_MIN = 250;
var CODE_SECONDS_PER_LINE = 2.5;

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

  var codeMinutes = countCodeLines(post.content) * CODE_SECONDS_PER_LINE / 60;

  return Math.max(1, Math.round(textMinutes + codeMinutes));
});
