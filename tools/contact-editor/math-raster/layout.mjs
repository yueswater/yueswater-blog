// Sizes only (no DOM): how big a formula is in the mail, and at which resolution it is drawn.
import { DISPLAY_WIDTH } from '../../../supabase/functions/contact-reply/mathTokens.mjs'

// Export resolution: PNG pixels per CSS pixel. 4 is about 384 DPI at the 96 CSS dpi the mail is laid out in.
export const MATH_RASTER_SCALE = 4
// Safari refuses canvases with more pixels than this; a formula that would pass it is drawn at a lower scale
export const MAX_CANVAS_PIXELS = 16_000_000
// MathJax lays out at a 16px em, and one ex is half of that
export const EX_PX = 8
export const TEXT_COLOR = '#222222'

// ex measures from MathJax: { wEx, hEx, dEx } (dEx: how far the formula reaches below the baseline).
// Display math is centred in a DISPLAY_WIDTH image; anything wider than that is scaled down, never cropped.
export function layoutFormula({ wEx, hEx, dEx }, display) {
  const nw = wEx * EX_PX
  const k = nw > DISPLAY_WIDTH ? DISPLAY_WIDTH / nw : 1
  const w = nw * k
  return {
    w: display ? DISPLAY_WIDTH : w, h: hEx * EX_PX * k, d: dEx * EX_PX * k,
    drawW: w, drawH: hEx * EX_PX * k, x: display ? (DISPLAY_WIDTH - w) / 2 : 0, shrunk: k < 1,
  }
}

// the scale for one formula: the export scale, lowered only as far as the pixel limit needs
export function fitScale(w, h, scale = MATH_RASTER_SCALE, maxPixels = MAX_CANVAS_PIXELS) {
  const area = w * h * scale * scale
  return area > maxPixels ? Math.sqrt(maxPixels / (w * h)) : scale
}
