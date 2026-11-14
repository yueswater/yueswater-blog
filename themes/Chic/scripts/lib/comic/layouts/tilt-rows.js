/** 傾斜雙排: one tilted horizontal divider across the page, then each row split in half. */
var define = require('../define').defineLayout;
var C = require('../cut');

module.exports = define({
  id: 'tilt-rows', name: '傾斜雙排', family: '斜切分隔', h: 100 * 2 / 3,
  desc: '橫分隔線整條傾斜（約 7°），上排左小右大、下排左大右小（3:2）',
  build: function (c) {
    var rows = C.hcut(c, 27, 39.5);
    return C.vsplitW(rows[0], [1, 1]).concat(C.vsplitW(rows[1], [1, 1]));
  }
});
