// The extension set shared by the writing editor and the read-only renderer on the admin page.
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import Mathematics from '@tiptap/extension-mathematics';
import { Markdown } from '@tiptap/markdown';
import { codeBlock } from './codeblock.js';
import { contactImage } from './image.js';

export function buildExtensions({ strings, resolveImage, onMath, placeholder }) {
  return [
    StarterKit.configure({
      heading: false,
      blockquote: false,
      horizontalRule: false,
      strike: false,
      underline: false,
      codeBlock: false,
      link: {
        openOnClick: false,
        autolink: true,
        protocols: ['http', 'https'],
        isAllowedUri: (url) => /^https?:\/\//i.test(url),
        HTMLAttributes: { rel: 'noopener nofollow ugc', target: '_blank' },
      },
    }),
    codeBlock(strings),
    contactImage(resolveImage),
    Mathematics.configure({
      katexOptions: { throwOnError: false, strict: false },
      inlineOptions: { onClick: (node, pos) => onMath && onMath('inline', node, pos) },
      blockOptions: { onClick: (node, pos) => onMath && onMath('block', node, pos) },
    }),
    Markdown.configure({ indentation: { style: 'space', size: 2 } }),
    ...(placeholder ? [Placeholder.configure({ placeholder })] : []),
  ];
}
