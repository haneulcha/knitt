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
