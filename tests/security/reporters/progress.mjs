// node:test reporter: same progress bar and summary as the Playwright one. Suites that skip because
// the local Supabase is down print their skip reason once at the end.
import { createRequire } from 'node:module';
import path from 'node:path';

const { createProgress } = createRequire(import.meta.url)('./bar.js');

export default async function* progress(source) {
  const p = createProgress('security db');
  const reasons = new Set();
  let total = 0;
  for await (const { type, data } of source) {
    if (type === 'test:enqueue' && data.nesting >= 0) p.setTotal(++total);
    if (type !== 'test:pass' && type !== 'test:fail') continue;
    if (data.details?.type === 'suite' && !data.skip) continue;
    const group = path.basename(data.file || '').replace(/\.test\.mjs$/, '');
    if (data.skip) {
      if (typeof data.skip === 'string') reasons.add(data.skip);
      p.record({ group, title: data.name, status: 'skipped' });
    } else if (type === 'test:pass') p.record({ group, title: data.name, status: 'passed' });
    else p.record({ group, title: data.name, status: 'failed', error: data.details?.error?.cause?.message || data.details?.error?.message });
  }
  p.state.total = p.state.done; // enqueue also counts file and suite wrappers
  p.summary(reasons.size ? `略過原因：${[...reasons].join('；')}` : '');
  yield '';
}
