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
