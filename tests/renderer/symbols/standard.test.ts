import { describe, it, expect } from 'vitest'
import { standardSymbols } from '../../../src/renderer/symbols/standard.js'
import type { Stitch } from '../../../src/domain/types.js'

describe('standardSymbols', () => {
  const x = 0
  const y = 0
  const size = 16

  it('renders knit as empty rect', () => {
    const stitch: Stitch = { kind: 'knit' }
    const svg = standardSymbols.knit(stitch, x, y, size)
    expect(svg).toContain('<rect')
    expect(svg).not.toContain('<circle')
    expect(svg).not.toContain('<line')
  })

  it('renders purl with filled circle', () => {
    const stitch: Stitch = { kind: 'purl' }
    const svg = standardSymbols.purl(stitch, x, y, size)
    expect(svg).toContain('<rect')
    expect(svg).toContain('<circle')
    expect(svg).toContain('fill="#333"')
  })

  it('renders yarn-over with open circle', () => {
    const stitch: Stitch = { kind: 'yarn-over' }
    const svg = standardSymbols['yarn-over'](stitch, x, y, size)
    expect(svg).toContain('<circle')
    expect(svg).toContain('fill="none"')
  })

  it('renders k2tog with right-leaning line', () => {
    const stitch: Stitch = { kind: 'k2tog' }
    const svg = standardSymbols.k2tog(stitch, x, y, size)
    expect(svg).toContain('<line')
  })

  it('renders cable with direction-dependent curves', () => {
    const front: Stitch = { kind: 'cable', count: 4, direction: 'front' }
    const back: Stitch = { kind: 'cable', count: 4, direction: 'back' }
    const svgFront = standardSymbols.cable(front, x, y, size)
    const svgBack = standardSymbols.cable(back, x, y, size)
    expect(svgFront).toContain('<path')
    expect(svgBack).toContain('<path')
    expect(svgFront).not.toBe(svgBack)
  })

  it('renders bind-off with X cross', () => {
    const stitch: Stitch = { kind: 'bind-off' }
    const svg = standardSymbols['bind-off'](stitch, x, y, size)
    const lineCount = (svg.match(/<line/g) ?? []).length
    expect(lineCount).toBe(2)
  })

  it('has a renderer for every StitchKind', () => {
    const kinds = [
      'knit', 'purl', 'yarn-over', 'k2tog', 'ssk', 'kfb', 'slip', 'cable',
      'm1l', 'm1r', 'p2tog', 'ssp', 'sk2p', 'bind-off', 'pick-up',
    ] as const
    for (const kind of kinds) {
      expect(typeof standardSymbols[kind]).toBe('function')
    }
  })
})
