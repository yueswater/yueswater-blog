// Payload catalogue: every hostile input the security specs feed in, as data. Each entry carries the
// TC-SEC id it belongs to, so a spec can loop over a slice and name its tests after the sheet.
const IMG = '<img src=x onerror=alert(document.domain)>';

// HTML / Markdown that must stay inert wherever a message body is rendered
const BODY = [
  { id: 'XSS-005', title: 'raw script tag', md: '<script>alert(1)</script>' },
  { id: 'XSS-006', title: 'img onerror', md: '<img src=x onerror=alert(1)>' },
  { id: 'XSS-007', title: 'svg onload', md: '<svg onload=alert(1)></svg>' },
  { id: 'XSS-008', title: 'iframe embed', md: '<iframe src="https://example.com"></iframe>' },
  { id: 'XSS-009', title: 'a href javascript', md: '<a href="javascript:alert(1)">click</a>' },
  { id: 'XSS-010', title: 'details ontoggle', md: '<details open ontoggle=alert(1)>x</details>' },
  { id: 'XSS-011', title: 'style tag', md: '<style>body{display:none}</style>' },
  { id: 'XSS-012', title: 'entity-encoded script', md: '&lt;script&gt;alert(1)&lt;/script&gt;' },
  { id: 'XSS-013', title: 'markdown link javascript', md: '[click](javascript:alert(1))' },
  { id: 'XSS-014', title: 'mixed-case scheme', md: '[click](JaVaScRiPt:alert(1))' },
  { id: 'XSS-015', title: 'tab-obfuscated scheme', md: '[click](java&#09;script:alert(1))' },
  { id: 'XSS-016', title: 'data:text/html link', md: '[click](data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==)' },
  { id: 'XSS-017', title: 'vbscript link', md: '[click](vbscript:msgbox(1))' },
  { id: 'XSS-018', title: 'autolink javascript', md: '<javascript:alert(1)>' },
  { id: 'XSS-019', title: 'markdown image javascript', md: '![x](javascript:alert(1))' },
  { id: 'XSS-020', title: 'image alt / title injection', md: '![" onerror="alert(1)](a.png "x\\" onmouseover=\\"alert(1)")' },
  { id: 'XSS-021', title: 'code-block language injection', md: '```"><img src=x onerror=alert(1)>\nprint(1)\n```' },
  { id: 'XSS-022', title: 'KaTeX \\href javascript', md: '$\\href{javascript:alert(1)}{x}$' },
  { id: 'XSS-023', title: 'KaTeX \\url javascript', md: '$\\url{javascript:alert(1)}$' },
  { id: 'XSS-024', title: 'KaTeX \\htmlStyle overlay', md: '$\\htmlStyle{position:fixed;inset:0;background:red}{x}$' },
];

// heavy KaTeX input: must fail fast with an error, not freeze the tab
const KATEX_BOMBS = [
  { id: 'XSS-025', title: 'recursive macro expansion', md: '$\\def\\a{\\a\\a}\\a$' },
  { id: 'XSS-026', title: 'very deep nesting', md: `$${'{'.repeat(500)}x${'}'.repeat(500)}$` },
];

// the short fields (name, email, org, topic) shown in the admin list and detail line
const FIELDS = [
  { id: 'XSS-001', field: 'name' },
  { id: 'XSS-002', field: 'email' },
  { id: 'XSS-003', field: 'org' },
  { id: 'XSS-004', field: 'topic' },
];

// editor-side payloads typed into the source tab, then shown in the preview dialog
const EDITOR = [
  { id: 'ED-001', title: 'script tag', md: '<script>alert(1)</script>' },
  { id: 'ED-002', title: 'img onerror', md: '<img src=x onerror=alert(1)>' },
  { id: 'ED-003', title: 'javascript link', md: '[x](javascript:alert(1))' },
  { id: 'ED-004', title: 'KaTeX \\href', md: '$\\href{javascript:alert(1)}{x}$' },
];

const EXTERNAL = {
  pixel: '![](https://attacker.example/pixel.png?id=1)',
  protocolRelative: '![](//attacker.example/p.png)',
  uuidLookalike: '![](https://attacker.example/0e6f1c2a-1111-4222-8333-444455556666.png)',
  missingUuid: '![](00000000-0000-0000-0000-000000000000.png)',
  link: '[x](https://attacker.example)',
  cssUrl: '<div style="background:url(https://attacker.example/x)">x</div>',
  phishing: '[https://yueswater.com](https://attacker.example)',
};

// passes the server's email regex (one @, a dot, no whitespace) but smuggles extra mailto fields
const MAILTO_INJECTION = 'a@b.co?cc=boss%40evil.example&bcc=x%40evil.example&body=hi';

module.exports = { IMG, BODY, KATEX_BOMBS, FIELDS, EDITOR, EXTERNAL, MAILTO_INJECTION };
