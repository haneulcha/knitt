# Phase 1: Core Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the knitting pattern DSL with 7 new stitch types, a metadata header format (.knit files), and human-readable error message formatting in Korean/English.

**Architecture:** Incremental extension of the existing pipeline. New stitches are added at every layer (types → signatures → lexer → parser → renderers). Metadata header parsing is a new pre-processing step before the existing lexer. Error formatting is a new pure-function module that converts structured errors to localized strings.

**Tech Stack:** TypeScript (strict), Vitest, no new dependencies

---

## File Structure

```
src/
  domain/
    types.ts          — MODIFY: add StitchKind variants, PatternMetadata, MetadataError, extend Token/STITCH
    signatures.ts     — MODIFY: add 7 new stitch signatures
  parser/
    metadata.ts       — CREATE: metadata header parser
    lexer.ts          — MODIFY: add new token patterns (m1l, m1r, p2tog, ssp, sk2p, bo, pu)
    parser.ts         — MODIFY: integrate metadata parser, map new stitch tokens
    index.ts          — MODIFY: re-export parseMetadata
  validator/
    format.ts         — CREATE: error message formatter (ko/en)
    validate.ts       — NO CHANGE (new stitches work automatically via signatures)
    index.ts          — MODIFY: re-export formatters
  renderer/
    text.ts           — MODIFY: add stitch names for 7 new types
    svg.ts            — MODIFY: add SVG symbols for 7 new types
    stats.ts          — MODIFY: update ALL_STITCH_KINDS array
    index.ts          — NO CHANGE
  index.ts            — MODIFY: re-export new types and formatters
tests/
  domain/
    signatures.test.ts — MODIFY: add tests for new signatures
  parser/
    metadata.test.ts   — CREATE: metadata parser tests
    lexer.test.ts      — MODIFY: add tests for new tokens
    parser.test.ts     — MODIFY: add tests for metadata integration + new stitches
  validator/
    format.test.ts     — CREATE: formatter tests
  renderer/
    text.test.ts       — MODIFY: add tests for new stitch rendering
    svg.test.ts        — MODIFY: add tests for new stitch SVG symbols
  integration.test.ts  — MODIFY: add tests with metadata header patterns
```

---

### Task 1: Extend Domain Types

**Files:**
- Modify: `src/domain/types.ts:3-11` (StitchKind)
- Modify: `src/domain/types.ts:23` (Pattern block variant)
- Modify: `src/domain/types.ts:56-66` (Token types)
- Modify: `src/domain/signatures.ts:3-11` (STITCH_SIGNATURES)
- Modify: `tests/domain/signatures.test.ts`

- [ ] **Step 1: Write failing tests for new signatures**

Append to `tests/domain/signatures.test.ts`:
```typescript
describe('new stitch signatures', () => {
  it('m1l produces 1 from nothing', () => {
    expect(STITCH_SIGNATURES.m1l).toEqual({ consumes: 0, produces: 1, delta: 1 })
  })

  it('m1r produces 1 from nothing', () => {
    expect(STITCH_SIGNATURES.m1r).toEqual({ consumes: 0, produces: 1, delta: 1 })
  })

  it('p2tog consumes 2 produces 1', () => {
    expect(STITCH_SIGNATURES.p2tog).toEqual({ consumes: 2, produces: 1, delta: -1 })
  })

  it('ssp consumes 2 produces 1', () => {
    expect(STITCH_SIGNATURES.ssp).toEqual({ consumes: 2, produces: 1, delta: -1 })
  })

  it('sk2p consumes 3 produces 1', () => {
    expect(STITCH_SIGNATURES.sk2p).toEqual({ consumes: 3, produces: 1, delta: -2 })
  })

  it('bind-off consumes 1 produces 0', () => {
    expect(STITCH_SIGNATURES['bind-off']).toEqual({ consumes: 1, produces: 0, delta: -1 })
  })

  it('pick-up consumes 0 produces 1', () => {
    expect(STITCH_SIGNATURES['pick-up']).toEqual({ consumes: 0, produces: 1, delta: 1 })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/domain/signatures.test.ts`
Expected: FAIL — property does not exist

- [ ] **Step 3: Extend StitchKind in types.ts**

Replace lines 3-11 of `src/domain/types.ts`:
```typescript
export type StitchKind =
  | 'knit'
  | 'purl'
  | 'yarn-over'
  | 'k2tog'
  | 'ssk'
  | 'kfb'
  | 'slip'
  | 'cable'
  | 'm1l'
  | 'm1r'
  | 'p2tog'
  | 'ssp'
  | 'sk2p'
  | 'bind-off'
  | 'pick-up'
```

- [ ] **Step 4: Add PatternMetadata and MetadataError types**

Add after the ValidationError type (after line 52) in `src/domain/types.ts`:
```typescript
// === Metadata ===

export type PatternMetadata = {
  readonly name?: string
  readonly castOn: number
  readonly gauge?: string
  readonly yarn?: string
}

export type MetadataError = {
  readonly message: string
  readonly line: number
}
```

- [ ] **Step 5: Add metadata field to block Pattern variant**

Replace line 23 of `src/domain/types.ts`:
```typescript
  | { readonly kind: 'block'; readonly rows: Pattern[]; readonly castOn: number; readonly metadata?: PatternMetadata }
```

- [ ] **Step 6: Extend Token STITCH and FIXED_STITCH types**

Replace lines 58-59 of `src/domain/types.ts`:
```typescript
  | { readonly kind: 'STITCH'; readonly stitch: 'k' | 'p' | 'sl' | 'bo' | 'pu'; readonly count: number }
  | { readonly kind: 'FIXED_STITCH'; readonly stitch: 'yo' | 'k2tog' | 'ssk' | 'kfb' | 'm1l' | 'm1r' | 'p2tog' | 'ssp' | 'sk2p' }
```

- [ ] **Step 7: Add new signatures**

In `src/domain/signatures.ts`, add 7 entries to `STITCH_SIGNATURES` (change the Record key type to `Exclude<StitchKind, 'cable'>`):
```typescript
export const STITCH_SIGNATURES: Record<Exclude<StitchKind, 'cable'>, StitchSignature> = {
  knit:        { consumes: 1, produces: 1, delta: 0 },
  purl:        { consumes: 1, produces: 1, delta: 0 },
  'yarn-over': { consumes: 0, produces: 1, delta: 1 },
  k2tog:       { consumes: 2, produces: 1, delta: -1 },
  ssk:         { consumes: 2, produces: 1, delta: -1 },
  kfb:         { consumes: 1, produces: 2, delta: 1 },
  slip:        { consumes: 1, produces: 1, delta: 0 },
  m1l:         { consumes: 0, produces: 1, delta: 1 },
  m1r:         { consumes: 0, produces: 1, delta: 1 },
  p2tog:       { consumes: 2, produces: 1, delta: -1 },
  ssp:         { consumes: 2, produces: 1, delta: -1 },
  sk2p:        { consumes: 3, produces: 1, delta: -2 },
  'bind-off':  { consumes: 1, produces: 0, delta: -1 },
  'pick-up':   { consumes: 0, produces: 1, delta: 1 },
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run tests/domain/signatures.test.ts`
Expected: All tests pass (7 old + 7 new = 14)

- [ ] **Step 9: Run full test suite**

Run: `npx vitest run`
Expected: Some renderer tests may fail because `switch` statements on `StitchKind` are no longer exhaustive. That's OK — we'll fix those in later tasks. The domain and validator tests should all pass.

- [ ] **Step 10: Commit**

```bash
git add src/domain/types.ts src/domain/signatures.ts tests/domain/signatures.test.ts
git commit -m "feat: extend domain types with 7 new stitches, PatternMetadata, and MetadataError"
```

---

### Task 2: Metadata Header Parser

**Files:**
- Create: `src/parser/metadata.ts`
- Create: `tests/parser/metadata.test.ts`
- Modify: `src/parser/index.ts`

- [ ] **Step 1: Write failing tests for metadata parser**

File: `tests/parser/metadata.test.ts`
```typescript
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
    expect(result.value.metadata.castOn).toBe(20)
    expect(result.value.metadata.name).toBeUndefined()
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/parser/metadata.test.ts`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement metadata parser**

File: `src/parser/metadata.ts`
```typescript
import type { PatternMetadata, MetadataError } from '../domain/types.js'
import type { Result } from '../validator/result.js'
import { ok, err } from '../validator/result.js'

export function parseMetadata(
  input: string,
): Result<{ metadata: PatternMetadata | null; rest: string }, MetadataError> {
  const trimmed = input.trimStart()

  if (!trimmed.startsWith('---')) {
    return ok({ metadata: null, rest: input })
  }

  const lines = trimmed.split('\n')
  let closingIndex = -1

  for (let i = 1; i < lines.length; i++) {
    if (lines[i]!.trim() === '---') {
      closingIndex = i
      break
    }
  }

  if (closingIndex === -1) {
    return err({ message: 'Missing closing --- in metadata header', line: 1 })
  }

  const headerLines = lines.slice(1, closingIndex)
  let name: string | undefined
  let castOn: number | undefined
  let gauge: string | undefined
  let yarn: string | undefined

  for (let i = 0; i < headerLines.length; i++) {
    const line = headerLines[i]!.trim()
    if (line === '') continue

    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue

    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim()

    switch (key) {
      case 'name':
        name = value
        break
      case 'cast-on':
        castOn = parseInt(value, 10)
        if (Number.isNaN(castOn)) {
          return err({ message: `cast-on must be a number, got '${value}'`, line: i + 2 })
        }
        break
      case 'gauge':
        gauge = value
        break
      case 'yarn':
        yarn = value
        break
      // Unknown keys are silently ignored
    }
  }

  if (castOn === undefined) {
    return err({ message: 'Missing required field: cast-on', line: 1 })
  }

  const rest = lines.slice(closingIndex + 1).join('\n').trimStart()

  return ok({
    metadata: { name, castOn, gauge, yarn },
    rest,
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/parser/metadata.test.ts`
Expected: All 7 tests pass

- [ ] **Step 5: Add export to parser/index.ts**

Add to `src/parser/index.ts`:
```typescript
export { parseMetadata } from './metadata.js'
```

- [ ] **Step 6: Commit**

```bash
git add src/parser/metadata.ts src/parser/index.ts tests/parser/metadata.test.ts
git commit -m "feat: implement metadata header parser for .knit file format"
```

---

### Task 3: Lexer — New Stitch Tokens

**Files:**
- Modify: `src/parser/lexer.ts:111-165`
- Modify: `tests/parser/lexer.test.ts`

- [ ] **Step 1: Write failing tests for new tokens**

Append to `tests/parser/lexer.test.ts`:
```typescript
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
    expect(result.value).toEqual([
      { kind: 'FIXED_STITCH', stitch: 'p2tog' },
      { kind: 'EOF' },
    ])
  })

  it('tokenizes ssp', () => {
    const result = tokenize('ssp')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'FIXED_STITCH', stitch: 'ssp' },
      { kind: 'EOF' },
    ])
  })

  it('tokenizes sk2p', () => {
    const result = tokenize('sk2p')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'FIXED_STITCH', stitch: 'sk2p' },
      { kind: 'EOF' },
    ])
  })

  it('tokenizes bo with count', () => {
    const result = tokenize('bo5')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'STITCH', stitch: 'bo', count: 5 },
      { kind: 'EOF' },
    ])
  })

  it('tokenizes bare bo as count 1', () => {
    const result = tokenize('bo')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'STITCH', stitch: 'bo', count: 1 },
      { kind: 'EOF' },
    ])
  })

  it('tokenizes pu with count', () => {
    const result = tokenize('pu3')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value).toEqual([
      { kind: 'STITCH', stitch: 'pu', count: 3 },
      { kind: 'EOF' },
    ])
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/parser/lexer.test.ts`
Expected: FAIL — new tokens not recognized

- [ ] **Step 3: Add new token patterns to lexer**

In `src/parser/lexer.ts`, add the following checks in the correct priority order. Insert these BEFORE the existing `sl`, `k`, `p` checks (before line 140):

```typescript
    // New fixed stitches — must check before sl/k/p
    // p2tog — before p
    if (input.slice(pos).startsWith('p2tog')) {
      tokens.push({ kind: 'FIXED_STITCH', stitch: 'p2tog' })
      pos += 5
      continue
    }

    // sk2p — before sl/ssk
    if (input.slice(pos).startsWith('sk2p')) {
      tokens.push({ kind: 'FIXED_STITCH', stitch: 'sk2p' })
      pos += 4
      continue
    }

    // ssp — before sl (safe alongside ssk, different 3rd char)
    if (input.slice(pos).startsWith('ssp')) {
      tokens.push({ kind: 'FIXED_STITCH', stitch: 'ssp' })
      pos += 3
      continue
    }

    // m1l, m1r
    if (input.slice(pos).startsWith('m1l')) {
      tokens.push({ kind: 'FIXED_STITCH', stitch: 'm1l' })
      pos += 3
      continue
    }
    if (input.slice(pos).startsWith('m1r')) {
      tokens.push({ kind: 'FIXED_STITCH', stitch: 'm1r' })
      pos += 3
      continue
    }

    // pu (pick-up) with optional count — before p
    const puMatch = input.slice(pos).match(/^pu(\d*)/)
    if (puMatch) {
      const count = puMatch[1] ? parseInt(puMatch[1], 10) : 1
      tokens.push({ kind: 'STITCH', stitch: 'pu', count })
      pos += puMatch[0].length
      continue
    }

    // bo (bind-off) with optional count
    const boMatch = input.slice(pos).match(/^bo(\d*)/)
    if (boMatch) {
      const count = boMatch[1] ? parseInt(boMatch[1], 10) : 1
      tokens.push({ kind: 'STITCH', stitch: 'bo', count })
      pos += boMatch[0].length
      continue
    }
```

The full priority order in the lexer should be:
1. k2tog, kfb (existing — before k)
2. ssk (existing — before sl)
3. yo (existing)
4. **p2tog** (new — before p)
5. **sk2p** (new — before sl/ssk)
6. **ssp** (new — before sl)
7. **m1l, m1r** (new — no conflict)
8. **pu** (new — before p)
9. **bo** (new — no conflict)
10. sl, k, p (existing)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/parser/lexer.test.ts`
Expected: All tests pass (9 old + 9 new = 18)

- [ ] **Step 5: Commit**

```bash
git add src/parser/lexer.ts tests/parser/lexer.test.ts
git commit -m "feat: add lexer tokens for new stitch types (m1l, m1r, p2tog, ssp, sk2p, bo, pu)"
```

---

### Task 4: Parser — New Stitch Mapping + Metadata Integration

**Files:**
- Modify: `src/parser/parser.ts:29-51` (mapStitchKind, mapFixedStitch)
- Modify: `src/parser/parser.ts:161-181` (parseBlock, parse)
- Modify: `tests/parser/parser.test.ts`

- [ ] **Step 1: Write failing tests for new stitches and metadata**

Append to `tests/parser/parser.test.ts`:
```typescript
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
    expect(result.value.kind).toBe('block')
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/parser/parser.test.ts`
Expected: FAIL — new stitch kinds not mapped

- [ ] **Step 3: Extend mapStitchKind in parser.ts**

Update `mapStitchKind` to handle `'bo'` and `'pu'`:
```typescript
function mapStitchKind(stitch: 'k' | 'p' | 'sl' | 'bo' | 'pu'): Stitch {
  switch (stitch) {
    case 'k':
      return { kind: 'knit' }
    case 'p':
      return { kind: 'purl' }
    case 'sl':
      return { kind: 'slip' }
    case 'bo':
      return { kind: 'bind-off' }
    case 'pu':
      return { kind: 'pick-up' }
  }
}
```

- [ ] **Step 4: Extend mapFixedStitch in parser.ts**

```typescript
function mapFixedStitch(stitch: 'yo' | 'k2tog' | 'ssk' | 'kfb' | 'm1l' | 'm1r' | 'p2tog' | 'ssp' | 'sk2p'): Stitch {
  switch (stitch) {
    case 'yo':
      return { kind: 'yarn-over' }
    case 'k2tog':
      return { kind: 'k2tog' }
    case 'ssk':
      return { kind: 'ssk' }
    case 'kfb':
      return { kind: 'kfb' }
    case 'm1l':
      return { kind: 'm1l' }
    case 'm1r':
      return { kind: 'm1r' }
    case 'p2tog':
      return { kind: 'p2tog' }
    case 'ssp':
      return { kind: 'ssp' }
    case 'sk2p':
      return { kind: 'sk2p' }
  }
}
```

- [ ] **Step 5: Integrate metadata parser into parse()**

Update the `parse` function and `parseBlock` in `src/parser/parser.ts`:

```typescript
import { parseMetadata } from './metadata.js'

// ... existing code ...

export function parse(input: string): Result<Pattern, ParseError> {
  // Try metadata header first
  const metaResult = parseMetadata(input)
  if (!metaResult.ok) {
    return err({ message: metaResult.error.message })
  }

  const { metadata, rest } = metaResult.value

  const tokenizeResult = tokenize(rest)
  if (!tokenizeResult.ok) {
    return err({ message: tokenizeResult.error.message })
  }

  const stream: TokenStream = { tokens: tokenizeResult.value, pos: 0 }
  const blockResult = parseBlock(stream)
  if (!blockResult.ok) return blockResult

  // Apply metadata to block
  if (metadata && blockResult.value.kind === 'block') {
    return ok({
      ...blockResult.value,
      castOn: metadata.castOn,
      metadata,
    })
  }

  return blockResult
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/parser/parser.test.ts`
Expected: All tests pass (8 old + 7 new = 15)

- [ ] **Step 7: Commit**

```bash
git add src/parser/parser.ts tests/parser/parser.test.ts
git commit -m "feat: integrate metadata parser and map new stitch types in parser"
```

---

### Task 5: Error Message Formatter

**Files:**
- Create: `src/validator/format.ts`
- Create: `tests/validator/format.test.ts`
- Modify: `src/validator/index.ts`

- [ ] **Step 1: Write failing tests for formatter**

File: `tests/validator/format.test.ts`
```typescript
import { describe, it, expect } from 'vitest'
import {
  formatValidationError,
  formatValidationErrors,
  formatParseError,
  formatLexerError,
  formatMetadataError,
} from '../../src/validator/format.js'
import type { ValidationError, ParseError, LexerError, MetadataError } from '../../src/domain/types.js'

describe('formatValidationError', () => {
  it('formats insufficient-stitches in Korean', () => {
    const error: ValidationError = {
      kind: 'insufficient-stitches',
      needed: 2,
      available: 1,
      location: { row: 1, position: 3 },
    }
    expect(formatValidationError(error, 'ko')).toBe(
      '1단 3번째 위치: 2코가 필요하지만 1코만 남아있습니다'
    )
  })

  it('formats insufficient-stitches in English', () => {
    const error: ValidationError = {
      kind: 'insufficient-stitches',
      needed: 2,
      available: 1,
      location: { row: 1, position: 3 },
    }
    expect(formatValidationError(error, 'en')).toBe(
      'Row 1, position 3: needs 2 stitches but only 1 available'
    )
  })

  it('formats count-mismatch in Korean', () => {
    const error: ValidationError = {
      kind: 'count-mismatch',
      expected: 20,
      actual: 18,
      row: 1,
    }
    expect(formatValidationError(error, 'ko')).toBe(
      '1단: 20코를 예상했지만 18코입니다'
    )
  })

  it('formats count-mismatch in English', () => {
    const error: ValidationError = {
      kind: 'count-mismatch',
      expected: 20,
      actual: 18,
      row: 1,
    }
    expect(formatValidationError(error, 'en')).toBe(
      'Row 1: expected 20 stitches but got 18'
    )
  })

  it('formats unbalanced-shaping in Korean', () => {
    const error: ValidationError = {
      kind: 'unbalanced-shaping',
      delta: 2,
      row: 3,
    }
    expect(formatValidationError(error, 'ko')).toBe(
      '3단: 코 수가 2만큼 변합니다 (증감 불균형)'
    )
  })

  it('formats unbalanced-shaping in English', () => {
    const error: ValidationError = {
      kind: 'unbalanced-shaping',
      delta: 2,
      row: 3,
    }
    expect(formatValidationError(error, 'en')).toBe(
      'Row 3: stitch count changes by 2 (unbalanced shaping)'
    )
  })
})

describe('formatValidationErrors', () => {
  it('joins multiple errors with newlines', () => {
    const errors: ValidationError[] = [
      { kind: 'insufficient-stitches', needed: 2, available: 1, location: { row: 1, position: 0 } },
      { kind: 'count-mismatch', expected: 10, actual: 8, row: 2 },
    ]
    const result = formatValidationErrors(errors, 'en')
    expect(result).toBe(
      'Row 1, position 0: needs 2 stitches but only 1 available\nRow 2: expected 10 stitches but got 8'
    )
  })
})

describe('formatLexerError', () => {
  it('formats in Korean', () => {
    const error: LexerError = { message: "Unexpected character '@'", position: 5, line: 1 }
    expect(formatLexerError(error, 'ko')).toBe("1번째 줄, 위치 5: Unexpected character '@'")
  })

  it('formats in English', () => {
    const error: LexerError = { message: "Unexpected character '@'", position: 5, line: 1 }
    expect(formatLexerError(error, 'en')).toBe("Line 1, position 5: Unexpected character '@'")
  })
})

describe('formatParseError', () => {
  it('formats in Korean', () => {
    const error: ParseError = { message: 'Expected ROW but got EOF' }
    expect(formatParseError(error, 'ko')).toBe('파싱 오류: Expected ROW but got EOF')
  })

  it('formats in English', () => {
    const error: ParseError = { message: 'Expected ROW but got EOF' }
    expect(formatParseError(error, 'en')).toBe('Parse error: Expected ROW but got EOF')
  })
})

describe('formatMetadataError', () => {
  it('formats in Korean', () => {
    const error: MetadataError = { message: 'Missing required field: cast-on', line: 1 }
    expect(formatMetadataError(error, 'ko')).toBe('메타데이터 1번째 줄: Missing required field: cast-on')
  })

  it('formats in English', () => {
    const error: MetadataError = { message: 'Missing required field: cast-on', line: 1 }
    expect(formatMetadataError(error, 'en')).toBe('Metadata line 1: Missing required field: cast-on')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/validator/format.test.ts`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement formatter**

File: `src/validator/format.ts`
```typescript
import type { ValidationError, LexerError, ParseError, MetadataError } from '../domain/types.js'

type Locale = 'ko' | 'en'

export function formatValidationError(error: ValidationError, locale: Locale): string {
  switch (error.kind) {
    case 'insufficient-stitches':
      return locale === 'ko'
        ? `${error.location.row}단 ${error.location.position}번째 위치: ${error.needed}코가 필요하지만 ${error.available}코만 남아있습니다`
        : `Row ${error.location.row}, position ${error.location.position}: needs ${error.needed} stitches but only ${error.available} available`

    case 'count-mismatch':
      return locale === 'ko'
        ? `${error.row}단: ${error.expected}코를 예상했지만 ${error.actual}코입니다`
        : `Row ${error.row}: expected ${error.expected} stitches but got ${error.actual}`

    case 'unbalanced-shaping':
      return locale === 'ko'
        ? `${error.row}단: 코 수가 ${error.delta}만큼 변합니다 (증감 불균형)`
        : `Row ${error.row}: stitch count changes by ${error.delta} (unbalanced shaping)`
  }
}

export function formatValidationErrors(errors: ValidationError[], locale: Locale): string {
  return errors.map((e) => formatValidationError(e, locale)).join('\n')
}

export function formatLexerError(error: LexerError, locale: Locale): string {
  return locale === 'ko'
    ? `${error.line}번째 줄, 위치 ${error.position}: ${error.message}`
    : `Line ${error.line}, position ${error.position}: ${error.message}`
}

export function formatParseError(error: ParseError, locale: Locale): string {
  return locale === 'ko'
    ? `파싱 오류: ${error.message}`
    : `Parse error: ${error.message}`
}

export function formatMetadataError(error: MetadataError, locale: Locale): string {
  return locale === 'ko'
    ? `메타데이터 ${error.line}번째 줄: ${error.message}`
    : `Metadata line ${error.line}: ${error.message}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/validator/format.test.ts`
Expected: All 12 tests pass

- [ ] **Step 5: Update validator/index.ts**

Add to `src/validator/index.ts`:
```typescript
export {
  formatValidationError,
  formatValidationErrors,
  formatLexerError,
  formatParseError,
  formatMetadataError,
} from './format.js'
```

- [ ] **Step 6: Commit**

```bash
git add src/validator/format.ts src/validator/index.ts tests/validator/format.test.ts
git commit -m "feat: implement error message formatter with Korean and English locales"
```

---

### Task 6: Renderers — New Stitch Support

**Files:**
- Modify: `src/renderer/text.ts:5-29`
- Modify: `src/renderer/svg.ts:49-96`
- Modify: `src/renderer/stats.ts:9-11`
- Modify: `tests/renderer/text.test.ts`
- Modify: `tests/renderer/svg.test.ts`

- [ ] **Step 1: Write failing tests for new stitch rendering**

Append to `tests/renderer/text.test.ts`:
```typescript
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
```

Append to `tests/renderer/svg.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/renderer/text.test.ts tests/renderer/svg.test.ts`
Expected: FAIL — switch not exhaustive or returning undefined

- [ ] **Step 3: Update text renderer**

Add new cases to `stitchNameKo` and `stitchAbbrEn` in `src/renderer/text.ts`:

In `stitchNameKo`, add before the closing `}`:
```typescript
    case 'm1l': return '왼쪽 늘리기'
    case 'm1r': return '오른쪽 늘리기'
    case 'p2tog': return '안뜨기 오른코 줄이기'
    case 'ssp': return '안뜨기 왼코 줄이기'
    case 'sk2p': return '중앙 줄이기'
    case 'bind-off': return '코 마무리'
    case 'pick-up': return '코 줍기'
```

In `stitchAbbrEn`, add before the closing `}`:
```typescript
    case 'm1l': return 'm1l'
    case 'm1r': return 'm1r'
    case 'p2tog': return 'p2tog'
    case 'ssp': return 'ssp'
    case 'sk2p': return 'sk2p'
    case 'bind-off': return 'bo'
    case 'pick-up': return 'pu'
```

- [ ] **Step 4: Update SVG renderer**

Add new cases to `renderCell` in `src/renderer/svg.ts`, before the closing `}` of the switch:

```typescript
    case 'm1l':
      // Left arrow
      return bg + `<path d="M${x + s - pad},${y + pad} L${x + pad},${cy} L${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`

    case 'm1r':
      // Right arrow
      return bg + `<path d="M${x + pad},${y + pad} L${x + s - pad},${cy} L${x + pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`

    case 'p2tog':
      // Dot + right-leaning line
      return bg + `<circle cx="${cx}" cy="${cy}" r="2" fill="#333"/>` +
        `<line x1="${x + pad}" y1="${y + s - pad}" x2="${x + s - pad}" y2="${y + pad}" stroke="#333" stroke-width="1"/>`

    case 'ssp':
      // Dot + left-leaning line
      return bg + `<circle cx="${cx}" cy="${cy}" r="2" fill="#333"/>` +
        `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1"/>`

    case 'sk2p':
      // Downward arrow
      return bg + `<path d="M${x + pad},${y + pad} L${cx},${y + s - pad} L${x + s - pad},${y + pad}" fill="none" stroke="#333" stroke-width="1.5"/>` +
        `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`

    case 'bind-off':
      // X mark
      return bg + `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>` +
        `<line x1="${x + s - pad}" y1="${y + pad}" x2="${x + pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`

    case 'pick-up':
      // Upward arrow
      return bg + `<path d="M${x + pad},${y + s - pad} L${cx},${y + pad} L${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
```

- [ ] **Step 5: Update stats renderer**

In `src/renderer/stats.ts`, update `ALL_STITCH_KINDS` array:
```typescript
const ALL_STITCH_KINDS: StitchKind[] = [
  'knit', 'purl', 'yarn-over', 'k2tog', 'ssk', 'kfb', 'slip', 'cable',
  'm1l', 'm1r', 'p2tog', 'ssp', 'sk2p', 'bind-off', 'pick-up',
]
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run`
Expected: ALL tests pass

- [ ] **Step 7: Commit**

```bash
git add src/renderer/text.ts src/renderer/svg.ts src/renderer/stats.ts tests/renderer/text.test.ts tests/renderer/svg.test.ts
git commit -m "feat: add new stitch rendering support (text, SVG, stats)"
```

---

### Task 7: Public API + Integration Tests

**Files:**
- Modify: `src/domain/index.ts`
- Modify: `src/index.ts`
- Modify: `tests/integration.test.ts`

- [ ] **Step 1: Write integration tests with metadata**

Append to `tests/integration.test.ts`:
```typescript
describe('metadata + validate integration', () => {
  it('parses and validates pattern with metadata header', () => {
    const input = `---
cast-on: 20
---
Row 1 (RS): *k2, p2* x5
Row 2 (WS): *p2, k2* x5`

    const parseResult = parse(input)
    expect(parseResult.ok).toBe(true)
    if (!parseResult.ok) return
    if (parseResult.value.kind !== 'block') return
    expect(parseResult.value.castOn).toBe(20)

    const validResult = validateBlock(parseResult.value as Pattern & { kind: 'block' })
    expect(validResult.ok).toBe(true)
  })

  it('validates new stitch types correctly', () => {
    const input = `---
cast-on: 6
---
Row 1 (RS): k1, m1l, k2, m1r, k1`

    const parseResult = parse(input)
    expect(parseResult.ok).toBe(true)
    if (!parseResult.ok) return
    if (parseResult.value.kind !== 'block') return

    const validResult = validateBlock(parseResult.value as Pattern & { kind: 'block' })
    expect(validResult.ok).toBe(true)
  })

  it('sk2p correctly consumes 3 stitches', () => {
    const input = `---
cast-on: 5
---
Row 1 (RS): k1, sk2p, k1`

    const parseResult = parse(input)
    expect(parseResult.ok).toBe(true)
    if (!parseResult.ok) return
    if (parseResult.value.kind !== 'block') return

    const validResult = validateBlock(parseResult.value as Pattern & { kind: 'block' })
    expect(validResult.ok).toBe(true)
  })

  it('bind-off reduces count correctly', () => {
    const input = `---
cast-on: 10
---
Row 1 (RS): bo10`

    const parseResult = parse(input)
    expect(parseResult.ok).toBe(true)
    if (!parseResult.ok) return
    if (parseResult.value.kind !== 'block') return

    const validResult = validateBlock(parseResult.value as Pattern & { kind: 'block' })
    expect(validResult.ok).toBe(true)
  })
})
```

- [ ] **Step 2: Update domain/index.ts**

Add new type exports to `src/domain/index.ts`:
```typescript
export type {
  StitchKind,
  Stitch,
  Pattern,
  StitchSignature,
  ValidationError,
  Token,
  LexerError,
  ParseError,
  PatternMetadata,
  MetadataError,
} from './types.js'
```

- [ ] **Step 3: Update src/index.ts**

Add new exports to `src/index.ts`:
```typescript
export type {
  StitchKind,
  Stitch,
  Pattern,
  StitchSignature,
  ValidationError,
  Token,
  LexerError,
  ParseError,
  PatternMetadata,
  MetadataError,
} from './domain/index.js'
```

Add formatter and metadata exports:
```typescript
export { parseMetadata } from './parser/index.js'
export {
  formatValidationError,
  formatValidationErrors,
  formatLexerError,
  formatParseError,
  formatMetadataError,
} from './validator/index.js'
```

- [ ] **Step 4: Run full test suite + type check**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All tests pass, no TypeScript errors

- [ ] **Step 5: Commit**

```bash
git add src/domain/index.ts src/index.ts tests/integration.test.ts
git commit -m "feat: wire up public API for Phase 1 and add integration tests"
```

---

### Task 8: Update Demo Script

**Files:**
- Modify: `demo.ts`

- [ ] **Step 1: Update demo to use metadata header**

Replace `demo.ts` to showcase the new features: metadata header, new stitches, error formatting. The demo should:
- Parse a pattern with `---` metadata header (no manual castOn patching)
- Include new stitch types (m1l, m1r, p2tog, bo)
- Use `formatValidationErrors` for error output
- Show both valid and invalid pattern results

- [ ] **Step 2: Run demo**

Run: `npx tsx demo.ts`
Expected: Clean output showing all features

- [ ] **Step 3: Commit**

```bash
git add demo.ts
git commit -m "chore: update demo script with Phase 1 features"
```

---

## Summary

| Task | Component | New Tests | Steps |
|------|-----------|-----------|-------|
| 1 | Domain types + signatures | 7 | 10 |
| 2 | Metadata header parser | 7 | 6 |
| 3 | Lexer — new tokens | 9 | 5 |
| 4 | Parser — new stitches + metadata | 7 | 7 |
| 5 | Error message formatter | 12 | 6 |
| 6 | Renderers — new stitches | 4 | 7 |
| 7 | Public API + integration tests | 4 | 5 |
| 8 | Update demo | — | 3 |
| **Total** | | **50** | **49** |
