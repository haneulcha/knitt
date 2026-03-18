import type { Stitch } from '../../domain/types.js'
import type { SymbolSet } from './types.js'

/** Background rect helper shared by all JIS cell renderers. */
function bg(x: number, y: number, s: number): string {
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="white" stroke="#999" stroke-width="0.5"/>`
}

/**
 * JIS (Japanese Industrial Standard) knitting chart symbol set.
 *
 * Key differences from the standard symbol set:
 *   - knit  = vertical line (│) at center, not an empty rect
 *   - purl  = horizontal line (—), not a filled dot
 *   - slip  = right arrow (→): horizontal line with arrowhead
 *   - p2tog / ssp = dot + diagonal line (distinguishes them from k2tog / ssk,
 *                   which carry no dot in both symbol sets)
 *   - m1l / m1r   = same upward chevron (∧) — INTENTIONAL per JIS convention;
 *                   the standard distinguishes left vs. right lean, but JIS uses
 *                   a single make-1 glyph regardless of direction
 */
export const jisSymbols: SymbolSet = {
  knit(stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const cx = x + s / 2
    const pad = 3
    // Vertical line (│) at horizontal center
    return (
      bg(x, y, s) +
      `<line x1="${cx}" y1="${y + pad}" x2="${cx}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`
    )
  },

  purl(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const cy = y + s / 2
    const pad = 3
    // Horizontal line (—)
    return (
      bg(x, y, s) +
      `<line x1="${x + pad}" y1="${cy}" x2="${x + s - pad}" y2="${cy}" stroke="#333" stroke-width="1.5"/>`
    )
  },

  'yarn-over'(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const cx = x + s / 2
    const cy = y + s / 2
    // Open circle — same as standard
    return (
      bg(x, y, s) +
      `<circle cx="${cx}" cy="${cy}" r="${s / 4}" fill="none" stroke="#333" stroke-width="1"/>`
    )
  },

  k2tog(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const pad = 3
    // Right-leaning line (/) — same as standard, no dot
    return (
      bg(x, y, s) +
      `<line x1="${x + pad}" y1="${y + s - pad}" x2="${x + s - pad}" y2="${y + pad}" stroke="#333" stroke-width="1.5"/>`
    )
  },

  ssk(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const pad = 3
    // Left-leaning line (\) — same as standard, no dot
    return (
      bg(x, y, s) +
      `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`
    )
  },

  kfb(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const pad = 3
    const mid = x + s / 2
    // V shape — same as standard
    return (
      bg(x, y, s) +
      `<polyline points="${x + pad},${y + pad} ${mid},${y + s - pad} ${x + s - pad},${y + pad}" ` +
      `fill="none" stroke="#333" stroke-width="1.5"/>`
    )
  },

  slip(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const cy = y + s / 2
    const pad = 3
    const arrowHead = 4
    const arrowTip = x + s - pad
    // Right arrow (→): horizontal line with arrowhead at right end
    return (
      bg(x, y, s) +
      `<line x1="${x + pad}" y1="${cy}" x2="${arrowTip}" y2="${cy}" stroke="#333" stroke-width="1.5"/>` +
      `<polyline points="${arrowTip - arrowHead},${cy - arrowHead / 2} ${arrowTip},${cy} ${arrowTip - arrowHead},${cy + arrowHead / 2}" ` +
      `fill="none" stroke="#333" stroke-width="1.5"/>`
    )
  },

  cable(stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const cx = x + s / 2
    const cy = y + s / 2
    const pad = 3
    const ctrl1x = cx - s / 4
    const ctrl2x = cx + s / 4
    // Curved cable cross — same as standard
    return (
      bg(x, y, s) +
      `<path d="M${x + pad},${y + pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + s - pad}" ` +
      `fill="none" stroke="#333" stroke-width="1.5"/>` +
      `<path d="M${x + pad},${y + s - pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + pad}" ` +
      `fill="none" stroke="#333" stroke-width="1.5"/>`
    )
  },

  // JIS INTENTIONAL: m1l and m1r use the same upward-chevron glyph (∧).
  // The JIS standard does not distinguish left-leaning from right-leaning
  // make-1 increases; a single symmetric symbol is used for both.
  m1l(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const cx = x + s / 2
    const cy = y + s / 2
    const pad = 3
    // Upward chevron (∧)
    return (
      bg(x, y, s) +
      `<polyline points="${x + pad},${y + s - pad} ${cx},${y + pad} ${x + s - pad},${y + s - pad}" ` +
      `fill="none" stroke="#333" stroke-width="1.5"/>`
    )
  },

  // JIS INTENTIONAL: same upward chevron as m1l — see comment above.
  m1r(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const cx = x + s / 2
    const pad = 3
    // Upward chevron (∧) — identical to m1l per JIS convention
    return (
      bg(x, y, s) +
      `<polyline points="${x + pad},${y + s - pad} ${cx},${y + pad} ${x + s - pad},${y + s - pad}" ` +
      `fill="none" stroke="#333" stroke-width="1.5"/>`
    )
  },

  p2tog(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const cx = x + s / 2
    const cy = y + s / 2
    const pad = 3
    // Dot + right-leaning line — dot distinguishes p2tog from k2tog
    return (
      bg(x, y, s) +
      `<circle cx="${cx}" cy="${cy}" r="2" fill="#333"/>` +
      `<line x1="${x + pad}" y1="${y + s - pad}" x2="${x + s - pad}" y2="${y + pad}" stroke="#333" stroke-width="1"/>`
    )
  },

  ssp(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const cx = x + s / 2
    const cy = y + s / 2
    const pad = 3
    // Dot + left-leaning line — dot distinguishes ssp from ssk
    return (
      bg(x, y, s) +
      `<circle cx="${cx}" cy="${cy}" r="2" fill="#333"/>` +
      `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1"/>`
    )
  },

  sk2p(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const cx = x + s / 2
    const cy = y + s / 2
    const pad = 3
    // Centred double decrease — same as standard
    return (
      bg(x, y, s) +
      `<path d="M${x + pad},${y + pad} L${cx},${y + s - pad} L${x + s - pad},${y + pad}" fill="none" stroke="#333" stroke-width="1.5"/>` +
      `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`
    )
  },

  'bind-off'(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const pad = 3
    // X shape — same as standard
    return (
      bg(x, y, s) +
      `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>` +
      `<line x1="${x + s - pad}" y1="${y + pad}" x2="${x + pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`
    )
  },

  'pick-up'(_stitch: Stitch, x: number, y: number, size: number): string {
    const s = size
    const cx = x + s / 2
    const pad = 3
    // Upward triangle — same as standard
    return (
      bg(x, y, s) +
      `<path d="M${x + pad},${y + s - pad} L${cx},${y + pad} L${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
    )
  },
}
