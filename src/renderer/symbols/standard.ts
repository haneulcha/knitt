import type { Stitch } from '../../domain/types.js'
import type { SymbolSet } from './types.js'

/** Background rect common to every cell. */
function bg(x: number, y: number, s: number): string {
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="white" stroke="#999" stroke-width="0.5"/>`
}

export const standardSymbols: SymbolSet = {
  knit(stitch: Stitch, x: number, y: number, size: number): string {
    return bg(x, y, size)
  },

  purl(stitch: Stitch, x: number, y: number, size: number): string {
    const cx = x + size / 2
    const cy = y + size / 2
    return bg(x, y, size) + `<circle cx="${cx}" cy="${cy}" r="${size / 5}" fill="#333"/>`
  },

  'yarn-over'(stitch: Stitch, x: number, y: number, size: number): string {
    const cx = x + size / 2
    const cy = y + size / 2
    return bg(x, y, size) + `<circle cx="${cx}" cy="${cy}" r="${size / 4}" fill="none" stroke="#333" stroke-width="1"/>`
  },

  k2tog(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    return bg(x, y, size) +
      `<line x1="${x + pad}" y1="${y + size - pad}" x2="${x + size - pad}" y2="${y + pad}" stroke="#333" stroke-width="1.5"/>`
  },

  ssk(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    return bg(x, y, size) +
      `<line x1="${x + pad}" y1="${y + pad}" x2="${x + size - pad}" y2="${y + size - pad}" stroke="#333" stroke-width="1.5"/>`
  },

  kfb(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    const mid = x + size / 2
    return (
      bg(x, y, size) +
      `<polyline points="${x + pad},${y + pad} ${mid},${y + size - pad} ${x + size - pad},${y + pad}" ` +
      `fill="none" stroke="#333" stroke-width="1.5"/>`
    )
  },

  slip(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    const cy = y + size / 2
    return bg(x, y, size) +
      `<line x1="${x + pad}" y1="${cy}" x2="${x + size - pad}" y2="${cy}" stroke="#333" stroke-width="1.5"/>`
  },

  cable(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    const cx = x + size / 2
    const cy = y + size / 2
    const direction = stitch.kind === 'cable' ? stitch.direction : 'front'
    const ctrl1x = cx - size / 4
    const ctrl2x = cx + size / 4

    if (direction === 'front') {
      return (
        bg(x, y, size) +
        `<path d="M${x + pad},${y + pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + size - pad},${y + size - pad}" ` +
        `fill="none" stroke="#333" stroke-width="1.5"/>` +
        `<path d="M${x + pad},${y + size - pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + size - pad},${y + pad}" ` +
        `fill="none" stroke="#333" stroke-width="1.5"/>`
      )
    } else {
      // back: swap the crossing direction
      return (
        bg(x, y, size) +
        `<path d="M${x + pad},${y + size - pad} C${ctrl2x},${cy} ${ctrl1x},${cy} ${x + size - pad},${y + pad}" ` +
        `fill="none" stroke="#333" stroke-width="1.5"/>` +
        `<path d="M${x + pad},${y + pad} C${ctrl2x},${cy} ${ctrl1x},${cy} ${x + size - pad},${y + size - pad}" ` +
        `fill="none" stroke="#333" stroke-width="1.5"/>`
      )
    }
  },

  m1l(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    const cy = y + size / 2
    return bg(x, y, size) +
      `<path d="M${x + size - pad},${y + pad} L${x + pad},${cy} L${x + size - pad},${y + size - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },

  m1r(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    const cy = y + size / 2
    return bg(x, y, size) +
      `<path d="M${x + pad},${y + pad} L${x + size - pad},${cy} L${x + pad},${y + size - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },

  p2tog(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    const cx = x + size / 2
    const cy = y + size / 2
    return bg(x, y, size) +
      `<circle cx="${cx}" cy="${cy}" r="2" fill="#333"/>` +
      `<line x1="${x + pad}" y1="${y + size - pad}" x2="${x + size - pad}" y2="${y + pad}" stroke="#333" stroke-width="1"/>`
  },

  ssp(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    const cx = x + size / 2
    const cy = y + size / 2
    return bg(x, y, size) +
      `<circle cx="${cx}" cy="${cy}" r="2" fill="#333"/>` +
      `<line x1="${x + pad}" y1="${y + pad}" x2="${x + size - pad}" y2="${y + size - pad}" stroke="#333" stroke-width="1"/>`
  },

  sk2p(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    const cx = x + size / 2
    const cy = y + size / 2
    return bg(x, y, size) +
      `<path d="M${x + pad},${y + pad} L${cx},${y + size - pad} L${x + size - pad},${y + pad}" fill="none" stroke="#333" stroke-width="1.5"/>` +
      `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${y + size - pad}" stroke="#333" stroke-width="1.5"/>`
  },

  'bind-off'(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    return bg(x, y, size) +
      `<line x1="${x + pad}" y1="${y + pad}" x2="${x + size - pad}" y2="${y + size - pad}" stroke="#333" stroke-width="1.5"/>` +
      `<line x1="${x + size - pad}" y1="${y + pad}" x2="${x + pad}" y2="${y + size - pad}" stroke="#333" stroke-width="1.5"/>`
  },

  'pick-up'(stitch: Stitch, x: number, y: number, size: number): string {
    const pad = 3
    const cx = x + size / 2
    return bg(x, y, size) +
      `<path d="M${x + pad},${y + size - pad} L${cx},${y + pad} L${x + size - pad},${y + size - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },
}
