# Renderer Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract SVG symbol rendering into a data-driven style system (standard/JIS), and add a prose text rendering style, so one pattern can render to 3 chart styles and 2 text styles.

**Architecture:** Symbol rendering is extracted from the monolithic `renderCell` into `SymbolSet` records — one per chart style. The SVG grid engine (`renderSvg`) delegates to the active `SymbolSet`. Text rendering gains a `style` parameter ('short' | 'prose') with prose providing natural-language output.

**Tech Stack:** TypeScript (strict), Vitest, no new dependencies

---

## File Structure

```
src/renderer/
  symbols/
    types.ts          — CREATE: SymbolRenderer type, SymbolSet type
    standard.ts       — CREATE: CYC standard symbol set
    jis.ts            — CREATE: JIS symbol set
    index.ts          — CREATE: getSymbolSet(style) lookup
  svg.ts              — MODIFY: extract renderCell → SymbolSet delegation, add style param
  text.ts             — MODIFY: add prose style, style param
  index.ts            — MODIFY: re-export ChartStyle, TextStyle
tests/renderer/
  symbols/
    standard.test.ts  — CREATE: standard symbol tests
    jis.test.ts       — CREATE: JIS symbol tests
  svg.test.ts         — MODIFY: add style-specific tests
  text.test.ts        — MODIFY: add prose tests
src/index.ts          — MODIFY: export new types
```

---

### Task 1: Symbol Types

**Files:**
- Create: `src/renderer/symbols/types.ts`

- [ ] **Step 1: Create symbol type definitions**

File: `src/renderer/symbols/types.ts`
```typescript
import type { Stitch, StitchKind } from '../../domain/types.js'

export type SymbolRenderer = (stitch: Stitch, x: number, y: number, size: number) => string

export type SymbolSet = Record<StitchKind, SymbolRenderer>

export type ChartStyle = 'standard' | 'jis'
```

- [ ] **Step 2: Commit**

```bash
git add src/renderer/symbols/types.ts
git commit -m "feat: define SymbolRenderer and SymbolSet types for chart styles"
```

---

### Task 2: Standard Symbol Set

**Files:**
- Create: `src/renderer/symbols/standard.ts`
- Create: `tests/renderer/symbols/standard.test.ts`

- [ ] **Step 1: Write failing tests**

File: `tests/renderer/symbols/standard.test.ts`
```typescript
import { describe, it, expect } from 'vitest'
import { standardSymbols } from '../../../src/renderer/symbols/standard.js'
import type { Stitch } from '../../../src/domain/types.js'

describe('standardSymbols', () => {
  const x = 0
  const y = 0
  const size = 16

  it('renders knit as empty rect', () => {
    const stitch: Stitch = { kind: 'knit' }
    const svg = standardSymbols.knit(stitch, x, y, size)
    expect(svg).toContain('<rect')
    expect(svg).not.toContain('<circle')
    expect(svg).not.toContain('<line')
  })

  it('renders purl with filled circle', () => {
    const stitch: Stitch = { kind: 'purl' }
    const svg = standardSymbols.purl(stitch, x, y, size)
    expect(svg).toContain('<rect')
    expect(svg).toContain('<circle')
    expect(svg).toContain('fill="#333"')
  })

  it('renders yarn-over with open circle', () => {
    const stitch: Stitch = { kind: 'yarn-over' }
    const svg = standardSymbols['yarn-over'](stitch, x, y, size)
    expect(svg).toContain('<circle')
    expect(svg).toContain('fill="none"')
  })

  it('renders k2tog with right-leaning line', () => {
    const stitch: Stitch = { kind: 'k2tog' }
    const svg = standardSymbols.k2tog(stitch, x, y, size)
    expect(svg).toContain('<line')
  })

  it('renders cable with direction-dependent curves', () => {
    const front: Stitch = { kind: 'cable', count: 4, direction: 'front' }
    const back: Stitch = { kind: 'cable', count: 4, direction: 'back' }
    const svgFront = standardSymbols.cable(front, x, y, size)
    const svgBack = standardSymbols.cable(back, x, y, size)
    expect(svgFront).toContain('<path')
    expect(svgBack).toContain('<path')
    expect(svgFront).not.toBe(svgBack)
  })

  it('renders bind-off with X cross', () => {
    const stitch: Stitch = { kind: 'bind-off' }
    const svg = standardSymbols['bind-off'](stitch, x, y, size)
    const lineCount = (svg.match(/<line/g) ?? []).length
    expect(lineCount).toBe(2)
  })

  it('has a renderer for every StitchKind', () => {
    const kinds = [
      'knit', 'purl', 'yarn-over', 'k2tog', 'ssk', 'kfb', 'slip', 'cable',
      'm1l', 'm1r', 'p2tog', 'ssp', 'sk2p', 'bind-off', 'pick-up',
    ] as const
    for (const kind of kinds) {
      expect(typeof standardSymbols[kind]).toBe('function')
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/renderer/symbols/standard.test.ts`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement standard symbol set**

File: `src/renderer/symbols/standard.ts`

Extract the existing `renderCell` logic from `src/renderer/svg.ts` (lines 40-121) into individual symbol functions. Each function takes `(stitch, x, y, size)` and returns SVG element string including the background rect.

```typescript
import type { Stitch } from '../../domain/types.js'
import type { SymbolSet } from './types.js'

function bg(x: number, y: number, s: number): string {
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="white" stroke="#999" stroke-width="0.5"/>`
}

export const standardSymbols: SymbolSet = {
  knit(_stitch, x, y, s) {
    return bg(x, y, s)
  },

  purl(_stitch, x, y, s) {
    const cx = x + s / 2
    const cy = y + s / 2
    return bg(x, y, s) + `<circle cx="${cx}" cy="${cy}" r="${s / 5}" fill="#333"/>`
  },

  'yarn-over'(_stitch, x, y, s) {
    const cx = x + s / 2
    const cy = y + s / 2
    return bg(x, y, s) + `<circle cx="${cx}" cy="${cy}" r="${s / 4}" fill="none" stroke="#333" stroke-width="1"/>`
  },

  k2tog(_stitch, x, y, s) {
    const pad = 3
    return bg(x, y, s) + `<line x1="${x + pad}" y1="${y + s - pad}" x2="${x + s - pad}" y2="${y + pad}" stroke="#333" stroke-width="1.5"/>`
  },

  ssk(_stitch, x, y, s) {
    const pad = 3
    return bg(x, y, s) + `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`
  },

  kfb(_stitch, x, y, s) {
    const pad = 3
    const mid = x + s / 2
    return bg(x, y, s) +
      `<polyline points="${x + pad},${y + pad} ${mid},${y + s - pad} ${x + s - pad},${y + pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },

  slip(_stitch, x, y, s) {
    const pad = 3
    const cy = y + s / 2
    return bg(x, y, s) + `<line x1="${x + pad}" y1="${cy}" x2="${x + s - pad}" y2="${cy}" stroke="#333" stroke-width="1.5"/>`
  },

  cable(stitch, x, y, s) {
    const cx = x + s / 2
    const cy = y + s / 2
    const pad = 3
    const ctrl1x = cx - s / 4
    const ctrl2x = cx + s / 4
    const direction = stitch.kind === 'cable' ? stitch.direction : 'front'
    if (direction === 'front') {
      return bg(x, y, s) +
        `<path d="M${x + pad},${y + pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>` +
        `<path d="M${x + pad},${y + s - pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
    }
    return bg(x, y, s) +
      `<path d="M${x + pad},${y + s - pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + pad}" fill="none" stroke="#333" stroke-width="1.5"/>` +
      `<path d="M${x + pad},${y + pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },

  m1l(_stitch, x, y, s) {
    const pad = 3
    const cy = y + s / 2
    return bg(x, y, s) + `<path d="M${x + s - pad},${y + pad} L${x + pad},${cy} L${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },

  m1r(_stitch, x, y, s) {
    const pad = 3
    const cy = y + s / 2
    return bg(x, y, s) + `<path d="M${x + pad},${y + pad} L${x + s - pad},${cy} L${x + pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },

  p2tog(_stitch, x, y, s) {
    const pad = 3
    const cx = x + s / 2
    const cy = y + s / 2
    return bg(x, y, s) + `<circle cx="${cx}" cy="${cy}" r="2" fill="#333"/>` +
      `<line x1="${x + pad}" y1="${y + s - pad}" x2="${x + s - pad}" y2="${y + pad}" stroke="#333" stroke-width="1"/>`
  },

  ssp(_stitch, x, y, s) {
    const pad = 3
    const cx = x + s / 2
    const cy = y + s / 2
    return bg(x, y, s) + `<circle cx="${cx}" cy="${cy}" r="2" fill="#333"/>` +
      `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1"/>`
  },

  sk2p(_stitch, x, y, s) {
    const pad = 3
    const cx = x + s / 2
    const cy = y + s / 2
    return bg(x, y, s) +
      `<path d="M${x + pad},${y + pad} L${cx},${y + s - pad} L${x + s - pad},${y + pad}" fill="none" stroke="#333" stroke-width="1.5"/>` +
      `<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`
  },

  'bind-off'(_stitch, x, y, s) {
    const pad = 3
    return bg(x, y, s) +
      `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>` +
      `<line x1="${x + s - pad}" y1="${y + pad}" x2="${x + pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`
  },

  'pick-up'(_stitch, x, y, s) {
    const pad = 3
    const cx = x + s / 2
    return bg(x, y, s) + `<path d="M${x + pad},${y + s - pad} L${cx},${y + pad} L${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/renderer/symbols/standard.test.ts`
Expected: All 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/renderer/symbols/standard.ts tests/renderer/symbols/standard.test.ts
git commit -m "feat: implement standard (CYC) symbol set for SVG charts"
```

---

### Task 3: JIS Symbol Set

**Files:**
- Create: `src/renderer/symbols/jis.ts`
- Create: `tests/renderer/symbols/jis.test.ts`

- [ ] **Step 1: Write failing tests**

File: `tests/renderer/symbols/jis.test.ts`
```typescript
import { describe, it, expect } from 'vitest'
import { jisSymbols } from '../../../src/renderer/symbols/jis.js'
import type { Stitch } from '../../../src/domain/types.js'

describe('jisSymbols', () => {
  const x = 0
  const y = 0
  const size = 16

  it('renders knit as vertical line (not empty rect)', () => {
    const stitch: Stitch = { kind: 'knit' }
    const svg = jisSymbols.knit(stitch, x, y, size)
    expect(svg).toContain('<rect')
    expect(svg).toContain('<line')
  })

  it('renders purl as horizontal line', () => {
    const stitch: Stitch = { kind: 'purl' }
    const svg = jisSymbols.purl(stitch, x, y, size)
    expect(svg).toContain('<line')
  })

  it('renders yarn-over as open circle (same as standard)', () => {
    const stitch: Stitch = { kind: 'yarn-over' }
    const svg = jisSymbols['yarn-over'](stitch, x, y, size)
    expect(svg).toContain('<circle')
    expect(svg).toContain('fill="none"')
  })

  it('renders p2tog with dot (distinguishes from k2tog)', () => {
    const k2togSvg = jisSymbols.k2tog({ kind: 'k2tog' }, x, y, size)
    const p2togSvg = jisSymbols.p2tog({ kind: 'p2tog' }, x, y, size)
    expect(p2togSvg).toContain('<circle')
    expect(k2togSvg).not.toContain('<circle')
  })

  it('has a renderer for every StitchKind', () => {
    const kinds = [
      'knit', 'purl', 'yarn-over', 'k2tog', 'ssk', 'kfb', 'slip', 'cable',
      'm1l', 'm1r', 'p2tog', 'ssp', 'sk2p', 'bind-off', 'pick-up',
    ] as const
    for (const kind of kinds) {
      expect(typeof jisSymbols[kind]).toBe('function')
    }
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/renderer/symbols/jis.test.ts`
Expected: FAIL — cannot resolve module

- [ ] **Step 3: Implement JIS symbol set**

File: `src/renderer/symbols/jis.ts`

Key differences from standard:
- knit = vertical line (│), not empty rect
- purl = horizontal line (—), not dot
- slip = right arrow (→)
- p2tog/ssp = dot + diagonal (distinguishes from k2tog/ssk)

```typescript
import type { Stitch } from '../../domain/types.js'
import type { SymbolSet } from './types.js'

function bg(x: number, y: number, s: number): string {
  return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="white" stroke="#999" stroke-width="0.5"/>`
}

export const jisSymbols: SymbolSet = {
  knit(_stitch, x, y, s) {
    const cx = x + s / 2
    const pad = 3
    return bg(x, y, s) + `<line x1="${cx}" y1="${y + pad}" x2="${cx}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`
  },

  purl(_stitch, x, y, s) {
    const cy = y + s / 2
    const pad = 3
    return bg(x, y, s) + `<line x1="${x + pad}" y1="${cy}" x2="${x + s - pad}" y2="${cy}" stroke="#333" stroke-width="1.5"/>`
  },

  'yarn-over'(_stitch, x, y, s) {
    const cx = x + s / 2
    const cy = y + s / 2
    return bg(x, y, s) + `<circle cx="${cx}" cy="${cy}" r="${s / 4}" fill="none" stroke="#333" stroke-width="1"/>`
  },

  k2tog(_stitch, x, y, s) {
    const pad = 3
    return bg(x, y, s) + `<line x1="${x + pad}" y1="${y + s - pad}" x2="${x + s - pad}" y2="${y + pad}" stroke="#333" stroke-width="1.5"/>`
  },

  ssk(_stitch, x, y, s) {
    const pad = 3
    return bg(x, y, s) + `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`
  },

  kfb(_stitch, x, y, s) {
    const pad = 3
    const mid = x + s / 2
    return bg(x, y, s) +
      `<polyline points="${x + pad},${y + pad} ${mid},${y + s - pad} ${x + s - pad},${y + pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },

  slip(_stitch, x, y, s) {
    const pad = 3
    const cy = y + s / 2
    const cx = x + s / 2
    return bg(x, y, s) +
      `<line x1="${x + pad}" y1="${cy}" x2="${x + s - pad - 2}" y2="${cy}" stroke="#333" stroke-width="1.5"/>` +
      `<path d="M${x + s - pad - 2},${cy - 3} L${x + s - pad},${cy} L${x + s - pad - 2},${cy + 3}" fill="none" stroke="#333" stroke-width="1"/>`
  },

  cable(stitch, x, y, s) {
    const cx = x + s / 2
    const cy = y + s / 2
    const pad = 3
    const ctrl1x = cx - s / 4
    const ctrl2x = cx + s / 4
    const direction = stitch.kind === 'cable' ? stitch.direction : 'front'
    if (direction === 'front') {
      return bg(x, y, s) +
        `<path d="M${x + pad},${y + pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>` +
        `<path d="M${x + pad},${y + s - pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
    }
    return bg(x, y, s) +
      `<path d="M${x + pad},${y + s - pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + pad}" fill="none" stroke="#333" stroke-width="1.5"/>` +
      `<path d="M${x + pad},${y + pad} C${ctrl1x},${cy} ${ctrl2x},${cy} ${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },

  // JIS convention: m1l and m1r use the same ∧ symbol (intentional, confirmed in design review)
  m1l(_stitch, x, y, s) {
    const pad = 3
    const cx = x + s / 2
    return bg(x, y, s) +
      `<path d="M${x + pad},${y + s - pad} L${cx},${y + pad} L${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },

  m1r(_stitch, x, y, s) {
    const pad = 3
    const cx = x + s / 2
    return bg(x, y, s) +
      `<path d="M${x + pad},${y + s - pad} L${cx},${y + pad} L${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },

  p2tog(_stitch, x, y, s) {
    const pad = 3
    const cx = x + s / 2
    const cy = y + s / 2
    return bg(x, y, s) + `<circle cx="${cx}" cy="${cy}" r="2" fill="#333"/>` +
      `<line x1="${x + pad}" y1="${y + s - pad}" x2="${x + s - pad}" y2="${y + pad}" stroke="#333" stroke-width="1"/>`
  },

  ssp(_stitch, x, y, s) {
    const pad = 3
    const cx = x + s / 2
    const cy = y + s / 2
    return bg(x, y, s) + `<circle cx="${cx}" cy="${cy}" r="2" fill="#333"/>` +
      `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1"/>`
  },

  sk2p(_stitch, x, y, s) {
    const pad = 3
    const cx = x + s / 2
    return bg(x, y, s) +
      `<path d="M${x + pad},${y + pad} L${cx},${y + s - pad} L${x + s - pad},${y + pad}" fill="none" stroke="#333" stroke-width="1.5"/>` +
      `<line x1="${cx}" y1="${y + s / 2}" x2="${cx}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`
  },

  'bind-off'(_stitch, x, y, s) {
    const pad = 3
    return bg(x, y, s) +
      `<line x1="${x + pad}" y1="${y + pad}" x2="${x + s - pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>` +
      `<line x1="${x + s - pad}" y1="${y + pad}" x2="${x + pad}" y2="${y + s - pad}" stroke="#333" stroke-width="1.5"/>`
  },

  'pick-up'(_stitch, x, y, s) {
    const pad = 3
    const cx = x + s / 2
    return bg(x, y, s) + `<path d="M${x + pad},${y + s - pad} L${cx},${y + pad} L${x + s - pad},${y + s - pad}" fill="none" stroke="#333" stroke-width="1.5"/>`
  },
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/renderer/symbols/jis.test.ts`
Expected: All 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add src/renderer/symbols/jis.ts tests/renderer/symbols/jis.test.ts
git commit -m "feat: implement JIS symbol set for SVG charts"
```

---

### Task 4: Symbol Set Index + SVG Refactor

**Files:**
- Create: `src/renderer/symbols/index.ts`
- Modify: `src/renderer/svg.ts`
- Modify: `tests/renderer/svg.test.ts`

- [ ] **Step 1: Create symbol set index**

File: `src/renderer/symbols/index.ts`
```typescript
import type { SymbolSet, ChartStyle } from './types.js'
import { standardSymbols } from './standard.js'
import { jisSymbols } from './jis.js'

export type { SymbolRenderer, SymbolSet, ChartStyle } from './types.js'

const SYMBOL_SETS: Record<ChartStyle, SymbolSet> = {
  standard: standardSymbols,
  jis: jisSymbols,
}

export function getSymbolSet(style: ChartStyle): SymbolSet {
  return SYMBOL_SETS[style]
}
```

- [ ] **Step 2: Write failing tests for style parameter**

Append to `tests/renderer/svg.test.ts`:
```typescript
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
    // Standard knit = empty rect (no line), JIS knit = rect + vertical line
    expect(standard).not.toContain('<line')
    expect(jis).toContain('<line')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/renderer/svg.test.ts`
Expected: FAIL — renderSvg doesn't accept second parameter

- [ ] **Step 4: Refactor svg.ts to use SymbolSet**

Replace `src/renderer/svg.ts`. Key changes:
- Remove `renderCell` function entirely
- Import `getSymbolSet` and `ChartStyle`
- Add `style` parameter to `renderSvg` (default: `'standard'`)
- Use `symbols[stitch.kind](stitch, x, y, CELL_SIZE)` instead of `renderCell(stitch, x, y)`

```typescript
import type { Pattern, Stitch } from '../domain/types.js'
import { getSymbolSet } from './symbols/index.js'
import type { ChartStyle } from './symbols/index.js'

const CELL_SIZE = 16

function flattenPattern(pattern: Pattern): Stitch[] {
  switch (pattern.kind) {
    case 'stitch':
      return [pattern.value]
    case 'repeat': {
      const expanded: Stitch[] = []
      for (let i = 0; i < pattern.times; i++) {
        for (const p of pattern.body) {
          expanded.push(...flattenPattern(p))
        }
      }
      return expanded
    }
    case 'row': {
      const stitches: Stitch[] = []
      for (const p of pattern.stitches) {
        stitches.push(...flattenPattern(p))
      }
      return stitches
    }
    case 'block': {
      const stitches: Stitch[] = []
      for (const row of pattern.rows) {
        stitches.push(...flattenPattern(row))
      }
      return stitches
    }
  }
}

export function renderSvg(pattern: Pattern, style: ChartStyle = 'standard'): string {
  if (pattern.kind !== 'block') {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"></svg>'
  }

  const symbols = getSymbolSet(style)
  const rows = pattern.rows
  const numRows = rows.length
  const numCols = pattern.castOn

  const width = numCols * CELL_SIZE
  const height = numRows * CELL_SIZE

  const cells: string[] = []

  for (let rowIdx = 0; rowIdx < numRows; rowIdx++) {
    const rowPattern = rows[rowIdx]
    if (rowPattern === undefined) continue
    const stitches = flattenPattern(rowPattern)

    const visualRow = numRows - 1 - rowIdx
    const y = visualRow * CELL_SIZE

    for (let col = 0; col < stitches.length; col++) {
      const x = col * CELL_SIZE
      const stitch = stitches[col]
      if (stitch === undefined) continue
      cells.push(symbols[stitch.kind](stitch, x, y, CELL_SIZE))
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    cells.join('') +
    `</svg>`
  )
}
```

- [ ] **Step 5: Run all tests to verify they pass**

Run: `npx vitest run`
Expected: All tests pass (existing SVG tests still work since default is 'standard')

- [ ] **Step 6: Commit**

```bash
git add src/renderer/symbols/index.ts src/renderer/svg.ts tests/renderer/svg.test.ts
git commit -m "refactor: extract SVG symbols into style system, add jis/standard chart styles"
```

---

### Task 5: Prose Text Style

**Files:**
- Modify: `src/renderer/text.ts`
- Modify: `tests/renderer/text.test.ts`

- [ ] **Step 1: Write failing tests for prose style**

Append to `tests/renderer/text.test.ts`:
```typescript
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/renderer/text.test.ts`
Expected: FAIL — renderText doesn't accept third parameter

- [ ] **Step 3: Implement prose style**

Modify `src/renderer/text.ts`:

1. Add `TextStyle` type and update `renderText` signature
2. Add `renderPatternProse` function
3. Keep existing `renderPattern` for 'short' style

Key additions:

```typescript
export type TextStyle = 'short' | 'prose'

// Prose stitch names (full, for natural language)
function stitchNameProseKo(stitch: Stitch): string {
  // Same as stitchNameKo — reuse it
  return stitchNameKo(stitch)
}

function stitchNameProseEn(stitch: Stitch): string {
  switch (stitch.kind) {
    case 'knit': return 'knit'
    case 'purl': return 'purl'
    case 'yarn-over': return 'yarn over'
    case 'k2tog': return 'knit 2 together'
    case 'ssk': return 'slip slip knit'
    case 'kfb': return 'knit front and back'
    case 'slip': return 'slip'
    case 'cable': return `${stitch.count}-stitch ${stitch.direction} cable`
    case 'm1l': return 'make 1 left'
    case 'm1r': return 'make 1 right'
    case 'p2tog': return 'purl 2 together'
    case 'ssp': return 'slip slip purl'
    case 'sk2p': return 'slip 1, k2tog, pass slipped stitch over'
    case 'bind-off': return 'bind off'
    case 'pick-up': return 'pick up'
  }
}

function renderPatternProse(pattern: Pattern, locale: Locale): string {
  switch (pattern.kind) {
    case 'stitch': {
      return locale === 'ko' ? stitchNameKo(pattern.value) : stitchNameProseEn(pattern.value)
    }

    case 'repeat': {
      const { body, times } = pattern
      const firstNode = body[0]
      if (body.length === 1 && firstNode !== undefined && firstNode.kind === 'stitch') {
        const name = locale === 'ko' ? stitchNameKo(firstNode.value) : stitchNameProseEn(firstNode.value)
        return locale === 'ko'
          ? `${name} ${times}코`
          : `${name} ${times}`
      }
      const inner = body.map(p => renderPatternProse(p, locale)).join(', ')
      return locale === 'ko'
        ? `${inner}를 ${times}번 반복`
        : `Repeat ${inner} a total of ${times} times`
    }

    case 'row': {
      const rowNum = pattern.rowNumber ?? ''
      const side = locale === 'ko'
        ? (pattern.side === 'RS' ? '겉면' : '안면')
        : pattern.side
      const header = locale === 'ko'
        ? `${rowNum}단 (${side}): `
        : `Row ${rowNum} (${side}): `
      const stitches = pattern.stitches.map(p => renderPatternProse(p, locale))
      const body = stitches.join(', ')
      // Add sentence ending
      const ending = locale === 'ko' ? getProseEndingKo(pattern.stitches) : '.'
      return header + body + ending
    }

    case 'block': {
      const castOnLine = locale === 'ko'
        ? `${pattern.castOn}코를 만듭니다.`
        : `Cast on ${pattern.castOn} stitches.`
      const rows = pattern.rows.map(r => renderPatternProse(r, locale))
      return [castOnLine, ...rows].join('\n')
    }
  }
}

// Determine Korean sentence ending based on row content
function getProseEndingKo(stitches: Pattern[]): string {
  // If the row has a repeat, the prose already says "반복"
  if (stitches.length === 1 && stitches[0]?.kind === 'repeat') {
    const repeat = stitches[0]
    if (repeat.body.length === 1) {
      return '를 뜹니다.'
    }
    return '합니다.'
  }
  return '.'
}

export function renderText(pattern: Pattern, locale: 'ko' | 'en', style: TextStyle = 'short'): string {
  if (style === 'prose') {
    return renderPatternProse(pattern, locale)
  }
  return renderPattern(pattern, locale)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/renderer/text.test.ts`
Expected: All tests pass (existing short tests + new prose tests)

- [ ] **Step 5: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add src/renderer/text.ts tests/renderer/text.test.ts
git commit -m "feat: add prose text rendering style with natural language output"
```

---

### Task 6: Public API Wiring

**Files:**
- Modify: `src/renderer/index.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Update renderer/index.ts**

```typescript
export { renderText } from './text.js'
export type { TextStyle } from './text.js'
export { computeStats } from './stats.js'
export type { PatternStats } from './stats.js'
export { renderSvg } from './svg.js'
export type { ChartStyle, SymbolSet, SymbolRenderer } from './symbols/index.js'
export { getSymbolSet } from './symbols/index.js'
```

- [ ] **Step 2: Update src/index.ts**

Add to the renderer exports section:
```typescript
export type { TextStyle } from './renderer/index.js'
export type { ChartStyle, SymbolSet, SymbolRenderer } from './renderer/index.js'
export { getSymbolSet } from './renderer/index.js'
```

- [ ] **Step 3: Run tsc + tests**

Run: `npx vitest run && npx tsc --noEmit`
Expected: All pass, no errors

- [ ] **Step 4: Commit**

```bash
git add src/renderer/index.ts src/index.ts
git commit -m "feat: export ChartStyle, TextStyle, and symbol set utilities from public API"
```

---

### Task 7: Update Demo

**Files:**
- Modify: `demo.ts`

- [ ] **Step 1: Add JIS and prose demos to demo.ts**

Append sections to demo.ts that:
- Render the rib pattern with JIS style SVG (`renderSvg(block, 'jis')`) and save as `demo-chart-jis.svg`
- Render the rib pattern with prose style (`renderText(block, 'ko', 'prose')`)
- Show English prose output too

- [ ] **Step 2: Run demo**

Run: `npx tsx demo.ts`
Expected: Clean output with all rendering styles

- [ ] **Step 3: Update .gitignore**

Add `demo-chart-jis.svg` to `.gitignore`.

- [ ] **Step 4: Commit**

```bash
git add demo.ts .gitignore
git commit -m "chore: update demo with JIS chart and prose text output"
```

---

## Summary

| Task | Component | New Tests | Steps |
|------|-----------|-----------|-------|
| 1 | Symbol types | 0 | 2 |
| 2 | Standard symbol set | 7 | 5 |
| 3 | JIS symbol set | 5 | 5 |
| 4 | Symbol index + SVG refactor | 4 | 6 |
| 5 | Prose text style | 5 | 6 |
| 6 | Public API wiring | 0 | 4 |
| 7 | Update demo | 0 | 4 |
| **Total** | | **21** | **32** |
