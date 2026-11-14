/** 標準四格: plain 2x2. */
var define = require('../define').defineLayout;
var C = require('../cut');

module.exports = define({
  id: 'grid', name: '標準四格', family: '平整格狀', h: 100,
  desc: '2×2 等分的田字格，最穩妥的版型',
  build: function (c) {
    var rows = C.hsplitW(c, [1, 1]);
    return C.vsplitW(rows[0], [1, 1]).concat(C.vsplitW(rows[1], [1, 1]));
  }
});
