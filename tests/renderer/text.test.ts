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

describe('new stitch rendering', () => {
  it('renders new stitches in Korean', () => {
    const row: Pattern = {
      kind: 'row',
      stitches: [
        { kind: 'stitch', value: { kind: 'm1l' } },
        { kind: 'stitch', value: { kind: 'm1r' } },
        { kind: 'stitch', value: { kind: 'p2tog' } },
        { kind: 'stitch', value: { kind: 'ssp' } },
        { kind: 'stitch', value: { kind: 'sk2p' } },
        { kind: 'stitch', value: { kind: 'bind-off' } },
        { kind: 'stitch', value: { kind: 'pick-up' } },
      ],
      side: 'RS',
      rowNumber: 1,
    }
    const result = renderText(row, 'ko')
    expect(result).toBe('Row 1 (RS): 왼쪽 늘리기, 오른쪽 늘리기, 안뜨기 오른코 줄이기, 안뜨기 왼코 줄이기, 중앙 줄이기, 코 마무리, 코 줍기')
  })

  it('renders new stitches in English', () => {
    const row: Pattern = {
      kind: 'row',
      stitches: [
        { kind: 'stitch', value: { kind: 'm1l' } },
        { kind: 'stitch', value: { kind: 'bind-off' } },
        { kind: 'stitch', value: { kind: 'pick-up' } },
      ],
      side: 'RS',
      rowNumber: 1,
    }
    expect(renderText(row, 'en')).toBe('Row 1 (RS): m1l, bo, pu')
  })
})

describe('prose style', () => {
  const knit: Pattern = { kind: 'stitch', value: { kind: 'knit' } }
  const purl: Pattern = { kind: 'stitch', value: { kind: 'purl' } }

  it('renders repeat as natural language in Korean', () => {
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
    expect(renderText(row, 'ko', 'prose')).toBe('1단 (겉면): 겉뜨기 2코, 안뜨기 2코를 5번 반복합니다.')
  })

  it('renders repeat as natural language in English', () => {
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
    expect(renderText(row, 'en', 'prose')).toBe('Row 1 (RS): Repeat knit 2, purl 2 a total of 5 times.')
  })

  it('renders single stitch in Korean prose', () => {
    const row: Pattern = {
      kind: 'row',
      stitches: [{ kind: 'repeat', body: [knit], times: 10 }],
      side: 'WS',
      rowNumber: 2,
    }
    expect(renderText(row, 'ko', 'prose')).toBe('2단 (안면): 겉뜨기 10코를 뜹니다.')
  })

  it('renders block with prose header in Korean', () => {
    const block: Pattern = {
      kind: 'block',
      castOn: 20,
      rows: [{
        kind: 'row',
        stitches: [{ kind: 'repeat', body: [knit], times: 20 }],
        side: 'RS',
        rowNumber: 1,
      }],
    }
    const result = renderText(block, 'ko', 'prose')
    expect(result).toContain('20코를 만듭니다.')
    expect(result).toContain('1단 (겉면):')
  })

  it('defaults to short style when omitted', () => {
    const row: Pattern = {
      kind: 'row',
      stitches: [{ kind: 'repeat', body: [knit], times: 4 }],
      side: 'RS',
      rowNumber: 1,
    }
    expect(renderText(row, 'ko')).toBe('Row 1 (RS): 겉뜨기 4코')
    expect(renderText(row, 'ko', 'short')).toBe('Row 1 (RS): 겉뜨기 4코')
  })
})
