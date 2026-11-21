// Progress-bar drawing shared by the Playwright and node:test reporters (CommonJS so both can load it).
// In a TTY the bar redraws in place on one line; elsewhere each result is printed as its own line.
const tty = Boolean(process.stdout.isTTY);
const C = tty ? { g: '\x1b[32m', r: '\x1b[31m', y: '\x1b[33m', d: '\x1b[2m', b: '\x1b[1m', x: '\x1b[0m' } : { g: '', r: '', y: '', d: '', b: '', x: '' };

const caseId = (title) => (String(title).match(/TC-SEC-[A-Z]+-\d+/) || [''])[0];

function bar(done, total, width = 24) {
  const t = Math.max(total, done, 1);
  const fill = Math.round((done / t) * width);
  return `[${'█'.repeat(fill)}${'░'.repeat(width - fill)}] ${String(done).padStart(String(t).length)}/${t}`;
}

// display width of a string: East Asian wide / fullwidth characters take two columns
const wide = (cp) => (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0xa4cf) || (cp >= 0xac00 && cp <= 0xd7a3)
  || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xfe30 && cp <= 0xfe4f) || (cp >= 0xff00 && cp <= 0xff60) || (cp >= 0xffe0 && cp <= 0xffe6)
  || (cp >= 0x1f300 && cp <= 0x1faff) || (cp >= 0x20000 && cp <= 0x3fffd);
const widthOf = (str) => [...str].reduce((w, ch) => w + (wide(ch.codePointAt(0)) ? 2 : 1), 0);
function fit(str, max) {
  if (max <= 0) return '';
  let out = '';
  let w = 0;
  for (const ch of str) {
    const cw = wide(ch.codePointAt(0)) ? 2 : 1;
    if (w + cw > max) return out.length < str.length ? out.replace(/.$/u, '…') : out;
    out += ch;
    w += cw;
  }
  return out;
}

function createProgress(label) {
  const s = { total: 0, done: 0, pass: 0, fail: 0, skip: 0, failures: [], groups: new Map() };

  // one line that never wraps: if it were wider than the terminal, \r could only return to the
  // last wrapped row and every redraw would leave a stale row behind
  function line(current) {
    if (!tty) return;
    const plainHead = `${bar(s.done, s.total)}  ✔ ${s.pass} ✘ ${s.fail} ↷ ${s.skip}  `;
    const head = `${bar(s.done, s.total)}  ${C.g}✔ ${s.pass}${C.x} ${C.r}✘ ${s.fail}${C.x} ${C.y}↷ ${s.skip}${C.x}  `;
    const cols = (process.stdout.columns || 80) - 1;
    const room = cols - widthOf(plainHead);
    const text = room > 0 ? head + C.d + fit(current, room) + C.x : fit(plainHead, cols);
    process.stdout.write(`\r\x1b[2K${text}`);
  }

  return {
    state: s,
    setTotal(n) { s.total = n; line(label); },
    record({ group, title, status, error }) {
      s.done++;
      if (status === 'passed') s.pass++;
      else if (status === 'skipped') s.skip++;
      else { s.fail++; s.failures.push({ group, title, error }); }
      const g = s.groups.get(group) || { pass: 0, fail: 0, skip: 0 };
      g[status === 'passed' ? 'pass' : status === 'skipped' ? 'skip' : 'fail']++;
      s.groups.set(group, g);
      if (tty) line(`${group} › ${title}`);
      else {
        const mark = status === 'passed' ? '✔' : status === 'skipped' ? '↷' : '✘';
        process.stdout.write(`${bar(s.done, s.total)} ${mark} ${group} › ${title}\n`);
      }
    },
    summary(note) {
      if (tty) process.stdout.write('\r\x1b[2K');
      const out = [`${C.b}${label}${C.x}  ${bar(s.done, s.total)}  ✔ ${s.pass}  ✘ ${s.fail}  ↷ ${s.skip}`];
      for (const [g, c] of [...s.groups].sort()) out.push(`  ${g.padEnd(32)} ${C.g}✔ ${c.pass}${C.x}  ${C.r}✘ ${c.fail}${C.x}  ${C.y}↷ ${c.skip}${C.x}`);
      if (s.failures.length) {
        out.push(`\n${C.r}${C.b}失敗（對照 xlsx 的案例編號）${C.x}`);
        for (const f of s.failures) {
          out.push(`  ${C.r}✘${C.x} ${caseId(f.title) || '(no id)'}  ${f.group} › ${f.title}`);
          if (f.error) out.push(`    ${C.d}${String(f.error).split('\n').find((l) => l.trim()) || ''}${C.x}`);
        }
      }
      if (note) out.push(`\n${note}`);
      process.stdout.write(`${out.join('\n')}\n`);
    },
  };
}

module.exports = { createProgress, caseId, C };
