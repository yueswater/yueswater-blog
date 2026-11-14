/**
 * 斜切田字: the original comic layout and the default. Kept as literal polygons (including its 2-unit row gap)
 * and flagged `legacy`, so posts written before layouts existed render byte-identically.
 */
var define = require('../define').defineLayout;

module.exports = define({
  id: 'slant-grid', name: '斜切田字', family: '斜切分隔', h: 100, legacy: true,
  desc: '預設：2×2，兩條直分隔線同向微斜（約 3.6°）',
  panels: [
    [[0, 0], [50.7, 0], [47.7, 48], [0, 48]],
    [[52.3, 0], [100, 0], [100, 48], [49.3, 48]],
    [[0, 50], [50.7, 50], [47.7, 100], [0, 100]],
    [[52.3, 50], [100, 50], [100, 100], [49.3, 100]]
  ],
  focus: ['50% 50%', '50% 12%', '50% 12%', '50% 50%']
});
