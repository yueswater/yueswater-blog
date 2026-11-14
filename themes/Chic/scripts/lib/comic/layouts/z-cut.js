/** Z 字閱讀: a banner on top, a banner at the bottom, and one diagonal splitting the middle band into two triangles. */
var define = require('../define').defineLayout;
var C = require('../cut');

var geom = require('../geom');

module.exports = define({
  id: 'z-cut', name: 'Z 字閱讀', family: '對角切割與異形', h: 125,
  desc: '頂、底各一條橫幅，中間一道對角斜切成兩個三角格，視線走成 Z 字（4:5）',
  build: function (c) {
    var bands = C.hsplit(c, [35, 90]), mid = geom.box(bands[1]);
    var tri = C.cut(bands[1], [mid.x + mid.w, mid.y], [mid.x, mid.y + mid.h]);
    return [bands[0], tri[0], tri[1], bands[2]];
  }
});
