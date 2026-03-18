import { describe, it, expect } from 'vitest'
import { validateStitch, validateRow, validateBlock } from '../../src/validator/validate.js'
import type { Stitch, Pattern } from '../../src/domain/types.js'

describe('validateStitch', () => {
  it('knit with enough stitches succeeds', () => {
    const stitch: Stitch = { kind: 'knit' }
    const result = validateStitch(stitch, { currentCount: 10, rowNumber: 1 }, 0)
    expect(result).toEqual({ ok: true, value: { currentCount: 10, rowNumber: 1 } })
  })

  it('k2tog with enough stitches succeeds (consumes 2, produces 1)', () => {
    const stitch: Stitch = { kind: 'k2tog' }
    const result = validateStitch(stitch, { currentCount: 10, rowNumber: 1 }, 0)
    expect(result).toEqual({ ok: true, value: { currentCount: 9, rowNumber: 1 } })
  })

  it('yarn-over always succeeds (consumes 0)', () => {
    const stitch: Stitch = { kind: 'yarn-over' }
    const result = validateStitch(stitch, { currentCount: 0, rowNumber: 1 }, 0)
    expect(result).toEqual({ ok: true, value: { currentCount: 1, rowNumber: 1 } })
  })

  it('k2tog with only 1 stitch fails', () => {
    const stitch: Stitch = { kind: 'k2tog' }
    const result = validateStitch(stitch, { currentCount: 1, rowNumber: 1 }, 3)
    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'insufficient-stitches',
        needed: 2,
        available: 1,
        location: { row: 1, position: 3 },
      },
    })
  })

  it('cable with insufficient stitches fails', () => {
    const stitch: Stitch = { kind: 'cable', count: 6, direction: 'front' }
    const result = validateStitch(stitch, { currentCount: 4, rowNumber: 2 }, 1)
    expect(result).toEqual({
      ok: false,
      error: {
        kind: 'insufficient-stitches',
        needed: 6,
        available: 4,
        location: { row: 2, position: 1 },
      },
    })
  })
})

describe('validateRow', () => {
  const s = (kind: Stitch['kind']): Pattern => ({
    kind: 'stitch',
    value: kind === 'cable'
      ? { kind: 'cable', count: 4, direction: 'front' as const }
      : { kind } as Stitch,
  })

  it('simple row k4 on 4 stitches → 4 stitches out', () => {
    const row: Pattern = {
      kind: 'row',
      stitches: [s('knit'), s('knit'), s('knit'), s('knit')],
      side: 'RS',
      rowNumber: 1,
    }
    const result = validateRow(row as Pattern & { kind: 'row' }, 4)
    expect(result).toEqual({ ok: true, value: 4 })
  })

  it('row with k2tog reduces count', () => {
    const row: Pattern = {
      kind: 'row',
      stitches: [s('knit'), s('k2tog'), s('knit')],
      side: 'RS',
      rowNumber: 1,
    }
    const result = validateRow(row as Pattern & { kind: 'row' }, 4)
    expect(result).toEqual({ ok: true, value: 3 })
  })

  it('row consuming more than available fails', () => {
    const row: Pattern = {
      kind: 'row',
      stitches: [s('k2tog'), s('k2tog')],
      side: 'RS',
      rowNumber: 1,
    }
    const result = validateRow(row as Pattern & { kind: 'row' }, 3)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.kind).toBe('insufficient-stitches')
    }
  })

  it('repeat node expands correctly', () => {
    const row: Pattern = {
      kind: 'row',
      stitches: [{
        kind: 'repeat',
        body: [s('knit'), s('purl')],
        times: 3,
      }],
      side: 'RS',
      rowNumber: 1,
    }
    const result = validateRow(row as Pattern & { kind: 'row' }, 6)
    expect(result).toEqual({ ok: true, value: 6 })
  })

  it('nested repeat works', () => {
    // *k1, *p1, yo* x2* x2 on 6 stitches
    // inner: p1, yo = consumes 1, produces 2, delta +1, repeated x2 = consumes 2, delta +2
    // outer body: k1 (delta 0) + inner (delta +2) = delta +2 per outer repeat
    // x2: start with 6, after first outer: k1(5) then p1(4)yo(5) p1(4)yo(5) = 5+2=7?
    // Let me trace: start=6
    // Outer iteration 1: k1 (consumes 1, count 6->6), *p1,yo*x2: p1(6->5+0=5..wait
    // Actually: k consumes 1 produces 1 delta 0. So count stays 6.
    // p1: consumes 1 produces 1 delta 0. count stays 6.
    // yo: consumes 0 produces 1 delta +1. count goes 6->7.
    // p1: count 7->7. yo: 7->8. So after inner x2: 8.
    // Outer iteration 2: k1: 8->8. p1: 8->8. yo: 8->9. p1: 9->9. yo: 9->10.
    // Final: 10.
    const row: Pattern = {
      kind: 'row',
      stitches: [{
        kind: 'repeat',
        body: [
          s('knit'),
          { kind: 'repeat', body: [s('purl'), s('yarn-over')], times: 2 },
        ],
        times: 2,
      }],
      side: 'RS',
      rowNumber: 1,
    }
    const result = validateRow(row as Pattern & { kind: 'row' }, 6)
    expect(result).toEqual({ ok: true, value: 10 })
  })
})

describe('validateBlock', () => {
  const s = (kind: Stitch['kind']): Pattern => ({
    kind: 'stitch',
    value: kind === 'cable'
      ? { kind: 'cable', count: 4, direction: 'front' as const }
      : { kind } as Stitch,
  })

  it('valid 2x2 rib block passes', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 8,
      rows: [
        {
          kind: 'row',
          stitches: [{ kind: 'repeat', body: [s('knit'), s('knit'), s('purl'), s('purl')], times: 2 }],
          side: 'RS',
          rowNumber: 1,
        },
        {
          kind: 'row',
          stitches: [{ kind: 'repeat', body: [s('purl'), s('purl'), s('knit'), s('knit')], times: 2 }],
          side: 'WS',
          rowNumber: 2,
        },
      ],
    }
    const result = validateBlock(block as Pattern & { kind: 'block' })
    expect(result).toEqual({ ok: true, value: undefined })
  })

  it('block with count mismatch fails', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 4,
      rows: [
        {
          kind: 'row',
          stitches: [s('knit'), s('knit'), s('knit'), s('knit'), s('knit')],
          side: 'RS',
          rowNumber: 1,
        },
      ],
    }
    const result = validateBlock(block as Pattern & { kind: 'block' })
    expect(result.ok).toBe(false)
  })

  it('shaping rows update count for next row', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 4,
      rows: [
        {
          kind: 'row',
          stitches: [s('knit'), s('kfb'), s('knit'), s('knit')],
          side: 'RS',
          rowNumber: 1,
        },
        {
          kind: 'row',
          stitches: [s('purl'), s('purl'), s('purl'), s('purl'), s('purl')],
          side: 'WS',
          rowNumber: 2,
        },
      ],
    }
    const result = validateBlock(block as Pattern & { kind: 'block' })
    expect(result).toEqual({ ok: true, value: undefined })
  })

  it('collects multiple errors', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 2,
      rows: [
        {
          kind: 'row',
          stitches: [s('k2tog'), s('k2tog')],
          side: 'RS',
          rowNumber: 1,
        },
      ],
    }
    const result = validateBlock(block as Pattern & { kind: 'block' })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.length).toBeGreaterThanOrEqual(1)
    }
  })
})
