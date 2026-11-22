// Image uploads: JPG / PNG only, 5 MB, at most 3 per message. Each picked file goes through the
// crop dialog, then is uploaded as-is to the private contact-images bucket (visitors may upload
// but never read) as <uuid>.<ext>. The editor shows the local copy, so nothing is fetched back.
import { cropImage } from './crop.js';
import { findImage } from './image.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png' };
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 3;

export const local = new Map(); // name -> { url, file }, for display and re-cropping

async function put(name, file) {
  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('not configured');
  const res = await fetch(`${url}/storage/v1/object/contact-images/${name}`, {
    method: 'POST',
    headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': file.type, 'x-upsert': 'false' },
    body: file,
  });
  if (!res.ok) throw new Error(String(res.status));
}

export function createUploads({ getEditor, strings, toast, fallbackImage = () => '' }) {
  let pending = 0;
  const count = () => {
    let n = 0;
    getEditor().state.doc.descendants((node) => { if (node.type.name === 'image') n++; });
    return n;
  };

  // upload one file and put it at `at` (a position) or the cursor; replaces `replace` if given
  async function place(file, { replace } = {}) {
    const editor = getEditor();
    const name = `${crypto.randomUUID()}.${TYPES[file.type]}`;
    local.set(name, { url: URL.createObjectURL(file), file });
    const alt = (file.name || 'image').replace(/\.[^.]+$/, '').replace(/[[\]()\n]/g, '').slice(0, 40);
    const attrs = { src: name, alt, uploading: true };
    const old = replace ? findImage(editor, replace) : null;
    if (old !== null) editor.chain().focus().setNodeSelection(old).insertContent({ type: 'image', attrs }).run();
    else editor.chain().focus().insertContent([{ type: 'image', attrs }, { type: 'paragraph' }]).run();
    pending++;
    try {
      await put(name, file);
      const pos = findImage(editor, name);
      if (pos !== null) editor.view.dispatch(editor.state.tr.setNodeAttribute(pos, 'uploading', false));
    } catch {
      const pos = findImage(editor, name);
      if (pos !== null) editor.chain().deleteRange({ from: pos, to: pos + 1 }).run();
      toast(strings.img_fail, 'warn');
    } finally {
      pending--;
    }
  }

  async function add(files) {
    for (const file of files) {
      if (!TYPES[file.type]) { toast(strings.img_type, 'warn'); continue; }
      if (file.size > MAX_BYTES) { toast(strings.img_size, 'warn'); continue; }
      if (count() + pending >= MAX_IMAGES) { toast(strings.img_max, 'warn'); return; }
      const cropped = await cropImage(file, strings);
      if (cropped) await place(cropped);
    }
  }

  // crop an image already in the message again, from the original local file
  async function recrop(name) {
    const entry = local.get(name);
    if (!entry) return;
    const cropped = await cropImage(entry.file, strings);
    if (cropped && cropped !== entry.file) await place(cropped, { replace: name });
  }

  return { add, recrop, busy: () => pending > 0, resolve: (n) => local.get(n)?.url || fallbackImage(n) };
}
