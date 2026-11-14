/** 鋸齒疊格: four stacked bands whose three dividers lean left, right, left. */
var define = require('../define').defineLayout;
var C = require('../cut');

module.exports = define({
  id: 'zigzag', name: '鋸齒疊格', family: '斜切分隔', h: 150,
  desc: '四格上下疊，三條橫分隔線左傾右傾交替（約 6°），像折起來的緞帶（2:3）',
  build: function (c) { return C.hsplit(c, [[32.5, 42.5], [80, 70], [107.5, 117.5]]); }
});
