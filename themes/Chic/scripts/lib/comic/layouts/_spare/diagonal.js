/** Spare layouts (not loaded): X-shaped triangles, steep diagonal bands, and the V funnel. */
var define = require('../../define').defineLayout;
var C = require('../../cut');

module.exports = [
  define({
    id: 'x-cut', name: 'X 型對角', family: '對角切割與異形', h: 100,
    desc: '兩條對角線交叉，切成上、左、右、下四個三角格',
    build: function (c) {
      var lines = [[[0, 0], [100, 100]], [[100, 0], [0, 100]]];
      return [[50, 10], [10, 50], [90, 50], [50, 90]].map(function (ref) { return C.cell(c, ref, lines); });
    }
  }),
  define({
    id: 'stairs', name: '階梯斜帶', family: '對角切割與異形', h: 100 * 2 / 3,
    desc: '三條平行的陡斜線（約 20°）把寬頁切成四條斜帶，由左往右像下樓梯（3:2）',
    build: function (c) { return C.vsplit(c, [[38, 14], [62, 38], [86, 62]]); }
  }),
  define({
    id: 'vee', name: 'V 形漏斗', family: '斜切分隔', h: 125,
    desc: '上方橫幅，下方三格的分隔線向底部中央收攏（約 9°），中間格成倒梯形（4:5）',
    build: function (c) {
      var rows = C.hsplitW(c, [34, 66]);
      return [rows[0]].concat(C.vsplit(rows[1], [[25, 38], [75, 62]]));
    }
  })
];
