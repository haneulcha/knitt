import { describe, it, expect } from 'vitest'
import { renderSvg } from '../../src/renderer/svg.js'
import type { Pattern } from '../../src/domain/types.js'

describe('renderSvg', () => {
  const knit: Pattern = { kind: 'stitch', value: { kind: 'knit' } }
  const purl: Pattern = { kind: 'stitch', value: { kind: 'purl' } }

  it('returns valid SVG string', () => {
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
    const svg = renderSvg(block)
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
  })

  it('has correct dimensions for grid', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 4,
      rows: [{
        kind: 'row',
        stitches: [{ kind: 'repeat', body: [knit], times: 4 }],
        side: 'RS',
        rowNumber: 1,
      }],
    }
    const svg = renderSvg(block)
    // 4 columns × 16px = 64, 1 row × 16px = 16
    expect(svg).toContain('width="64"')
    expect(svg).toContain('height="16"')
  })

  it('renders knit as empty rect', () => {
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
    const svg = renderSvg(block)
    expect(svg).toContain('<rect')
  })

  it('renders purl with dot symbol', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 1,
      rows: [{
        kind: 'row',
        stitches: [purl],
        side: 'RS',
        rowNumber: 1,
      }],
    }
    const svg = renderSvg(block)
    expect(svg).toContain('<circle')
  })

  it('renders multi-row block with correct height', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 2,
      rows: [
        {
          kind: 'row',
          stitches: [{ kind: 'repeat', body: [knit], times: 2 }],
          side: 'RS',
          rowNumber: 1,
        },
        {
          kind: 'row',
          stitches: [{ kind: 'repeat', body: [purl], times: 2 }],
          side: 'WS',
          rowNumber: 2,
        },
      ],
    }
    const svg = renderSvg(block)
    // 2 rows × 16px = 32
    expect(svg).toContain('height="32"')
  })
})

describe('renderSvg with style', () => {
  const knit: Pattern = { kind: 'stitch', value: { kind: 'knit' } }
  const purl: Pattern = { kind: 'stitch', value: { kind: 'purl' } }

  const block: Pattern = {
    kind: 'block',
    castOn: 2,
    rows: [{
      kind: 'row',
      stitches: [knit, purl],
      side: 'RS',
      rowNumber: 1,
    }],
  }

  it('defaults to standard style', () => {
    const svg = renderSvg(block)
    expect(svg).toContain('<svg')
    expect(svg).toContain('<rect')
  })

  it('renders with standard style explicitly', () => {
    const svg = renderSvg(block, 'standard')
    expect(svg).toContain('<svg')
  })

  it('renders with jis style', () => {
    const svg = renderSvg(block, 'jis')
    expect(svg).toContain('<svg')
  })

  it('jis knit differs from standard knit', () => {
    const knitBlock: Pattern = {
      kind: 'block',
      castOn: 1,
      rows: [{
        kind: 'row',
        stitches: [knit],
        side: 'RS',
        rowNumber: 1,
      }],
    }
    const standard = renderSvg(knitBlock, 'standard')
    const jis = renderSvg(knitBlock, 'jis')
    expect(standard).not.toContain('<line')
    expect(jis).toContain('<line')
  })
})

describe('new stitch SVG symbols', () => {
  it('renders m1l with arrow symbol', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 1,
      rows: [{
        kind: 'row',
        stitches: [{ kind: 'stitch', value: { kind: 'm1l' } }],
        side: 'RS',
        rowNumber: 1,
      }],
    }
    const svg = renderSvg(block)
    expect(svg).toContain('<svg')
    expect(svg).toContain('<rect')
  })

  it('renders bind-off with X symbol', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 1,
      rows: [{
        kind: 'row',
        stitches: [{ kind: 'stitch', value: { kind: 'bind-off' } }],
        side: 'RS',
        rowNumber: 1,
      }],
    }
    const svg = renderSvg(block)
    expect(svg).toContain('<line')
  })
})
