// === Stitch Types ===

export type StitchKind =
  | 'knit'
  | 'purl'
  | 'yarn-over'
  | 'k2tog'
  | 'ssk'
  | 'kfb'
  | 'slip'
  | 'cable'

export type Stitch =
  | { readonly kind: Exclude<StitchKind, 'cable'> }
  | { readonly kind: 'cable'; readonly count: number; readonly direction: 'front' | 'back' }

// === Pattern AST ===

export type Pattern =
  | { readonly kind: 'stitch'; readonly value: Stitch }
  | { readonly kind: 'repeat'; readonly body: Pattern[]; readonly times: number }
  | { readonly kind: 'row'; readonly stitches: Pattern[]; readonly side: 'RS' | 'WS'; readonly rowNumber?: number }
  | { readonly kind: 'block'; readonly rows: Pattern[]; readonly castOn: number }

// === Stitch Signature ===

export type StitchSignature = {
  readonly consumes: number
  readonly produces: number
  readonly delta: number
}

// === Validation ===

export type ValidationError =
  | {
      readonly kind: 'insufficient-stitches'
      readonly needed: number
      readonly available: number
      readonly location: { readonly row: number; readonly position: number }
    }
  | {
      readonly kind: 'count-mismatch'
      readonly expected: number
      readonly actual: number
      readonly row: number
    }
  | {
      readonly kind: 'unbalanced-shaping'
      readonly delta: number
      readonly row: number
    }

// === Lexer Tokens ===

export type Token =
  | { readonly kind: 'ROW'; readonly number?: number; readonly side: 'RS' | 'WS' }
  | { readonly kind: 'STITCH'; readonly stitch: 'k' | 'p' | 'sl'; readonly count: number }
  | { readonly kind: 'FIXED_STITCH'; readonly stitch: 'yo' | 'k2tog' | 'ssk' | 'kfb' }
  | { readonly kind: 'CABLE'; readonly count: number; readonly direction: 'F' | 'B' }
  | { readonly kind: 'REPEAT_START' }
  | { readonly kind: 'REPEAT_END' }
  | { readonly kind: 'TIMES'; readonly count: number }
  | { readonly kind: 'COMMA' }
  | { readonly kind: 'COLON' }
  | { readonly kind: 'EOF' }

export type LexerError = {
  readonly message: string
  readonly position: number
  readonly line: number
}
