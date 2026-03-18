import { describe, it, expect } from 'vitest'
import { jisSymbols } from '../../../src/renderer/symbols/jis.js'
import type { Stitch } from '../../../src/domain/types.js'

describe('jisSymbols', () => {
  const x = 0
  const y = 0
  const size = 16

  it('renders knit as vertical line (not empty rect)', () => {
    const stitch: Stitch = { kind: 'knit' }
    const svg = jisSymbols.knit(stitch, x, y, size)
    expect(svg).toContain('<rect')
    expect(svg).toContain('<line')
  })

  it('renders purl as horizontal line', () => {
    const stitch: Stitch = { kind: 'purl' }
    const svg = jisSymbols.purl(stitch, x, y, size)
    expect(svg).toContain('<line')
  })

  it('renders yarn-over as open circle (same as standard)', () => {
    const stitch: Stitch = { kind: 'yarn-over' }
    const svg = jisSymbols['yarn-over'](stitch, x, y, size)
    expect(svg).toContain('<circle')
    expect(svg).toContain('fill="none"')
  })

  it('renders p2tog with dot (distinguishes from k2tog)', () => {
    const k2togSvg = jisSymbols.k2tog({ kind: 'k2tog' }, x, y, size)
    const p2togSvg = jisSymbols.p2tog({ kind: 'p2tog' }, x, y, size)
    expect(p2togSvg).toContain('<circle')
    expect(k2togSvg).not.toContain('<circle')
  })

  it('has a renderer for every StitchKind', () => {
    const kinds = [
      'knit', 'purl', 'yarn-over', 'k2tog', 'ssk', 'kfb', 'slip', 'cable',
      'm1l', 'm1r', 'p2tog', 'ssp', 'sk2p', 'bind-off', 'pick-up',
    ] as const
    for (const kind of kinds) {
      expect(typeof jisSymbols[kind]).toBe('function')
    }
  })
})
