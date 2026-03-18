import { describe, it, expect } from 'vitest'
import { STITCH_SIGNATURES, getSignature } from '../../src/domain/signatures.js'
import type { Stitch } from '../../src/domain/types.js'

describe('STITCH_SIGNATURES', () => {
  it('knit is neutral (1 in, 1 out)', () => {
    expect(STITCH_SIGNATURES.knit).toEqual({ consumes: 1, produces: 1, delta: 0 })
  })

  it('yarn-over produces 1 from nothing', () => {
    expect(STITCH_SIGNATURES['yarn-over']).toEqual({ consumes: 0, produces: 1, delta: 1 })
  })

  it('k2tog consumes 2 produces 1', () => {
    expect(STITCH_SIGNATURES.k2tog).toEqual({ consumes: 2, produces: 1, delta: -1 })
  })

  it('kfb consumes 1 produces 2', () => {
    expect(STITCH_SIGNATURES.kfb).toEqual({ consumes: 1, produces: 2, delta: 1 })
  })
})

describe('getSignature', () => {
  it('returns signature for simple stitch', () => {
    const stitch: Stitch = { kind: 'knit' }
    expect(getSignature(stitch)).toEqual({ consumes: 1, produces: 1, delta: 0 })
  })

  it('returns dynamic signature for cable', () => {
    const cable: Stitch = { kind: 'cable', count: 4, direction: 'front' }
    expect(getSignature(cable)).toEqual({ consumes: 4, produces: 4, delta: 0 })
  })

  it('returns dynamic signature for cable-6', () => {
    const cable: Stitch = { kind: 'cable', count: 6, direction: 'back' }
    expect(getSignature(cable)).toEqual({ consumes: 6, produces: 6, delta: 0 })
  })
})
