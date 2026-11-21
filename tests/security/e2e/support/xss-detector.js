// XSS detection. installTraps runs before any page script: alert/confirm/prompt become recorders, so
// a payload that executes leaves a trace in window.__pwned instead of a blocking dialog.
// findHazards inspects a rendered container for anything that could execute or take over the page.
async function installTraps(page) {
  await page.addInitScript(() => {
    window.__pwned = [];
    const record = (kind) => (...args) => { window.__pwned.push(`${kind}:${args.join(',')}`); return kind === 'confirm' ? false : null; };
    window.alert = record('alert');
    window.confirm = record('confirm');
    window.prompt = record('prompt');
  });
}

const pwned = (page) => page.evaluate(() => window.__pwned || []);

// every element under `selector` that is a script/frame/style vector, carries an inline handler,
// points a URL attribute at an executable scheme, or pins itself over the viewport
function findHazards(page, selector) {
  return page.evaluate((sel) => {
    const out = [];
    const bad = /^(javascript|vbscript|data):/i;
    const clean = (v) => String(v || '').replace(/[\u0000- \u007f- ]+/g, '');
    const vectors = ['script', 'iframe', 'object', 'embed', 'style', 'link', 'meta', 'base', 'form'];
    for (const root of document.querySelectorAll(sel)) {
      for (const n of root.querySelectorAll('*')) {
        const tag = n.tagName.toLowerCase();
        if (vectors.includes(tag)) out.push(`<${tag}>`);
        for (const a of n.attributes) {
          if (/^on/i.test(a.name)) out.push(`${tag}[${a.name}]`);
          const urlAttr = ['href', 'src', 'xlink:href', 'action', 'formaction', 'srcdoc'].includes(a.name);
          if (urlAttr && bad.test(clean(a.value))) out.push(`${tag}[${a.name}=${a.value.slice(0, 40)}]`);
        }
        if (getComputedStyle(n).position === 'fixed') out.push(`${tag}{position:fixed}`);
      }
    }
    return out;
  }, selector);
}

// payload-agnostic verdict for expect(...).toEqual(SAFE)
async function verdict(page, selector) {
  return { hazards: await findHazards(page, selector), pwned: await pwned(page) };
}

const SAFE = { hazards: [], pwned: [] };

module.exports = { installTraps, pwned, findHazards, verdict, SAFE };
