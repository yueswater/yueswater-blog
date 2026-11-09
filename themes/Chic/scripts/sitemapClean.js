/**
 * Tidy the sitemap written by hexo-generator-sitemap: list each page at its
 * canonical address (no trailing "index.html"), drop noindex pages such as the
 * 404 page, and drop duplicates.
 */
hexo.extend.filter.register('after_generate', function () {
  var route = hexo.route;
  var get = route.get('sitemap.xml');
  if (!get) return;
  return new Promise(function (resolve, reject) {
    var chunks = [];
    get.on('data', function (c) { chunks.push(Buffer.from(c)); });
    get.on('error', reject);
    get.on('end', function () {
      var xml = Buffer.concat(chunks).toString('utf8');
      var seen = {};
      xml = xml.replace(/<url>[\s\S]*?<\/url>/g, function (block) {
        var m = block.match(/<loc>([^<]*)<\/loc>/);
        if (!m) return block;
        var loc = m[1].replace(/index\.html$/, '');
        if (/\/404(\.html|\/)?$/.test(loc) || seen[loc]) return '';
        seen[loc] = true;
        return block.replace(m[1], loc);
      });
      route.set('sitemap.xml', xml);
      resolve();
    });
  });
});
