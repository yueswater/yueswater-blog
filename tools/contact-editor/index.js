// Contact message editor (bundled to themes/Chic/source/js/widgets/contact/editor.bundle.js).
// createContactEditor: WYSIWYG writing with a Markdown source tab; the hidden textarea always
// holds the Markdown that is sent. renderMessage: the same nodes, read-only, for the admin page.
import { Editor } from '@tiptap/core';
import { buildExtensions } from './extensions.js';
import { createPopover } from './popover.js';
import { createUploads } from './uploads.js';
import { wireToolbar } from './toolbar.js';

export function createContactEditor(root, { strings, toast }) {
  const host = root.querySelector('[data-rich]');
  const textarea = root.querySelector('textarea');
  const tabs = [...root.querySelectorAll('[data-tab]')];
  const popover = createPopover(root.querySelector('.cf-textarea-wrap'), strings);
  let editor;
  let tools;
  const uploads = createUploads({ getEditor: () => editor, strings, toast });

  const sync = () => {
    // empty paragraphs come out as &nbsp; lines; drop them and collapse the blank runs they leave
    const md = editor.isEmpty ? '' : editor.getMarkdown().replace(/^(?:&nbsp;|\u00a0)\s*$/gm, '');
    textarea.value = md.replace(/\n{3,}/g, '\n\n').trim();
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  };

  editor = new Editor({
    element: host,
    extensions: buildExtensions({
      strings,
      resolveImage: uploads.resolve,
      onMath: (kind, node, pos) => tools.math(kind, node.attrs.latex, pos),
      placeholder: host.dataset.placeholder,
    }),
    editorProps: {
      attributes: { class: 'ce-doc md', 'aria-labelledby': 'cf-body-label', 'aria-describedby': 'cf-body-err cf-body-count cf-body-hint', role: 'textbox', 'aria-multiline': 'true' },
      handlePaste: (_view, event) => {
        const files = [...(event.clipboardData?.files || [])].filter((f) => f.type.startsWith('image/'));
        if (!files.length) return false;
        uploads.add(files);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = [...(event.dataTransfer?.files || [])].filter((f) => f.type.startsWith('image/'));
        if (!files.length) return false;
        event.preventDefault();
        uploads.add(files);
        return true;
      },
      handleClickOn: (_view, _pos, node) => {
        if (node.type.name !== 'image' || node.attrs.uploading) return false;
        uploads.recrop(node.attrs.src);
        return true;
      },
    },
    onUpdate: sync,
  });

  tools = wireToolbar(root, { editor, popover, strings, uploads, picker: root.querySelector('[data-image-picker]') });
  editor.view.dom.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'k') { e.preventDefault(); tools.link(); }
  });

  function setMode(mode) {
    if (mode === root.dataset.mode) return;
    if (mode === 'rich') editor.commands.setContent(textarea.value, { contentType: 'markdown', emitUpdate: false });
    root.dataset.mode = mode;
    popover.close();
    tabs.forEach((t) => {
      const on = t.dataset.tab === mode;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
  }
  tabs.forEach((t) => {
    t.addEventListener('click', () => { setMode(t.dataset.tab); (t.dataset.tab === 'rich' ? editor.commands.focus() : textarea.focus()); });
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = tabs.find((x) => x !== t);
      next.focus();
      setMode(next.dataset.tab);
    });
  });
  ['dragenter', 'dragover'].forEach((type) => root.addEventListener(type, (e) => {
    if ([...(e.dataTransfer?.types || [])].includes('Files')) root.classList.add('is-drop');
  }));
  ['dragleave', 'drop'].forEach((type) => root.addEventListener(type, () => root.classList.remove('is-drop')));

  root.dataset.mode = 'rich';
  return {
    busy: uploads.busy,
    focus: () => (root.dataset.mode === 'rich' ? editor.commands.focus() : textarea.focus()),
    reset: () => { editor.commands.clearContent(); textarea.value = ''; setMode('rich'); },
  };
}

// read-only rendering of a stored message; resolveImage(name) -> URL or ''
export function renderMessage(el, markdown, { resolveImage = () => '', strings = {} } = {}) {
  const editor = new Editor({
    element: el,
    editable: false,
    extensions: buildExtensions({ strings: { lang_filter: '', ...strings }, resolveImage }),
    content: markdown || '',
    contentType: 'markdown',
    editorProps: { attributes: { class: 'ce-doc md is-readonly' } },
  });
  return editor;
}
