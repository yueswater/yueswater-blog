// Shared fixtures for the security specs. Order matters: XSS traps and the network guard go in
// before the Supabase mock and before the page loads, so nothing a payload does slips past them.
const base = require('@playwright/test');
const { mockSupabase } = require('../../../contact/e2e/support/supabase-mock');
const { isolatePage } = require('../../../contact/e2e/support/isolation');
const { ContactPage } = require('../../../contact/e2e/support/contact-page');
const { installTraps } = require('./xss-detector');
const { guardNetwork } = require('./network-guard');

const test = base.test.extend({
  traps: async ({ page }, use) => { await installTraps(page); await use(page); },
  net: async ({ page, traps }, use) => { void traps; await use(await guardNetwork(page)); },
  supabase: async ({ page, net }, use) => {
    void net;
    await isolatePage(page);
    const mock = await mockSupabase(page);
    await use(mock);
    base.expect(mock.stray, 'unmocked Supabase requests').toEqual([]);
  },
  contact: async ({ page, supabase }, use) => {
    void supabase;
    const contact = new ContactPage(page, 'zh');
    await contact.open();
    await use(contact);
  },
});

module.exports = { test, expect: base.expect };
