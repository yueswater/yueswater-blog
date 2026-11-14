/** 風車: two slanted lines cross at the centre; each panel's point faces the centre, rotating like a windmill. */
var define = require('../define').defineLayout;
var C = require('../cut');

module.exports = define({
  id: 'pinwheel', name: '風車', family: '對角切割與異形', h: 100,
  desc: '兩條斜線在中心交叉，四格尖角都指向中心，輪流旋轉像風車（約 16°）',
  build: function (c) {
    var lines = [[[64, 0], [36, 100]], [[0, 36], [100, 64]]];
    return [[20, 20], [80, 20], [20, 80], [80, 80]].map(function (ref) { return C.cell(c, ref, lines); });
  }
});
