// Languages for code blocks: highlight.js's "common" set plus a few more people ask about.
import { createLowlight, common } from 'lowlight';
import dockerfile from 'highlight.js/lib/languages/dockerfile';
import haskell from 'highlight.js/lib/languages/haskell';
import scala from 'highlight.js/lib/languages/scala';
import matlab from 'highlight.js/lib/languages/matlab';
import julia from 'highlight.js/lib/languages/julia';
import dart from 'highlight.js/lib/languages/dart';
import latex from 'highlight.js/lib/languages/latex';
import elixir from 'highlight.js/lib/languages/elixir';
import ocaml from 'highlight.js/lib/languages/ocaml';
import fortran from 'highlight.js/lib/languages/fortran';
import powershell from 'highlight.js/lib/languages/powershell';
import nginx from 'highlight.js/lib/languages/nginx';
import stata from 'highlight.js/lib/languages/stata';

export const lowlight = createLowlight(common);
Object.entries({ dockerfile, haskell, scala, matlab, julia, dart, latex, elixir, ocaml, fortran, powershell, nginx, stata })
  .forEach(([name, lang]) => lowlight.register(name, lang));

// shown in the picker; value is the highlight.js name, label what people recognise
const LABELS = {
  plaintext: 'Plain text', bash: 'Bash', shell: 'Shell', c: 'C', cpp: 'C++', csharp: 'C#', css: 'CSS',
  dart: 'Dart', diff: 'Diff', dockerfile: 'Dockerfile', elixir: 'Elixir', fortran: 'Fortran', go: 'Go',
  graphql: 'GraphQL', haskell: 'Haskell', ini: 'INI / TOML', java: 'Java', javascript: 'JavaScript',
  json: 'JSON', julia: 'Julia', kotlin: 'Kotlin', latex: 'LaTeX', less: 'Less', lua: 'Lua',
  makefile: 'Makefile', markdown: 'Markdown', matlab: 'MATLAB', nginx: 'Nginx', objectivec: 'Objective-C',
  ocaml: 'OCaml', perl: 'Perl', php: 'PHP', powershell: 'PowerShell', python: 'Python', r: 'R',
  ruby: 'Ruby', rust: 'Rust', scala: 'Scala', scss: 'SCSS', sql: 'SQL', stata: 'Stata', swift: 'Swift',
  typescript: 'TypeScript', xml: 'HTML / XML', yaml: 'YAML',
};

export const LANGUAGES = Object.entries(LABELS)
  .filter(([v]) => lowlight.registered(v))
  .map(([value, label]) => ({ value, label }))
  .sort((a, b) => (a.value === 'plaintext' ? -1 : b.value === 'plaintext' ? 1 : a.label.localeCompare(b.label)));

export const labelFor = (v) => LABELS[v] || v || LABELS.plaintext;

// GitHub linguist colours, so each language reads at a glance (dot + left rule on the block)
const COLORS = {
  bash: '#89e051', shell: '#89e051', c: '#555555', cpp: '#f34b7d', csharp: '#178600', css: '#663399',
  dart: '#00b4ab', diff: '#88dddd', dockerfile: '#384d54', elixir: '#6e4a7e', fortran: '#4d41b1', go: '#00add8',
  graphql: '#e10098', haskell: '#5e5086', ini: '#9c4221', java: '#b07219', javascript: '#f1e05a', json: '#292929',
  julia: '#a270ba', kotlin: '#a97bff', latex: '#3d6117', less: '#1d365d', lua: '#000080', makefile: '#427819',
  markdown: '#083fa1', matlab: '#e16737', nginx: '#009639', objectivec: '#438eff', ocaml: '#ef7a08', perl: '#0298c3',
  php: '#4f5d95', powershell: '#012456', python: '#3572a5', r: '#198ce7', ruby: '#701516', rust: '#dea584',
  scala: '#c22d40', scss: '#c6538c', sql: '#e38c00', stata: '#1a5f91', swift: '#f05138', typescript: '#3178c6',
  xml: '#e34c26', yaml: '#cb171e',
};
export const colorFor = (v) => COLORS[v] || '';
