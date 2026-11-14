/** 斜角主格: a small triangle cut off the top-right corner, an asymmetric pentagon as the hero, two panels below. */
var define = require('../define').defineLayout;
var C = require('../cut');

module.exports = define({
  id: 'hero-corner', name: '斜角主格', family: '對角切割與異形', h: 125,
  desc: '右上角被一刀斜切成小三角格，主畫面是不對稱五邊形，底部並排兩格（4:5）',
  build: function (c) {
    var parts = C.cut(c, [56, 0], [100, 34]);      // [the page minus its corner, the corner triangle]
    var rows = C.hcut(parts[0], 70, 70);
    return [rows[0], parts[1]].concat(C.vsplitW(rows[1], [1, 1]));
  }
});
