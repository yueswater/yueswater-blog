// Drops link marks whose target is not http(s). The Link extension already refuses to render such
// an href, but the mark itself survived Markdown parsing, so the Markdown regenerated from the rich
// view (what is actually sent) still carried [x](javascript:…). This removes the mark itself.
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';

export const isSafeHref = (href) => /^https?:\/\//i.test(String(href || '').trim());

export const SafeLinks = Extension.create({
  name: 'safeLinks',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: new PluginKey('safeLinks'),
      appendTransaction: (_trs, _old, state) => {
        const link = state.schema.marks.link;
        if (!link) return null;
        let tr = null;
        state.doc.descendants((node, pos) => {
          if (!node.isText) return;
          node.marks.forEach((m) => {
            if (m.type === link && !isSafeHref(m.attrs.href)) {
              tr = (tr || state.tr).removeMark(pos, pos + node.nodeSize, m);
            }
          });
        });
        return tr;
      },
    })];
  },
});
