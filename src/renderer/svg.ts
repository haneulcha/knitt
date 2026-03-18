import type { Pattern, Stitch } from '../domain/types.js'

const CELL_SIZE = 16

/** Recursively expand a Pattern into a flat array of Stitch values. */
function flattenPattern(pattern: Pattern): Stitch[] {
  switch (pattern.kind) {
    case 'stitch':
      return [pattern.value]

    case 'repeat': {
      const expanded: Stitch[] = []
      for (let i = 0; i < pattern.times; i++) {
        for (const p of pattern.body) {
          expanded.push(...flattenPattern(p))
        }
      }
      return expanded
    }

    case 'row': {
      const stitches: Stitch[] = []
      for (const p of pattern.stitches) {
        stitches.push(...flattenPattern(p))
      }
      return stitches
    }

    case 'block': {
      const stitches: Stitch[] = []
      for (const row of pattern.rows) {
        stitches.push(...flattenPattern(row))
      }
      return stitches
    }
  }
}

/** Render a single cell at grid position (col, row) as SVG elements. */
function renderCell(stitch: Stitch, x: number, y: number): string {
  const s = CELL_SIZE
  const cx = x + s / 2
  const cy = y + s / 2
  const pad = 3

  // Background rect for every cell
  const bg = `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="white" stroke="#999" stroke-width="0.5"/>`

  switch (stitch.kind) {
    case 'knit':
      // Empty rect — just the background is enough
      return bg

    case 'purl':
      // Dot (filled circle) at center
      return bg + `<circle cx="${cx}" cy="${cy}" r="${s / 5}" fill="#333"/>`

    case 'yarn-over':
      // Open circle at center
      return bg + `<circle cx="${cx}" cy="${cy}" r="${s / 4}" fill="none" stroke="#333" stroke-width="1"/>`

    case 'k2tog':
      // Right-leaning line (/)
      return bg + `<line x1="${x + pad}" y1="${y + s - pad}" x2="${x + s - pad}" y2="${y + pad}" stroke="#333" stroke-width="1.5"/>`

    case 'ssk':
      // Left-leaning line (\)
      return bg + `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`

    case 'kfb': {
      // V shape
      const mid = x + s / 2
      return (
        bg +
        `<polyline points="${x + pad},${y + pad} ${mid},${y + s - pad} ${x + s - pad},${y + pad}" ` +
        `fill="none" stroke="#333" stroke-width="1.5"/>`
      )
    }

    case 'slip':
      // Horizontal dash
      return bg + `<line x1="${x + pad}" y1="${cy}" x2="${x + s - pad}" y2="${cy}" stroke="#333" stroke-width="1.5"/>`

    case 'cable': {
      // Curved path representing a cable cross
      const ctrl1x = cx - s / 4
      const ctrl2x = cx + s / 4
      return (
        bg +
        `<path d="M${x + pad},${y + pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + s - pad}" ` +
        `fill="none" stroke="#333" stroke-width="1.5"/>` +
        `<path d="M${x + pad},${y + s - pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + pad}" ` +
        `fill="none" stroke="#333" stroke-width="1.5"/>`
      )
    }
  }
}

/**
 * Render a knitting Pattern as an SVG chart string.
 *
 * Only `block` patterns produce a full chart grid. All other pattern kinds
 * return a minimal empty SVG.
 *
 * Charts read bottom-to-top: row index 0 is placed at the bottom.
 */
export function renderSvg(pattern: Pattern): string {
  if (pattern.kind !== 'block') {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>'
  }

  const rows = pattern.rows
  const numRows = rows.length
  const numCols = pattern.castOn

  const width = numCols * CELL_SIZE
  const height = numRows * CELL_SIZE

  const cells: string[] = []

  for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
    const rowPattern = rows[rowIdx]
    const stitches = flattenPattern(rowPattern)

    // Knitting charts are read bottom-to-top: row index 0 → bottom visual row
    const visualRow = numRows - 1 - rowIdx
    const y = visualRow * CELL_SIZE

    for (let col = 0; col < stitches.length; col++) {
      const x = col * CELL_SIZE
      cells.push(renderCell(stitches[col], x, y))
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    cells.join('') +
    `</svg>`
  )
}
