import { describe, it, expect } from 'vitest'
import { parse } from '../src/parser/parser.js'
import { validateBlock } from '../src/validator/validate.js'
import type { Pattern } from '../src/domain/types.js'

function parseAndValidate(input: string, castOn: number) {
  const parseResult = parse(input)
  if (!parseResult.ok) return parseResult
  const block = parseResult.value
  if (block.kind !== 'block') return { ok: false as const, error: { message: 'Expected block' } }
  const withCastOn: Pattern & { kind: 'block' } = { ...block, castOn } as Pattern & { kind: 'block' }
  return validateBlock(withCastOn)
}

describe('parse → validate integration', () => {
  it('valid 2x2 rib passes', () => {
    const input = `Row 1 (RS): *k2, p2* x5
Row 2 (WS): *p2, k2* x5`
    const result = parseAndValidate(input, 20)
    expect(result.ok).toBe(true)
  })

  it('row consuming more stitches than cast on fails', () => {
    const input = `Row 1 (RS): *k2, p2* x5`
    const result = parseAndValidate(input, 10)
    expect(result.ok).toBe(false)
  })

  it('shaping with yo + k2tog is balanced', () => {
    const input = `Row 1 (RS): k1, yo, k2tog, k1`
    const result = parseAndValidate(input, 4)
    expect(result.ok).toBe(true)
  })

  it('cable pattern validates correctly', () => {
    const input = `Row 1 (RS): k2, C4F, k2`
    const result = parseAndValidate(input, 8)
    expect(result.ok).toBe(true)
  })

  it('cable pattern with wrong count fails', () => {
    const input = `Row 1 (RS): k2, C4F, k2`
    const result = parseAndValidate(input, 6)
    expect(result.ok).toBe(false)
  })
})
