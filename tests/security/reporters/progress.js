// Playwright reporter: a live one-line progress bar, then a summary per spec file with failures
// listed by TC-SEC id. Pair it with the html reporter for traces and screenshots.
const path = require('node:path');
const { createProgress } = require('./bar');

const stripAnsi = (s) => String(s || '').replace(/\x1b\[[0-9;]*m/g, '');

class ProgressReporter {
  onBegin(config, suite) {
    this.p = createProgress('security e2e');
    this.p.setTotal(suite.allTests().length);
  }

  onTestEnd(test, result) {
    // count a test once: retries report only their final attempt
    if (result.status !== 'passed' && result.status !== 'skipped' && result.retry < test.retries) return;
    const group = path.basename(test.location.file).replace(/\.spec\.js$/, '');
    const status = result.status === 'passed' || result.status === 'skipped' ? result.status : 'failed';
    const error = result.error ? stripAnsi(result.error.message) : (result.annotations.find((a) => a.type === 'skip') || {}).description;
    this.p.record({ group, title: test.title, status, error: status === 'failed' ? error : undefined });
  }

  onEnd(result) {
    this.p.summary(`報告：tests/security/.results/html/index.html（npx playwright show-report tests/security/.results/html）\n結果：${result.status}`);
  }

  printsToStdio() { return true; }
}

module.exports = ProgressReporter;
