/** 尖角對斜: the vertical divider leans one way in the top row and the other way in the bottom row, forming a '<'. */
var define = require('../define').defineLayout;
var C = require('../cut');

module.exports = define({
  id: 'chevron', name: '尖角對斜', family: '斜切分隔', h: 125,
  desc: '上下兩排的直分隔線反向傾斜（約 11°），合起來像 < 形（4:5）',
  build: function (c) {
    var rows = C.hsplitW(c, [1, 1]);
    return C.vsplit(rows[0], [[56, 44]]).concat(C.vsplit(rows[1], [[44, 56]]));
  }
});
