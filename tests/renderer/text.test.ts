import { describe, it, expect } from 'vitest'
import { renderText } from '../../src/renderer/text.js'
import type { Pattern } from '../../src/domain/types.js'

describe('renderText', () => {
  const knit: Pattern = { kind: 'stitch', value: { kind: 'knit' } }
  const purl: Pattern = { kind: 'stitch', value: { kind: 'purl' } }
  const yo: Pattern = { kind: 'stitch', value: { kind: 'yarn-over' } }
  const k2tog: Pattern = { kind: 'stitch', value: { kind: 'k2tog' } }

  describe('Korean output', () => {
    it('renders simple row', () => {
      const row: Pattern = {
        kind: 'row',
        stitches: [
          { kind: 'repeat', body: [knit], times: 4 },
        ],
        side: 'RS',
        rowNumber: 1,
      }
      expect(renderText(row, 'ko')).toBe('Row 1 (RS): 겉뜨기 4코')
    })

    it('renders repeat pattern', () => {
      const row: Pattern = {
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
      }
      expect(renderText(row, 'ko')).toBe('Row 1 (RS): (겉뜨기 2코, 안뜨기 2코) × 5회')
    })

    it('renders fixed stitches', () => {
      const row: Pattern = {
        kind: 'row',
        stitches: [yo, k2tog],
        side: 'RS',
        rowNumber: 1,
      }
      expect(renderText(row, 'ko')).toBe('Row 1 (RS): 걸기코, 오른코 줄이기')
    })

    it('renders cable', () => {
      const row: Pattern = {
        kind: 'row',
        stitches: [{
          kind: 'stitch',
          value: { kind: 'cable', count: 4, direction: 'front' },
        }],
        side: 'RS',
        rowNumber: 1,
      }
      expect(renderText(row, 'ko')).toBe('Row 1 (RS): 4코 앞 케이블')
    })
  })

  describe('English output', () => {
    it('renders simple row', () => {
      const row: Pattern = {
        kind: 'row',
        stitches: [
          { kind: 'repeat', body: [knit], times: 4 },
        ],
        side: 'RS',
        rowNumber: 1,
      }
      expect(renderText(row, 'en')).toBe('Row 1 (RS): k4')
    })

    it('renders repeat pattern', () => {
      const row: Pattern = {
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
      }
      expect(renderText(row, 'en')).toBe('Row 1 (RS): *k2, p2* x5')
    })
  })

  describe('block rendering', () => {
    it('renders full block', () => {
      const block: Pattern = {
        kind: 'block',
        castOn: 20,
        rows: [
          {
            kind: 'row',
            stitches: [{ kind: 'repeat', body: [
              { kind: 'repeat', body: [knit], times: 2 },
              { kind: 'repeat', body: [purl], times: 2 },
            ], times: 5 }],
            side: 'RS',
            rowNumber: 1,
          },
          {
            kind: 'row',
            stitches: [{ kind: 'repeat', body: [
              { kind: 'repeat', body: [purl], times: 2 },
              { kind: 'repeat', body: [knit], times: 2 },
            ], times: 5 }],
            side: 'WS',
            rowNumber: 2,
          },
        ],
      }
      const result = renderText(block, 'ko')
      expect(result).toBe(
        'Cast on: 20코\nRow 1 (RS): (겉뜨기 2코, 안뜨기 2코) × 5회\nRow 2 (WS): (안뜨기 2코, 겉뜨기 2코) × 5회'
      )
    })
  })
})
