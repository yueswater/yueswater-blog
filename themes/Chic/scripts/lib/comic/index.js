/**
 * Registry of the comic page layouts (see define.js for the shape of one).
 * To add a layout: create layouts/<id>.js exporting defineLayout({...}) and add the id to IDS below.
 * layouts/_spare/ holds earlier layouts that are not loaded (copy one up and list it to bring it back).
 */
// display order of the preview; each file is one self-contained layout
var IDS = ['grid', 'brick', 'sandwich', 'slant-grid', 'chevron', 'tilt-rows', 'zigzag', 'z-cut', 'pinwheel', 'hero-corner'];

var LAYOUTS = IDS.map(function (id) { return require('./layouts/' + id); });
var DEFAULT_ID = 'slant-grid';
var BY_ID = {};
LAYOUTS.forEach(function (l) {
  if (BY_ID[l.id]) throw new Error('comic: duplicate layout id ' + l.id);
  BY_ID[l.id] = l;
});

module.exports = {
  LAYOUTS: LAYOUTS,       // in display order, grouped by family
  BY_ID: BY_ID,
  DEFAULT_ID: DEFAULT_ID,
  DEFAULT: BY_ID[DEFAULT_ID]
};
