/** 三層夾心: a banner above and below, two portrait panels side by side between them. */
var define = require('../define').defineLayout;
var C = require('../cut');

module.exports = define({
  id: 'sandwich', name: '三層夾心', family: '平整格狀', h: 150,
  desc: '上下各一個橫幅，中間並排兩個直式格（2:3）',
  build: function (c) {
    var rows = C.hsplitW(c, [27, 46, 27]);
    return [rows[0]].concat(C.vsplitW(rows[1], [1, 1]), [rows[2]]);
  }
});
