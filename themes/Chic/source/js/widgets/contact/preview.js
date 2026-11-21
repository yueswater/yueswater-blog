// Preview dialog: shows what the visitor filled in before it is sent. Resolves true on confirm,
// false on "edit" / Escape / backdrop click. The message is rendered read-only by the editor.

export function createPreview(dialog, { strings, editor }) {
  const body = dialog.querySelector('[data-preview-body]');
  const fields = {
    name: dialog.querySelector('[data-preview="name"]'),
    email: dialog.querySelector('[data-preview="email"]'),
    org: dialog.querySelector('[data-preview="org"]'),
    topic: dialog.querySelector('[data-preview="topic"]'),
  };
  let view = null;
  let settle = null;

  const finish = (ok) => {
    if (!settle) return;
    const done = settle;
    settle = null;
    if (dialog.open) dialog.close();
    view && view.destroy();
    view = null;
    body.replaceChildren();
    done(ok);
  };

  dialog.querySelector('[data-preview-ok]').addEventListener('click', () => finish(true));
  dialog.querySelector('[data-preview-edit]').addEventListener('click', () => finish(false));
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); finish(false); });
  // a click on the backdrop lands on the <dialog> itself, outside its inner box
  dialog.addEventListener('click', (e) => { if (e.target === dialog) finish(false); });

  return function open(values) {
    fields.name.textContent = values.name.trim();
    fields.email.textContent = values.email.trim();
    fields.org.textContent = values.org.trim() || strings.preview_none;
    fields.org.classList.toggle('is-empty', !values.org.trim());
    fields.topic.textContent = values.topicLabel;
    view = editor.preview(body);
    dialog.showModal();
    dialog.querySelector('[data-preview-ok]').focus();
    return new Promise((resolve) => { settle = resolve; });
  };
}
