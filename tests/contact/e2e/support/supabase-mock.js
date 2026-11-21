// Supabase stand-in. Every request to a supabase.co host is answered here or aborted, so no test
// can reach the real project. Records submit payloads and image uploads; responses are switchable.
const SUPABASE = /\.supabase\.co\//;

async function mockSupabase(page) {
  const state = { submit: { status: 200, body: 'ok' }, upload: { status: 200 }, uploadDelay: 0 };
  const submits = [];
  const uploads = [];
  const stray = [];

  // registered first, so it only handles what the specific routes below leave alone
  await page.route(SUPABASE, (route) => { stray.push(route.request().url()); return route.abort('blockedbyclient'); });

  await page.route(/\/rest\/v1\/rpc\//, async (route) => {
    const url = route.request().url();
    if (!url.includes('/rpc/submit_contact')) return route.fulfill({ status: 204, body: '' });
    submits.push(JSON.parse(route.request().postData() || '{}'));
    const { status, body, abort } = state.submit;
    if (abort) return route.abort('failed');
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.route(/\/storage\/v1\/object\//, async (route) => {
    const req = route.request();
    uploads.push({ name: req.url().split('/').pop(), type: req.headers()['content-type'], method: req.method() });
    if (state.uploadDelay) await new Promise((r) => setTimeout(r, state.uploadDelay));
    return route.fulfill({ status: state.upload.status, contentType: 'application/json', body: '{}' });
  });

  return {
    submits,
    uploads,
    stray,
    respond(body, status = 200) { state.submit = { status, body }; },
    failNetwork() { state.submit = { abort: true }; },
    failUploads(status = 500) { state.upload = { status }; },
    slowUploads(ms) { state.uploadDelay = ms; },
  };
}

module.exports = { mockSupabase };
