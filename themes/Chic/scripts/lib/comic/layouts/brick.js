/** 錯位雙排: two rows, columns 38/62 then 62/38, so the vertical dividers stagger. */
var define = require('../define').defineLayout;
var C = require('../cut');

module.exports = define({
  id: 'brick', name: '錯位雙排', family: '平整格狀', h: 100 * 2 / 3,
  desc: '兩排各分成一小一大，上下排的分隔線左右錯開（3:2）',
  build: function (c) {
    var rows = C.hsplitW(c, [1, 1]);
    return C.vsplitW(rows[0], [38, 62]).concat(C.vsplitW(rows[1], [62, 38]));
  }
});
