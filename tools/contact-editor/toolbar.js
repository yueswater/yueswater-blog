// Toolbar: every [data-action] button runs a command; buttons for marks and blocks show
// their on/off state for the current selection.
import katex from 'katex';

const ACTIVE = {
  bold: (e) => e.isActive('bold'),
  italic: (e) => e.isActive('italic'),
  code: (e) => e.isActive('code'),
  link: (e) => e.isActive('link'),
  bullet: (e) => e.isActive('bulletList'),
  ordered: (e) => e.isActive('orderedList'),
  block: (e) => e.isActive('codeBlock'),
};

const tex = (latex, displayMode) => {
  if (!latex.trim()) return '';
  try { return katex.renderToString(latex, { throwOnError: false, displayMode }); } catch { return ''; }
};

export function wireToolbar(root, { editor, popover, strings, uploads, picker }) {
  const link = () => {
    const prev = editor.getAttributes('link').href || '';
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, ' ');
    popover.open({
      title: strings.tool_link,
      fields: [
        { name: 'url', label: strings.link_url, value: prev, placeholder: 'https://' },
        ...(prev || selected ? [] : [{ name: 'text', label: strings.link_text }]),
      ],
      validate: ({ url }) => (/^(https?:\/\/)?[^\s]+\.[^\s]+$/i.test(url.trim()) ? '' : strings.link_bad),
      onRemove: prev ? () => editor.chain().focus().extendMarkRange('link').unsetLink().run() : null,
      onOk: ({ url, text }) => {
        const href = /^https?:\/\//i.test(url.trim()) ? url.trim() : 'https://' + url.trim();
        const chain = editor.chain().focus().extendMarkRange('link');
        if (!prev && !selected) chain.insertContent({ type: 'text', text: text?.trim() || href, marks: [{ type: 'link', attrs: { href } }] }).run();
        else chain.setLink({ href }).run();
      },
    });
  };

  const math = (kind, current, pos) => {
    popover.open({
      title: kind === 'block' ? strings.tool_math_block : strings.tool_math,
      fields: [{ name: 'latex', label: 'LaTeX', value: current || '', multiline: kind === 'block', mono: true, placeholder: kind === 'block' ? '\\int_0^1 x^2\\,dx' : 'e^{i\\pi}+1=0' }],
      preview: ({ latex }) => tex(latex, kind === 'block'),
      validate: ({ latex }) => (latex.trim() ? '' : strings.math_empty),
      okLabel: current ? strings.update : strings.add,
      onRemove: current ? () => editor.chain().setNodeSelection(pos).deleteSelection().focus().run() : null,
      onOk: ({ latex }) => {
        const c = editor.chain().focus();
        if (current && kind === 'block') c.updateBlockMath({ latex, pos }).run();
        else if (current) c.updateInlineMath({ latex, pos }).run();
        else if (kind === 'block') c.insertBlockMath({ latex }).run();
        else c.insertInlineMath({ latex }).run();
      },
    });
  };

  const RUN = {
    bold: () => editor.chain().focus().toggleBold().run(),
    italic: () => editor.chain().focus().toggleItalic().run(),
    code: () => editor.chain().focus().toggleCode().run(),
    bullet: () => editor.chain().focus().toggleBulletList().run(),
    ordered: () => editor.chain().focus().toggleOrderedList().run(),
    block: () => editor.chain().focus().toggleCodeBlock().run(),
    link,
    math: () => math('inline'),
    mathBlock: () => math('block'),
    image: () => picker.click(),
  };

  const buttons = [...root.querySelectorAll('[data-action]')];
  buttons.forEach((b) => {
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => RUN[b.dataset.action]?.());
  });
  const refresh = () => buttons.forEach((b) => {
    const test = ACTIVE[b.dataset.action];
    if (test) b.setAttribute('aria-pressed', String(test(editor)));
  });
  editor.on('selectionUpdate', refresh);
  editor.on('transaction', refresh);
  picker.addEventListener('change', () => { uploads.add([...picker.files]); picker.value = ''; });

  return { link, math };
}
