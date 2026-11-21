// Keeps each test's page stable: the dev server's browser-sync client reloads the page whenever a
// source file changes, which would restart a test halfway. Its script and socket are blocked.
async function isolatePage(page) {
  await page.route(/\/browser-sync\//, (route) => route.abort('blockedbyclient'));
}

module.exports = { isolatePage };
