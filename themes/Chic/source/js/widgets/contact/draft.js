// The contact form's draft: name, email, organization, topic and message are kept in localStorage
// (autosave.js) and put back on the next visit. The honeypot is never read. Images are not kept:
// the browser cannot show an upload again after a reload, so the markers are dropped from the saved text.
import { createAutosave } from './autosave.js';

const KEY = 'contact-draft-v1';
const FIELDS = ['name', 'email', 'org', 'topic', 'body'];
const noImages = (md) => String(md).replace(/!\[[^\]\n]*\]\([^)\n]*\)\n?/g, '').trim();

export function initDraft({ form, topic, editor, values }) {
  const autosave = createAutosave({
    key: KEY,
    interval: 10000,
    read: () => {
      const v = values();
      return { name: v.name, email: v.email, org: v.org, topic: v.topic, body: noImages(v.body) };
    },
    isEmpty: (v) => !FIELDS.some((f) => String(v[f] ?? '').trim()),
  });

  const saved = autosave.load();
  if (saved) {
    for (const f of ['name', 'email', 'org']) if (typeof saved[f] === 'string') form.elements[f].value = saved[f];
    if (typeof saved.topic === 'string') topic.set(saved.topic);
    if (typeof saved.body === 'string' && saved.body) editor.setMarkdown(saved.body);
  }
  autosave.start();
  return { clear: () => autosave.clear() };
}
