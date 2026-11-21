// Records every request that leaves the local machine, so a spec can assert that rendering a hostile
// message never contacted an outside host (tracking pixels, CSS url(), CDN fonts). Requests to the
// attacker's host are also aborted, so no test ever reaches attacker.example for real; other
// outside requests (the site's own CDNs) are only recorded and left alone.
const LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\//;
const SKIP = /^(data|blob|about):/;
const ATTACKER = /attacker\.example/;

async function guardNetwork(page) {
  const external = [];
  page.on('request', (req) => {
    const url = req.url();
    if (!LOCAL.test(url) && !SKIP.test(url)) external.push(url);
  });
  await page.route(ATTACKER, (route) => route.abort('blockedbyclient'));
  return {
    external,
    to: (pattern) => external.filter((u) => (pattern instanceof RegExp ? pattern.test(u) : u.includes(pattern))),
  };
}

module.exports = { guardNetwork, ATTACKER };
