/**
 * Hexo's built-in excerpt filter (after_post_render, priority 10) uses a
 * front-matter `excerpt:` field as-is -- it never runs it through the
 * markdown renderer, so inline markdown like `` `#set` `` shows up as
 * literal backticks instead of styled code. Render it ourselves, once
 * hexo's own filter has set data.excerpt, and strip the wrapping <p> that
 * a single-line markdown render produces (excerpt is used inline).
 */
hexo.extend.filter.register('after_post_render', function (data) {
  if (data.excerpt) {
    const html = hexo.render
      .renderSync({ text: data.excerpt, engine: 'markdown' })
      .trim()
      .replace(/^<p>/, '')
      .replace(/<\/p>$/, '');
    data.excerpt = html;
  }
  return data;
}, 20);
