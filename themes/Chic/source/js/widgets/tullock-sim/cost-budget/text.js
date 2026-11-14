// The cost-and-budget widget's wording, zh and en.
import { LANG } from '../ui/dom.js'

export const T = {
  zh: {
    n: '參賽人數 $n$', q: '成本曲率 $q$', B: '預算上限 $B$', lam: '超支罰則 $\\lambda$', V: '獎勵 $V$', c: '單位成本 $c$',
    form: '公式均衡投入 $x$', eq: '數值均衡（平均）$\\overline{x}$',
    pay: '個別預期報酬 $\\pi_i$', tc: '總競賽成本 $TC$', diss: '租金耗散率 $D$', kind: '情形',
    free: '上限不起作用，$x = x^*$',
    cap: '全員用盡預算，$x = B$',
    soft: '部分超支，$B < x < x^*$',
    warnNo: '迭代沒有收斂。',
    reset: '重設', tabQ: '隨 $q$ 變化', tabB: '隨預算變化', tabDyn: '迭代過程',
    title: 'Tullock 競賽模擬器（成本與預算）',
    legForm: '公式', legNum: '數值均衡', legX: '$x_i$ 各參賽者', legFormX: '$x$ 公式',
  },
  en: {
    n: 'Contestants $n$', q: 'Cost curvature $q$', B: 'Budget cap $B$', lam: 'Overspend penalty $\\lambda$', V: 'Prize $V$', c: 'Unit cost $c$',
    form: 'Closed-form spending $x$', eq: 'Numeric equilibrium (mean) $\\overline{x}$',
    pay: 'Payoff $\\pi_i$', tc: 'Total cost $TC$', diss: 'Rent dissipation $D$', kind: 'Case',
    free: 'The cap does not bind, $x = x^*$',
    cap: 'Everyone spends the whole budget, $x = B$',
    soft: 'Some overspending, $B < x < x^*$',
    warnNo: 'The iteration did not converge.',
    reset: 'Reset', tabQ: 'By $q$', tabB: 'By budget', tabDyn: 'Iteration',
    title: 'Tullock contest simulator (cost and budget)',
    legForm: 'formula', legNum: 'numeric equilibrium', legX: '$x_i$ each player', legFormX: '$x$ formula',
  },
}[LANG]
