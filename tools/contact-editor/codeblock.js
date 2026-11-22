// Code block with syntax highlighting and a language picker (custom listbox with a filter box)
// in its top-right corner. Stored in Markdown as ```lang.
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { lowlight, LANGUAGES, labelFor, colorFor } from './languages.js';

function picker(current, strings, onPick) {
  const wrap = document.createElement('div');
  wrap.className = 'ce-lang';
  wrap.contentEditable = 'false';
  const btn = Object.assign(document.createElement('button'), { type: 'button', className: 'ce-lang-btn' });
  btn.setAttribute('aria-haspopup', 'listbox');
  const pop = Object.assign(document.createElement('div'), { className: 'ce-lang-pop', hidden: true });
  const filter = Object.assign(document.createElement('input'), { className: 'ce-lang-filter', placeholder: strings.lang_filter });
  const list = Object.assign(document.createElement('ul'), { className: 'ce-lang-list' });
  list.setAttribute('role', 'listbox');
  pop.append(filter, list);
  // the list lives on <body> with fixed positioning, so the editor's scroll box never clips it
  wrap.append(btn);
  let active = 0;
  // an explicit Auto entry (value '' -> language null) so a block can be left to auto-detection
  const AUTO = { value: '', label: strings.lang_auto || 'Auto' };
  const ALL = [AUTO, ...LANGUAGES];
  let shown = ALL;

  // no language (null / '') means auto-detect; show the Auto label rather than Plain text
  const setLabel = (v) => { btn.textContent = v ? labelFor(v) : AUTO.label; };
  const draw = () => {
    const q = filter.value.trim().toLowerCase();
    shown = ALL.filter((l) => !q || l.label.toLowerCase().includes(q) || l.value.includes(q));
    active = Math.min(active, Math.max(0, shown.length - 1));
    list.replaceChildren(...shown.map((l, i) => {
      const li = Object.assign(document.createElement('li'), { textContent: l.label, className: i === active ? 'is-active' : '' });
      li.setAttribute('role', 'option');
      li.style.setProperty('--lang', colorFor(l.value) || 'transparent');
      li.addEventListener('mousedown', (e) => { e.preventDefault(); pick(l.value); });
      return li;
    }));
    // scroll only the list, never the page
    const li = list.children[active];
    if (li) {
      if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop;
      else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight;
    }
  };
  const close = () => {
    pop.hidden = true;
    pop.remove();
    document.removeEventListener('mousedown', outside, true);
    window.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('resize', close);
  };
  // scrolling anywhere except inside the list closes it (it would drift from its button)
  const onScroll = (e) => { if (!pop.contains(e.target)) close(); };
  const outside = (e) => { if (!wrap.contains(e.target) && !pop.contains(e.target)) close(); };
  const place = () => {
    const r = btn.getBoundingClientRect();
    pop.style.top = `${r.bottom + 4}px`;
    pop.style.left = `${Math.max(8, r.right - 192)}px`;
  };
  const pick = (v) => { setLabel(v); close(); onPick(v); };

  btn.addEventListener('mousedown', (e) => e.preventDefault());
  btn.addEventListener('click', () => {
    if (!pop.hidden) return close();
    document.body.append(pop);
    place();
    pop.hidden = false;
    filter.value = '';
    active = 0;
    draw();
    filter.focus({ preventScroll: true });
    document.addEventListener('mousedown', outside, true);
    setTimeout(() => window.addEventListener('scroll', onScroll, true));
    window.addEventListener('resize', close);
  });
  filter.addEventListener('input', () => { active = 0; draw(); });
  filter.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); active = Math.min(active + 1, shown.length - 1); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); active = Math.max(active - 1, 0); draw(); }
    else if (e.key === 'Enter') { e.preventDefault(); if (shown[active]) pick(shown[active].value); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); }
  });
  setLabel(current);
  return { dom: wrap, setLabel };
}

export function codeBlock(strings) {
  return CodeBlockLowlight.extend({
    addNodeView() {
      return ({ node, editor, getPos }) => {
        const dom = Object.assign(document.createElement('div'), { className: 'ce-code' });
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        pre.append(code);
        // line numbers: a non-editable gutter kept in step with the text's line count
        const gutter = Object.assign(document.createElement('div'), { className: 'ce-gutter' });
        gutter.contentEditable = 'false';
        gutter.setAttribute('aria-hidden', 'true');
        const paint = (n) => {
          const lines = n.textContent.split('\n').length;
          if (gutter.childElementCount !== lines) {
            gutter.replaceChildren(...Array.from({ length: lines }, (_, i) => Object.assign(document.createElement('span'), { textContent: i + 1 })));
          }
          const c = colorFor(n.attrs.language);
          if (c) dom.style.setProperty('--lang', c); else dom.style.removeProperty('--lang');
          dom.dataset.language = n.attrs.language || 'plaintext';
        };
        const tagText = (v) => (v ? labelFor(v) : (strings.lang_auto || 'Auto'));
        const lang = editor.isEditable
          ? picker(node.attrs.language, strings, (language) => {
            const pos = getPos();
            if (typeof pos !== 'number') return;
            // '' from the Auto entry becomes null, so the block falls back to auto-detection
            editor.view.dispatch(editor.state.tr.setNodeMarkup(pos, undefined, { ...node.attrs, language: language || null }));
          })
          : { dom: Object.assign(document.createElement('span'), { className: 'ce-lang-tag', textContent: tagText(node.attrs.language) }), setLabel(v) { this.dom.textContent = tagText(v); } };
        dom.append(lang.dom, gutter, pre);
        paint(node);
        return {
          dom,
          contentDOM: code,
          update(next) {
            if (next.type !== node.type) return false;
            node = next;
            lang.setLabel(next.attrs.language);
            paint(next);
            return true;
          },
          ignoreMutation: (m) => lang.dom.contains(m.target) || gutter.contains(m.target),
          stopEvent: (e) => lang.dom.contains(e.target),
        };
      };
    },
  // defaultLanguage null: a block whose language is unset is highlighted by lowlight's auto-detection
  }).configure({ lowlight, defaultLanguage: null });
}
