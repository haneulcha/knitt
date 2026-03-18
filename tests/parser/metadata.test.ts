import { describe, it, expect } from 'vitest'
import { parseMetadata } from '../../src/parser/metadata.js'

describe('parseMetadata', () => {
  it('parses full metadata header', () => {
    const input = `---
name: 2x2 리브 스카프
cast-on: 40
gauge: 20sts x 28rows / 10cm
yarn: 4ply wool
---
Row 1 (RS): *k2, p2* x10`
    const result = parseMetadata(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.metadata).toEqual({
      name: '2x2 리브 스카프',
      castOn: 40,
      gauge: '20sts x 28rows / 10cm',
      yarn: '4ply wool',
    })
    expect(result.value.rest).toBe('Row 1 (RS): *k2, p2* x10')
  })

  it('parses minimal metadata (cast-on only)', () => {
    const input = `---
cast-on: 20
---
Row 1 (RS): k20`
    const result = parseMetadata(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.metadata?.castOn).toBe(20)
    expect(result.value.metadata?.name).toBeUndefined()
  })

  it('returns null metadata for input without header', () => {
    const input = `Row 1 (RS): k4, p4`
    const result = parseMetadata(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.metadata).toBeNull()
    expect(result.value.rest).toBe(input)
  })

  it('fails when cast-on is missing', () => {
    const input = `---
name: test
---
Row 1 (RS): k4`
    const result = parseMetadata(input)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error.message).toContain('cast-on')
  })

  it('fails when cast-on is not a number', () => {
    const input = `---
cast-on: abc
---
Row 1 (RS): k4`
    const result = parseMetadata(input)
    expect(result.ok).toBe(false)
  })

  it('fails when closing --- is missing', () => {
    const input = `---
cast-on: 20
Row 1 (RS): k4`
    const result = parseMetadata(input)
    expect(result.ok).toBe(false)
  })

  it('ignores unknown keys', () => {
    const input = `---
cast-on: 10
author: someone
---
Row 1 (RS): k10`
    const result = parseMetadata(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.metadata?.castOn).toBe(10)
  })
})
