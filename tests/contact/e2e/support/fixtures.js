// Shared fixtures: every test gets a fresh Supabase mock and a ContactPage bound to it.
const base = require('@playwright/test');
const { mockSupabase } = require('./supabase-mock');
const { ContactPage } = require('./contact-page');
const { isolatePage } = require('./isolation');

const test = base.test.extend({
  supabase: async ({ page }, use) => {
    await isolatePage(page);
    const mock = await mockSupabase(page);
    await use(mock);
    // a stray request means something tried to reach the real project
    base.expect(mock.stray, 'unmocked Supabase requests').toEqual([]);
  },
  lang: ['zh', { option: true }],
  contact: async ({ page, supabase, lang }, use) => {
    void supabase; // routes must exist before the page loads
    const contact = new ContactPage(page, lang);
    await contact.open();
    await use(contact);
  },
});

module.exports = { test, expect: base.expect };
