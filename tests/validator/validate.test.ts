import { describe, it, expect } from 'vitest'
import { validateStitch } from '../../src/validator/validate.js'
import type { Stitch } from '../../src/domain/types.js'

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
