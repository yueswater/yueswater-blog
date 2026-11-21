// Image node: `src` holds the stored file name (<uuid>.png); what the browser shows comes from
// resolve(name) (a local blob while writing, a signed URL on the admin page). While uploading,
// the image is greyed out and not written to Markdown.
import Image from '@tiptap/extension-image';

export function contactImage(resolve) {
  return Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        uploading: { default: false, rendered: false },
      };
    },
    renderHTML({ node, HTMLAttributes }) {
      const name = node.attrs.src || '';
      return ['img', {
        ...HTMLAttributes,
        src: resolve(name) || '',
        'data-name': name,
        class: `ce-img${node.attrs.uploading ? ' is-uploading' : ''}`,
      }];
    },
    renderMarkdown: (node) => (node.attrs.uploading || !node.attrs.src
      ? ''
      : `![${(node.attrs.alt || '').replace(/[[\]\n]/g, '')}](${node.attrs.src})`),
  }).configure({ inline: false, allowBase64: false });
}

// find the position of the image with this file name
export function findImage(editor, name) {
  let found = null;
  editor.state.doc.descendants((node, pos) => {
    if (found === null && node.type.name === 'image' && node.attrs.src === name) found = pos;
  });
  return found;
}
