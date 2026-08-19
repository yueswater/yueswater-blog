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
hexo.extend.filter.register('after_post_render', function (data) {
  data.content = data.content.replace(
    /<(h[1-6]) id="([^"]*)">((?:(?!<\/\1>)[\s\S])*)<\/\1>/g,
    function (full, tag, id, inner) {
      var m = inner.match(/LeetCode\s+(\d+)/);
      if (!m) return full;
      return '<' + tag + ' id="' + id + '" data-toc="LeetCode ' + m[1] + '">' + inner + '</' + tag + '>';
    }
  );
  return data;
});
