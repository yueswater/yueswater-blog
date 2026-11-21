// Contact page: wires the custom select, validation, counter, the message editor and submit.
import { initSelect } from './select.js';
import { check, showError, initCounter } from './fields.js';
import { createToast } from './toast.js';
import { createContactEditor } from './editor.bundle.js';

const form = document.querySelector('[data-contact]');
if (form) boot(form);

function boot(form) {
  const S = JSON.parse(document.querySelector('[data-contact-strings]').textContent);
  const toast = createToast(document.querySelector('[data-toast]'));
  const topic = initSelect(form.querySelector('[data-select]'), () => showError(form, 'topic', ''));
  const textarea = form.querySelector('#cf-body');
  const recount = initCounter(textarea, form.querySelector('[data-count]'));
  const button = form.querySelector('[data-submit]');
  const editorRoot = form.querySelector('[data-editor]');
  const editor = createContactEditor(editorRoot, { strings: S, toast });
  const touched = new Set();

  const values = () => ({
    name: form.elements.name.value, email: form.elements.email.value, org: form.elements.org.value, topic: topic.value, body: textarea.value,
  });

  // validate a field once it has been left; afterwards re-check while typing
  for (const name of ['name', 'email', 'body']) {
    const input = form.querySelector(`[name="${name}"]`);
    const leave = name === 'body' ? editorRoot : input;
    leave.addEventListener('focusout', (e) => {
      if (leave.contains(e.relatedTarget)) return; // moving within the editor (toolbar, tabs)
      if (!input.value.trim() && !touched.has(name)) return;
      touched.add(name);
      showError(form, name, S[check(name, input.value)]);
    });
    input.addEventListener('input', () => {
      if (touched.has(name)) showError(form, name, S[check(name, input.value)]);
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (button.disabled) return;
    if (editor.busy()) { toast(S.img_wait, 'warn'); return; }
    const v = values();
    let first = null;
    for (const name of ['name', 'email', 'topic', 'body']) {
      touched.add(name);
      const err = check(name, v[name]);
      showError(form, name, S[err]);
      if (err && !first) first = name;
    }
    if (first) {
      if (first === 'topic') topic.focus();
      else if (first === 'body') editor.focus();
      else form.querySelector(`[name="${first}"]`).focus();
      return;
    }

    setBusy(true);
    try {
      const result = await send(v, form.elements.website.value);
      if (result === 'ok') {
        toast(S.ok, 'ok');
        form.reset();
        topic.reset();
        editor.reset();
        touched.clear();
        recount();
      } else {
        toast(S[result] || S.fail, 'warn');
      }
    } catch {
      toast(S.fail, 'warn');
    } finally {
      setBusy(false);
    }
  });

  function setBusy(on) {
    button.disabled = on;
    button.classList.toggle('is-busy', on);
    button.setAttribute('aria-busy', String(on));
  }
}

async function send(v, trap) {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('not configured');
  const res = await fetch(url + '/rest/v1/rpc/submit_contact', {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      p_name: v.name, p_email: v.email, p_org: v.org, p_topic: v.topic, p_body: v.body,
      p_lang: document.documentElement.lang, p_path: location.pathname, p_trap: trap,
    }),
  });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}
