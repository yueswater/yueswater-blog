// Page object for /contact/: intent-level actions, so specs read as behaviour, not selectors.
const { PATHS } = require('./server');

class ContactPage {
  constructor(page, lang = 'zh') {
    this.page = page;
    this.lang = lang;
    this.form = page.locator('form[data-contact]');
    this.doc = page.locator('.ce-doc');
    this.source = page.locator('#cf-body');
    this.submitButton = page.locator('[data-submit]');
    this.toastEl = page.locator('[data-toast]');
    this.topicTrigger = page.locator('#cf-topic');
    this.topicList = page.locator('.cf-select-list');
    this.counter = page.locator('[data-count]');
  }

  // consent is pre-declined so the banner never covers the form
  async open() {
    await this.page.addInitScript(() => {
      try { localStorage.setItem('consent', JSON.stringify({ v: 1, analytics: false, at: new Date().toISOString() })); } catch (e) { /* storage blocked */ }
    });
    await this.page.goto(PATHS[this.lang]);
    await this.doc.waitFor();
  }

  field(name) { return this.page.locator(`[data-field="${name}"]`); }
  input(name) { return this.page.locator(`#cf-${name}`); }
  error(name) { return this.page.locator(`#cf-${name}-err`); }
  tool(action) { return this.page.locator(`.cf-tool[data-action="${action}"]`); }
  tab(mode) { return this.page.locator(`.cf-tab[data-tab="${mode}"]`); }

  async fillContact({ name = '測試者', email = 'tester@example.com', org } = {}) {
    await this.input('name').fill(name);
    await this.input('email').fill(email);
    if (org !== undefined) await this.input('org').fill(org);
  }

  async pickTopic(value = 'collab') {
    await this.topicTrigger.click();
    await this.page.locator(`#cf-topic-${value}`).click();
  }

  async typeMessage(text) {
    await this.doc.click();
    await this.page.keyboard.type(text);
  }

  // load Markdown through the source tab and come back to the rich view
  async setMarkdown(md) {
    await this.tab('source').click();
    await this.source.fill(md);
    await this.tab('rich').click();
  }

  async markdown() { return this.source.inputValue(); }

  async fillValid(overrides = {}) {
    await this.fillContact(overrides);
    await this.pickTopic(overrides.topic || 'collab');
    await this.typeMessage(overrides.body || '這是一則測試留言，內容超過十個字。');
  }

  get preview() { return this.page.locator('[data-preview-dialog]'); }

  // press Send only: validation runs and, if it passes, the preview dialog opens
  async requestSend() { await this.submitButton.click(); }

  // press Send and, when the preview opens, confirm it (the full path to the RPC)
  async submit() {
    await this.requestSend();
    await this.page.locator('[data-preview-ok]').click();
  }

  async toast() {
    await this.toastEl.waitFor({ state: 'visible' });
    return (await this.toastEl.textContent()).trim();
  }
}

module.exports = { ContactPage };
