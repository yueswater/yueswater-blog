// Formula sizes and the export resolution (no browser needed).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { layoutFormula, fitScale, MATH_RASTER_SCALE, MAX_CANVAS_PIXELS, EX_PX } from '../../../tools/contact-editor/math-raster/layout.mjs'

test('the export scale is one constant, 4 by default', () => assert.equal(MATH_RASTER_SCALE, 4))

test('inline: natural size, depth below the baseline', () => {
  const L = layoutFormula({ wEx: 4, hEx: 2.5, dEx: 0.5 }, false)
  assert.deepEqual([L.w, L.h, L.d, L.shrunk], [4 * EX_PX, 2.5 * EX_PX, 0.5 * EX_PX, false])
})

test('display: fixed 560 wide, centred, as tall as the formula', () => {
  const L = layoutFormula({ wEx: 20, hEx: 6, dEx: 0 }, true)
  assert.equal(L.w, 560)
  assert.equal(L.h, 6 * EX_PX)
  assert.equal(L.x, (560 - 20 * EX_PX) / 2)
  assert.equal(L.shrunk, false)
})

test('a formula wider than 560 is scaled down proportionally, never cropped', () => {
  const L = layoutFormula({ wEx: 140, hEx: 10, dEx: 2 }, true)
  assert.equal(L.shrunk, true)
  assert.equal(L.drawW, 560)
  assert.ok(Math.abs(L.drawH / L.drawW - (10 * EX_PX) / (140 * EX_PX)) < 1e-9)
  assert.equal(L.x, 0)
  assert.equal(layoutFormula({ wEx: 140, hEx: 10, dEx: 2 }, false).shrunk, true)
})

test('the pixel cap lowers the scale for that formula only', () => {
  assert.equal(fitScale(560, 60), 4)
  const s = fitScale(560, 8000)
  assert.ok(s < 4)
  assert.ok(560 * s * 8000 * s <= MAX_CANVAS_PIXELS + 1)
  assert.equal(fitScale(560, 8000, 4, 1e9), 4)
})
