// The two-player widget's wording, zh and en.
import { LANG } from '../ui/dom.js'

export const T = {
  zh: {
    V: '獎勵 $V$', c: '單位成本 $c$', r: '實力差距參數 $r$', x1: '玩家 1 的投入 $x_1$', x2: '玩家 2 的投入 $x_2$',
    eq: '數值均衡 $(x_1^*, x_2^*)$', p: '均衡勝率 $(p_1^*, p_2^*)$',
    pay: '均衡預期報酬 $(\\pi_1^*, \\pi_2^*)$', diss: '租金耗散率 $D$', demo: '自訂投入時的 $(p_1, p_2)$',
    warn: '迭代沒有收斂：$r > 2$ 時沒有純策略均衡。',
    tabBr: '最佳反應', tabPay: '預期報酬', tabWin: '勝率曲線', path: '顯示反應軌跡', reset: '重設',
    title: 'Tullock 競賽模擬器（$2$ 人）', zip: '下載原始碼', dl: '下載圖形',
  },
  en: {
    V: 'Prize $V$', c: 'Unit cost $c$', r: 'Skill-gap parameter $r$', x1: 'Player 1 expenditure $x_1$', x2: 'Player 2 expenditure $x_2$',
    eq: 'Numeric equilibrium $(x_1^*, x_2^*)$', p: 'Win probabilities $(p_1^*, p_2^*)$',
    pay: 'Payoffs $(\\pi_1^*, \\pi_2^*)$', diss: 'Rent dissipation $D$', demo: '$(p_1, p_2)$ at the chosen $x_1, x_2$',
    warn: 'The iteration did not converge: for $r > 2$ there is no pure-strategy equilibrium.',
    tabBr: 'Best responses', tabPay: 'Expected payoff', tabWin: 'Win probability', path: 'Show the reaction path', reset: 'Reset',
    title: 'Tullock contest simulator ($2$ players)', zip: 'Download source', dl: 'Download figure',
  },
}[LANG]
