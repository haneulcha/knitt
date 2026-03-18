import type { Pattern, Stitch } from '../domain/types.js'
import { getSymbolSet } from './symbols/index.js'
import type { ChartStyle } from './symbols/index.js'

const CELL_SIZE = 16

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

export function renderSvg(pattern: Pattern, style: ChartStyle = 'standard'): string {
  if (pattern.kind !== 'block') {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>'
  }

  const symbols = getSymbolSet(style)
  const rows = pattern.rows
  const numRows = rows.length
  const numCols = pattern.castOn

  const width = numCols * CELL_SIZE
  const height = numRows * CELL_SIZE

  const cells: string[] = []

  for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
    const rowPattern = rows[rowIdx]
    if (rowPattern === undefined) continue
    const stitches = flattenPattern(rowPattern)

    const visualRow = numRows - 1 - rowIdx
    const y = visualRow * CELL_SIZE

    for (let col = 0; col < stitches.length; col++) {
      const x = col * CELL_SIZE
      const stitch = stitches[col]
      if (stitch === undefined) continue
      cells.push(symbols[stitch.kind](stitch, x, y, CELL_SIZE))
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    cells.join('') +
    `</svg>`
  )
}
