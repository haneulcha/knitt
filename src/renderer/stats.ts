import type { Pattern, StitchKind } from '../domain/types.js'

export type PatternStats = {
  readonly totalRows: number
  readonly totalStitches: number
  readonly stitchCounts: Record<StitchKind, number>
}

const ALL_STITCH_KINDS: StitchKind[] = [
  'knit', 'purl', 'yarn-over', 'k2tog', 'ssk', 'kfb', 'slip', 'cable',
]

function emptyStitchCounts(): Record<StitchKind, number> {
  const counts = {} as Record<StitchKind, number>
  for (const kind of ALL_STITCH_KINDS) {
    counts[kind] = 0
  }
  return counts
}

function countPattern(pattern: Pattern, multiplier: number, counts: Record<StitchKind, number>): number {
  switch (pattern.kind) {
    case 'stitch':
      counts[pattern.value.kind] += multiplier
      return multiplier

    case 'repeat': {
      let total = 0
      for (const child of pattern.body) {
        total += countPattern(child, multiplier * pattern.times, counts)
      }
      return total
    }

    case 'row': {
      let total = 0
      for (const child of pattern.stitches) {
        total += countPattern(child, multiplier, counts)
      }
      return total
    }

    case 'block': {
      let total = 0
      for (const row of pattern.rows) {
        total += countPattern(row, multiplier, counts)
      }
      return total
    }
  }
}

export function computeStats(pattern: Pattern): PatternStats {
  const counts = emptyStitchCounts()
  const totalStitches = countPattern(pattern, 1, counts)

  let totalRows = 0
  if (pattern.kind === 'block') {
    totalRows = pattern.rows.filter((r) => r.kind === 'row').length
  } else if (pattern.kind === 'row') {
    totalRows = 1
  }

  return { totalRows, totalStitches, stitchCounts: counts }
}
