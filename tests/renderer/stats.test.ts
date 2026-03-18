import { describe, it, expect } from 'vitest'
import { computeStats } from '../../src/renderer/stats.js'
import type { Pattern, StitchKind } from '../../src/domain/types.js'

describe('computeStats', () => {
  const knit: Pattern = { kind: 'stitch', value: { kind: 'knit' } }
  const purl: Pattern = { kind: 'stitch', value: { kind: 'purl' } }

  it('counts stitches in a simple block', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 4,
      rows: [{
        kind: 'row',
        stitches: [
          { kind: 'repeat', body: [knit], times: 2 },
          { kind: 'repeat', body: [purl], times: 2 },
        ],
        side: 'RS',
        rowNumber: 1,
      }],
    }

    const stats = computeStats(block)
    expect(stats.totalRows).toBe(1)
    expect(stats.totalStitches).toBe(4)
    expect(stats.stitchCounts.knit).toBe(2)
    expect(stats.stitchCounts.purl).toBe(2)
  })

  it('handles repeats correctly', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 20,
      rows: [{
        kind: 'row',
        stitches: [{
          kind: 'repeat',
          body: [
            { kind: 'repeat', body: [knit], times: 2 },
            { kind: 'repeat', body: [purl], times: 2 },
          ],
          times: 5,
        }],
        side: 'RS',
        rowNumber: 1,
      }],
    }

    const stats = computeStats(block)
    expect(stats.totalStitches).toBe(20)
    expect(stats.stitchCounts.knit).toBe(10)
    expect(stats.stitchCounts.purl).toBe(10)
  })

  it('counts across multiple rows', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 4,
      rows: [
        {
          kind: 'row',
          stitches: [{ kind: 'repeat', body: [knit], times: 4 }],
          side: 'RS',
          rowNumber: 1,
        },
        {
          kind: 'row',
          stitches: [{ kind: 'repeat', body: [purl], times: 4 }],
          side: 'WS',
          rowNumber: 2,
        },
      ],
    }

    const stats = computeStats(block)
    expect(stats.totalRows).toBe(2)
    expect(stats.totalStitches).toBe(8)
    expect(stats.stitchCounts.knit).toBe(4)
    expect(stats.stitchCounts.purl).toBe(4)
  })

  it('returns zero counts for unused stitch types', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 1,
      rows: [{
        kind: 'row',
        stitches: [knit],
        side: 'RS',
        rowNumber: 1,
      }],
    }

    const stats = computeStats(block)
    expect(stats.stitchCounts['yarn-over']).toBe(0)
    expect(stats.stitchCounts.k2tog).toBe(0)
  })
})
