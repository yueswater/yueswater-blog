// The n-player widget's wording, zh and en.
import { LANG } from '../ui/dom.js'

export const T = {
  zh: {
    n: '參賽人數 $n$', r: '競賽強度 $r$', V: '獎勵 $V$', c: '單位成本 $c$',
    form: '公式候選解 $x^*$', eq: '數值均衡（平均）$\\bar{x}$',
    pay: '個別預期報酬 $\\pi_i^*$', tc: '總競賽成本 $TC^*$', diss: '租金耗散率 $D$',
    cond: '存在條件 $r \\leq \\frac{n}{n - 1}$',
    holds: '成立', fails: '不成立',
    warnNo: '迭代沒有收斂。',
    warnOut: (k, n) => `迭代收斂了，但停在 ${k} 位投入、${n - k} 位不投入的均衡，不是全員投入的對稱解。$r > 1$ 時均衡不止一個，停在哪個取決於起點。`,
    warnNone: '沒有全員正投入的對稱解：$r > \\frac{n}{n - 1}$ 時這種均衡不存在。',
    near: '從公式解附近出發', big: (m) => `$n > ${m}$：只求對稱均衡（所有人投入相同）`,
    tabN: '隨人數變化', tabDev: '偏離檢驗', tabDyn: '迭代過程', reset: '重設',
    title: 'Tullock 競賽模擬器（$n$ 人）', zip: '下載原始碼',
    legNum: '全員投入', legOut: '部分退出', legPay: '$\\pi_i(tx^*, x^*_{-i})/V$', legX: '$x_i$ 各參賽者', legRep: '$x_i$ 代表性參賽者', legForm: '$x^*$ 公式',
  },
  en: {
    n: 'Contestants $n$', r: 'Intensity $r$', V: 'Prize $V$', c: 'Unit cost $c$',
    form: 'Closed-form candidate $x^*$', eq: 'Numeric equilibrium (mean) $\\bar{x}$',
    pay: 'Equilibrium payoff $\\pi_i^*$', tc: 'Total cost $TC^*$', diss: 'Rent dissipation $D$',
    cond: 'Existence $r \\leq \\frac{n}{n - 1}$',
    holds: 'holds', fails: 'fails',
    warnNo: 'The iteration did not converge.',
    warnOut: (k, n) => `The iteration converged, but to an equilibrium where ${k} players spend and ${n - k} stay out, not the symmetric all-in one. For $r > 1$ there are several equilibria, and which one you get depends on the start.`,
    warnNone: 'There is no symmetric all-in equilibrium: for $r > \\frac{n}{n - 1}$ none exists.',
    near: 'Start near the closed form', big: (m) => `$n > ${m}$: only the symmetric equilibrium is solved (everybody spends the same)`,
    tabN: 'By number of players', tabDev: 'Deviation test', tabDyn: 'Iteration', reset: 'Reset',
    title: 'Tullock contest simulator ($n$ players)', zip: 'Download source',
    legNum: 'all in', legOut: 'some out', legPay: '$\\pi_i(tx^*, x^*_{-i})/V$', legX: '$x_i$ each player', legRep: '$x_i$ one representative player', legForm: '$x^*$ formula',
  },
}[LANG]
