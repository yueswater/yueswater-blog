// Admin inbox with crafted messages. The admin page's demo backend (only on localhost, ?demo=in)
// keeps its inbox in a literal; the test serves demo.js with that literal replaced by rows the spec
// supplies, so hostile messages reach the real rendering code without touching the app's source.
const { mockSupabase } = require('../../../contact/e2e/support/supabase-mock');
const { isolatePage } = require('../../../contact/e2e/support/isolation');
const { PATHS } = require('../../../contact/e2e/support/server');

let nextId = 1000;

// a stored message as contact_list returns it; overrides replace any column
function message(overrides = {}) {
  return {
    id: nextId++, ts: new Date().toISOString(), name: 'Visitor', email: 'visitor@example.com', org: null,
    topic: 'other', body: 'hello there, a plain message', lang: 'zh-TW', path: '/contact/', ip: '203.0.113.9', read_at: null,
    ...overrides,
  };
}

async function seedInbox(page, rows) {
  await page.route(/\/admin\/js\/demo\.js/, async (route) => {
    const res = await route.fetch();
    const src = await res.text();
    const seeded = src.replace('const inbox = [', `const inbox = ${JSON.stringify(rows)} || [`);
    if (seeded === src) throw new Error('demo.js inbox literal not found; update tests/security/e2e/support/admin.js');
    return route.fulfill({ response: res, body: seeded, headers: { ...res.headers(), 'content-type': 'text/javascript' } });
  });
}

// opens the 留言 tab with `rows` as the inbox; returns the Supabase mock (must stay untouched)
async function openInbox(page, rows) {
  await isolatePage(page);
  const supabase = await mockSupabase(page);
  await seedInbox(page, rows);
  await page.goto(PATHS.admin);
  await page.getByRole('button', { name: '留言' }).click();
  await page.locator('.messages > p').first().waitFor();
  return supabase;
}

// expands the n-th message so its body renders
async function expand(page, n = 0) {
  const item = page.locator('.msg').nth(n);
  await item.locator('summary').click();
  await item.locator('.msg-text .ce-doc').waitFor();
  return item;
}

module.exports = { message, seedInbox, openInbox, expand };
