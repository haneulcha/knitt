import { describe, it, expect } from 'vitest'
import { tokenize } from '../../src/parser/lexer.js'

describe('tokenize', () => {
  it('tokenizes simple stitches', () => {
    const result = tokenize('k3, p2')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'STITCH', stitch: 'k', count: 3 },
      { kind: 'COMMA' },
      { kind: 'STITCH', stitch: 'p', count: 2 },
      { kind: 'EOF' },
    ])
  })

  it('bare k/p defaults to count 1', () => {
    const result = tokenize('k, p')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'STITCH', stitch: 'k', count: 1 },
      { kind: 'COMMA' },
      { kind: 'STITCH', stitch: 'p', count: 1 },
      { kind: 'EOF' },
    ])
  })

  it('tokenizes fixed stitches', () => {
    const result = tokenize('yo, k2tog, ssk, kfb')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'FIXED_STITCH', stitch: 'yo' },
      { kind: 'COMMA' },
      { kind: 'FIXED_STITCH', stitch: 'k2tog' },
      { kind: 'COMMA' },
      { kind: 'FIXED_STITCH', stitch: 'ssk' },
      { kind: 'COMMA' },
      { kind: 'FIXED_STITCH', stitch: 'kfb' },
      { kind: 'EOF' },
    ])
  })

  it('tokenizes cables', () => {
    const result = tokenize('C4F, C6B')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'CABLE', count: 4, direction: 'F' },
      { kind: 'COMMA' },
      { kind: 'CABLE', count: 6, direction: 'B' },
      { kind: 'EOF' },
    ])
  })

  it('tokenizes repeat markers', () => {
    const result = tokenize('*k2, p2* x4')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'REPEAT_START' },
      { kind: 'STITCH', stitch: 'k', count: 2 },
      { kind: 'COMMA' },
      { kind: 'STITCH', stitch: 'p', count: 2 },
      { kind: 'REPEAT_END' },
      { kind: 'TIMES', count: 4 },
      { kind: 'EOF' },
    ])
  })

  it('tokenizes row header', () => {
    const result = tokenize('Row 1 (RS): k2, p2')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value[0]).toEqual({ kind: 'ROW', number: 1, side: 'RS' })
    expect(result.value[1]).toEqual({ kind: 'COLON' })
  })

  it('skips comments', () => {
    const result = tokenize('// this is a comment')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([{ kind: 'EOF' }])
  })

  it('returns error for unknown token', () => {
    const result = tokenize('k2, @, p1')
    expect(result.ok).toBe(false)
  })

  it('tokenizes sl with count', () => {
    const result = tokenize('sl1, sl3')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'STITCH', stitch: 'sl', count: 1 },
      { kind: 'COMMA' },
      { kind: 'STITCH', stitch: 'sl', count: 3 },
      { kind: 'EOF' },
    ])
  })
})

describe('new stitch tokens', () => {
  it('tokenizes m1l and m1r', () => {
    const result = tokenize('m1l, m1r')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'FIXED_STITCH', stitch: 'm1l' },
      { kind: 'COMMA' },
      { kind: 'FIXED_STITCH', stitch: 'm1r' },
      { kind: 'EOF' },
    ])
  })

  it('tokenizes p2tog', () => {
    const result = tokenize('p2tog')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([{ kind: 'FIXED_STITCH', stitch: 'p2tog' }, { kind: 'EOF' }])
  })

  it('tokenizes ssp', () => {
    const result = tokenize('ssp')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([{ kind: 'FIXED_STITCH', stitch: 'ssp' }, { kind: 'EOF' }])
  })

  it('tokenizes sk2p', () => {
    const result = tokenize('sk2p')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([{ kind: 'FIXED_STITCH', stitch: 'sk2p' }, { kind: 'EOF' }])
  })

  it('tokenizes bo with count', () => {
    const result = tokenize('bo5')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([{ kind: 'STITCH', stitch: 'bo', count: 5 }, { kind: 'EOF' }])
  })

  it('tokenizes bare bo as count 1', () => {
    const result = tokenize('bo')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([{ kind: 'STITCH', stitch: 'bo', count: 1 }, { kind: 'EOF' }])
  })

  it('tokenizes pu with count', () => {
    const result = tokenize('pu3')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([{ kind: 'STITCH', stitch: 'pu', count: 3 }, { kind: 'EOF' }])
  })

  it('p2tog does not collide with p2', () => {
    const result = tokenize('p2tog, p2')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value[0]).toEqual({ kind: 'FIXED_STITCH', stitch: 'p2tog' })
    expect(result.value[2]).toEqual({ kind: 'STITCH', stitch: 'p', count: 2 })
  })

  it('pu does not collide with p', () => {
    const result = tokenize('pu, p1')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value[0]).toEqual({ kind: 'STITCH', stitch: 'pu', count: 1 })
    expect(result.value[2]).toEqual({ kind: 'STITCH', stitch: 'p', count: 1 })
  })
})
