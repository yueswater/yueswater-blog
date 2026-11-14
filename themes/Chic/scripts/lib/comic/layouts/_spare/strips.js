/** Spare layouts (not loaded): the 9:16 and 2:1 strips. */
var define = require('../../define').defineLayout;
var C = require('../../cut');

var F = '平整格狀與條狀';

module.exports = [
  define({
    id: 'koma', name: '四格漫畫條', family: F, h: 100 * 16 / 9,
    desc: '四格由上往下疊成 9:16 的手機長條，經典 4-koma',
    build: function (c) { return C.hsplitW(c, [1, 1, 1, 1]); }
  }),
  define({
    id: 'strip-h', name: '橫向四連格', family: F, h: 50,
    desc: '四個直式窄格由左往右排成 2:1 的寬條',
    build: function (c) { return C.vsplitW(c, [1, 1, 1, 1]); }
  })
];
