/** One large panel and three smaller ones, the big one placed in five different ways. */
var define = require('../../define').defineLayout;
var C = require('../../cut');

var F = '一大三小';

module.exports = [
  define({
    id: 'big-top', name: '上大下三', family: F, h: 100,
    desc: '上方一幅橫向主畫面，下方三個等寬直式格',
    build: function (c) {
      var rows = C.hsplitW(c, [58, 42]);
      return [rows[0]].concat(C.vsplitW(rows[1], [1, 1, 1]));
    }
  }),
  define({
    id: 'big-left', name: '左大右三', family: F, h: 75,
    desc: '左側整欄主畫面，右側三個橫向小格由上往下疊（4:3）',
    build: function (c) {
      var cols = C.vsplitW(c, [60, 40]);
      return [cols[0]].concat(C.hsplitW(cols[1], [1, 1, 1]));
    }
  }),
  define({
    id: 'big-right', name: '右大左三', family: F, h: 125,
    desc: '右側整欄直式主畫面，左側三個近方形小格（4:5）',
    build: function (c) {
      var cols = C.vsplitW(c, [40, 60]), left = C.hsplitW(cols[0], [1, 1, 1]);
      return [left[0], cols[1], left[1], left[2]];
    }
  }),
  define({
    id: 'banner-side', name: '橫幅加側欄', family: F, h: 125,
    desc: '頂部一條橫幅，其下左側主畫面、右側疊兩個小格',
    build: function (c) {
      var rows = C.hsplitW(c, [27, 73]), cols = C.vsplitW(rows[1], [62, 38]), side = C.hsplitW(cols[1], [1, 1]);
      return [rows[0], cols[0], side[0], side[1]];
    }
  }),
  define({
    id: 'pillars', name: '三柱一橫', family: F, h: 125,
    desc: '上方三個窄長直式格並排，底部一幅橫向收尾畫面',
    build: function (c) {
      var rows = C.hsplitW(c, [68, 32]);
      return C.vsplitW(rows[0], [1, 1, 1]).concat([rows[1]]);
    }
  })
];
