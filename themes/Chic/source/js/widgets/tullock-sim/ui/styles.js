// The widgets' shared stylesheet, injected once. Colours follow the site theme (.dark-theme).
const BASE = `
.tullock-sim{--ts-ink:#1a1a1a;--ts-soft:#6b6b6b;--ts-line:#d9d9d9;--ts-accent:#1747e6;margin:2em 0;padding:1.2em;border:1px solid var(--ts-line);font-size:.9rem;line-height:1.6}
.dark-theme .tullock-sim{--ts-ink:#e6e6e6;--ts-soft:#9a9a9a;--ts-line:#3a3a3a;--ts-accent:#5aa9ff}
.tullock-sim{container-type:inline-size}
.tullock-sim .ts-main{display:grid;grid-template-columns:minmax(0,1fr);gap:.4em}
@container (min-width:38rem){
.tullock-sim .ts-main{grid-template-columns:minmax(0,1.14fr) minmax(0,1fr);gap:1.4em;align-items:start}
.tullock-sim .ts-left{display:flex;flex-direction:column}
.tullock-sim .ts-left .ts-dl{margin-top:auto}
.tullock-sim .ts-right{display:flex;flex-direction:column}
.tullock-sim .ts-right table{margin-top:0;margin-bottom:0}
/* every row on the right has one pitch: --ts-pitch (set from the left column's height), else the height of a table row */
.tullock-sim .ts-right{--row:calc(.88rem * 2.006)}
.tullock-sim .ts-right .ts-ctl{grid-auto-rows:var(--ts-pitch,var(--row));row-gap:0;margin-bottom:0}
.tullock-sim .ts-right .ts-row{margin:0;min-height:0;height:var(--ts-pitch,var(--row))}
.tullock-sim .ts-right tr{height:var(--ts-pitch,var(--row))}
.tullock-sim .ts-right td{padding:.15em .4em}
.tullock-sim .ts-plot{max-width:none}
}
.tullock-sim .ts-ctl{display:grid;grid-template-columns:auto 1fr 3.5em;gap:.3em .8em;align-items:center;margin-bottom:1em}
.tullock-sim .ts-ctl output{text-align:right;font-variant-numeric:tabular-nums}
.tullock-sim input[type=range]{width:100%;accent-color:var(--ts-accent)}
.tullock-sim .ts-tabs{display:flex;gap:1.4em;justify-content:center;border-bottom:1px solid var(--ts-line);margin-bottom:.6em}
.tullock-sim .ts-tabs button{font:inherit;padding:.3em .2em;color:var(--ts-soft);background:none;border:0;border-bottom:2px solid transparent;margin-bottom:-1px;cursor:pointer}
.tullock-sim .ts-tabs button[aria-selected=true]{color:var(--ts-ink);border-bottom-color:var(--ts-accent);font-weight:600}
.tullock-sim .ts-plot{max-width:28rem;margin:.6rem auto 0;padding-bottom:1.6rem;color:var(--ts-ink)}
.tullock-sim .ts-in{position:relative}
.tullock-sim .ts-plot svg{display:block;width:100%}
.tullock-sim .ts-plot .ts-dot{fill:var(--ts-accent)}
.tullock-sim .ts-plot .ts-path{stroke:var(--ts-accent)}
.tullock-sim .ts-opt{display:flex;gap:.5em;align-items:center;cursor:pointer}
.tullock-sim .ts-row{display:flex;align-items:center;justify-content:space-between;gap:1em;margin:-.2em 0 1em;min-height:1.9em}
.tullock-sim .ts-row .ts-opt{margin:0}
.tullock-sim .ts-reset{margin-left:auto;font:inherit;padding:.1em .9em;color:var(--ts-accent);background:none;border:1px solid var(--ts-accent);cursor:pointer}
.tullock-sim .ts-reset:hover{color:#fff;background:var(--ts-accent)}
.dark-theme .tullock-sim .ts-reset:hover{color:#0f1b2d}
.tullock-sim .ts-opt{position:relative}
.tullock-sim .ts-opt input{position:absolute;left:0;top:50%;width:1.1em;height:1.1em;margin:-.55em 0 0;opacity:0;cursor:pointer}
.tullock-sim .ts-box{flex:none;display:block;width:1.1em;height:1.1em;border:1px solid var(--ts-accent);transition:background .15s}
.tullock-sim .ts-box svg{display:block;width:100%;height:100%;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.dark-theme .tullock-sim .ts-box svg{stroke:#0f1b2d}
.tullock-sim .ts-box path{stroke-dasharray:1;stroke-dashoffset:1;transition:stroke-dashoffset .28s ease-out .06s}
.tullock-sim .ts-opt input:checked + .ts-box{background:var(--ts-accent)}
.tullock-sim .ts-opt input:checked + .ts-box path{stroke-dashoffset:0}
.tullock-sim .ts-opt input:focus-visible + .ts-box{outline:2px solid var(--ts-accent);outline-offset:2px}
@media (prefers-reduced-motion:reduce){.tullock-sim .ts-box,.tullock-sim .ts-box path{transition:none}}
.tullock-sim .ts-opt[hidden]{display:none}
.tullock-sim .ts-plot .ts-lab{position:absolute;font-size:.85rem;line-height:1;white-space:nowrap}
.tullock-sim .ts-leg{position:absolute;top:2%;right:0;display:grid;grid-template-columns:auto auto;gap:.35em .5em;align-items:center;font-size:.78rem}
.tullock-sim .ts-le{display:contents}
.tullock-sim .ts-leg.below{position:static;display:flex;flex-wrap:wrap;white-space:nowrap;justify-content:center;gap:.2em 1.2em;margin-top:.5em}
.tullock-sim .ts-leg.below .ts-le{display:inline-flex;align-items:center;gap:.5em}
.tullock-sim .ts-leg svg{width:2em;height:.5em;overflow:visible}
.tullock-sim .ts-dl{display:flex;gap:.5em;align-items:center;justify-content:center;margin-top:.4em}
.tullock-sim .ts-dl button{font:inherit;padding:.2em .9em;color:var(--ts-accent);background:none;border:1px solid var(--ts-accent);cursor:pointer}
.tullock-sim .ts-dl button:hover{color:#fff;background:var(--ts-accent)}
.dark-theme .tullock-sim .ts-dl button:hover{color:#0f1b2d}
.tullock-sim .ts-dl button:disabled{opacity:.5;cursor:wait}
.tullock-sim table{width:100%;margin:1em 0 .4em;border-collapse:collapse;font-size:.88rem}
.tullock-sim td{padding:.25em .4em;border-bottom:1px solid var(--ts-line)}
.tullock-sim td:last-child{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.tullock-sim .ts-warn{color:#b3261e}
.tullock-sim .ts-note{margin:0 0 .6em;font-size:.82rem;color:var(--ts-soft)}
.dark-theme .tullock-sim .ts-warn{color:#ff8a80}
.tullock-sim .ts-head{display:flex;align-items:center;justify-content:space-between;gap:1em;margin:-1.2em -1.2em 1.2em;padding:.55em 1.2em;background:var(--ts-accent);color:#fff}
.dark-theme .tullock-sim .ts-head{color:#0f1b2d}
.tullock-sim .ts-head .ts-title{font-weight:600;color:inherit}
.tullock-sim .ts-head a,.tullock-sim .ts-head a:visited{background:none;display:inline-flex;align-items:center;gap:.4em;color:inherit;text-decoration:none;white-space:nowrap}
.tullock-sim .ts-head a:hover,.tullock-sim .ts-head a:focus{text-decoration:none;background:none;border-bottom-color:transparent;color:inherit}
.tullock-sim .ts-head svg{width:1.1em;height:1.1em}
`

export function installStyles(extra = '') {
  if (document.getElementById('tullock-sim-css')) return
  const style = document.createElement('style')
  style.id = 'tullock-sim-css'
  style.textContent = BASE + extra
  document.head.appendChild(style)
}
