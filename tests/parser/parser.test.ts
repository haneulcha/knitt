import { describe, it, expect } from 'vitest'
import { parse } from '../../src/parser/parser.js'
import type { Pattern } from '../../src/domain/types.js'

describe('parse', () => {
  it('parses simple stitch list', () => {
    const result = parse('Row 1 (RS): k2, p3')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const block = result.value
    expect(block.kind).toBe('block')
    if (block.kind !== 'block') return
    expect(block.rows).toHaveLength(1)
    const row = block.rows[0]!
    expect(row.kind).toBe('row')
    if (row.kind !== 'row') return
    expect(row.side).toBe('RS')
    expect(row.rowNumber).toBe(1)
    // k2 → repeat of knit x2, p3 → repeat of purl x3
    expect(row.stitches).toHaveLength(2)
    const k2 = row.stitches[0]!
    expect(k2.kind).toBe('repeat')
    if (k2.kind === 'repeat') {
      expect(k2.times).toBe(2)
      expect(k2.body).toHaveLength(1)
      expect(k2.body[0]).toEqual({ kind: 'stitch', value: { kind: 'knit' } })
    }
  })

  it('parses repeat pattern', () => {
    const result = parse('Row 1 (RS): *k2, p2* x5')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const block = result.value
    if (block.kind !== 'block') return
    const row = block.rows[0]!
    if (row.kind !== 'row') return
    expect(row.stitches).toHaveLength(1)
    const repeat = row.stitches[0]!
    expect(repeat.kind).toBe('repeat')
    if (repeat.kind !== 'repeat') return
    expect(repeat.times).toBe(5)
    expect(repeat.body).toHaveLength(2)
  })

  it('parses fixed stitches', () => {
    const result = parse('Row 1 (RS): yo, k2tog, ssk, kfb')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const block = result.value
    if (block.kind !== 'block') return
    const row = block.rows[0]!
    if (row.kind !== 'row') return
    expect(row.stitches).toHaveLength(4)
    expect(row.stitches[0]).toEqual({ kind: 'stitch', value: { kind: 'yarn-over' } })
    expect(row.stitches[1]).toEqual({ kind: 'stitch', value: { kind: 'k2tog' } })
    expect(row.stitches[2]).toEqual({ kind: 'stitch', value: { kind: 'ssk' } })
    expect(row.stitches[3]).toEqual({ kind: 'stitch', value: { kind: 'kfb' } })
  })

  it('parses cable', () => {
    const result = parse('Row 1 (RS): C4F, C6B')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const block = result.value
    if (block.kind !== 'block') return
    const row = block.rows[0]!
    if (row.kind !== 'row') return
    expect(row.stitches[0]).toEqual({
      kind: 'stitch',
      value: { kind: 'cable', count: 4, direction: 'front' },
    })
    expect(row.stitches[1]).toEqual({
      kind: 'stitch',
      value: { kind: 'cable', count: 6, direction: 'back' },
    })
  })

  it('parses multi-row pattern', () => {
    const input = `Row 1 (RS): *k2, p2* x5
Row 2 (WS): *p2, k2* x5`
    const result = parse(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const block = result.value
    if (block.kind !== 'block') return
    expect(block.rows).toHaveLength(2)
  })

  it('parses nested repeats', () => {
    const result = parse('Row 1 (RS): *k2, *p1, yo* x2* x3')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const block = result.value
    if (block.kind !== 'block') return
    const row = block.rows[0]!
    if (row.kind !== 'row') return
    const outer = row.stitches[0]!
    expect(outer.kind).toBe('repeat')
    if (outer.kind !== 'repeat') return
    expect(outer.times).toBe(3)
    expect(outer.body).toHaveLength(2)
    const inner = outer.body[1]!
    expect(inner.kind).toBe('repeat')
    if (inner.kind !== 'repeat') return
    expect(inner.times).toBe(2)
  })

  it('skips comment lines', () => {
    const input = `// 2x2 rib
Row 1 (RS): k2, p2`
    const result = parse(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const block = result.value
    if (block.kind !== 'block') return
    expect(block.rows).toHaveLength(1)
  })

  it('returns error for malformed input', () => {
    const result = parse('Row 1 (RS): @@@')
    expect(result.ok).toBe(false)
  })
})

describe('new stitch parsing', () => {
  it('parses m1l and m1r', () => {
    const result = parse('Row 1 (RS): m1l, k2, m1r')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.value.kind !== 'block') return
    const row = result.value.rows[0]!
    if (row.kind !== 'row') return
    expect(row.stitches[0]).toEqual({ kind: 'stitch', value: { kind: 'm1l' } })
    expect(row.stitches[2]).toEqual({ kind: 'stitch', value: { kind: 'm1r' } })
  })

  it('parses p2tog and ssp', () => {
    const result = parse('Row 1 (RS): p2tog, ssp')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.value.kind !== 'block') return
    const row = result.value.rows[0]!
    if (row.kind !== 'row') return
    expect(row.stitches[0]).toEqual({ kind: 'stitch', value: { kind: 'p2tog' } })
    expect(row.stitches[1]).toEqual({ kind: 'stitch', value: { kind: 'ssp' } })
  })

  it('parses sk2p', () => {
    const result = parse('Row 1 (RS): sk2p')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.value.kind !== 'block') return
    const row = result.value.rows[0]!
    if (row.kind !== 'row') return
    expect(row.stitches[0]).toEqual({ kind: 'stitch', value: { kind: 'sk2p' } })
  })

  it('parses bo5 as repeat of bind-off', () => {
    const result = parse('Row 1 (RS): bo5')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.value.kind !== 'block') return
    const row = result.value.rows[0]!
    if (row.kind !== 'row') return
    const item = row.stitches[0]!
    expect(item.kind).toBe('repeat')
    if (item.kind !== 'repeat') return
    expect(item.times).toBe(5)
    expect(item.body[0]).toEqual({ kind: 'stitch', value: { kind: 'bind-off' } })
  })

  it('parses pu3 as repeat of pick-up', () => {
    const result = parse('Row 1 (RS): pu3')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.value.kind !== 'block') return
    const row = result.value.rows[0]!
    if (row.kind !== 'row') return
    const item = row.stitches[0]!
    expect(item.kind).toBe('repeat')
    if (item.kind !== 'repeat') return
    expect(item.times).toBe(3)
    expect(item.body[0]).toEqual({ kind: 'stitch', value: { kind: 'pick-up' } })
  })
})

describe('metadata integration', () => {
  it('parses pattern with metadata header', () => {
    const input = `---
name: test
cast-on: 20
---
Row 1 (RS): *k2, p2* x5`
    const result = parse(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.value.kind !== 'block') return
    expect(result.value.castOn).toBe(20)
    expect(result.value.metadata?.name).toBe('test')
    expect(result.value.metadata?.castOn).toBe(20)
  })

  it('works without metadata header (backwards compatible)', () => {
    const result = parse('Row 1 (RS): k4')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    if (result.value.kind !== 'block') return
    expect(result.value.castOn).toBe(0)
    expect(result.value.metadata).toBeUndefined()
  })
})
