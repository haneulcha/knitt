import { Result, ok, err } from '../validator/result.js'
import { Token, LexerError } from '../domain/types.js'

export function tokenize(input: string): Result<Token[], LexerError> {
  const tokens: Token[] = []
  let pos = 0
  let line = 1
  let repeatDepth = 0 // track starts vs ends emitted

  function makeError(message: string): Result<Token[], LexerError> {
    return err({ message, position: pos, line })
  }

  function skipWhitespace(): void {
    while (pos < input.length && /[ \t]/.test(input[pos])) {
      pos++
    }
  }

  function skipNewlines(): void {
    while (pos < input.length && (input[pos] === '\n' || input[pos] === '\r')) {
      if (input[pos] === '\n') line++
      pos++
    }
  }

  while (pos < input.length) {
    // Skip whitespace and newlines
    skipWhitespace()
    skipNewlines()
    skipWhitespace()

    if (pos >= input.length) break

    const ch = input[pos]

    // Skip line comments
    if (ch === '/' && input[pos + 1] === '/') {
      while (pos < input.length && input[pos] !== '\n') {
        pos++
      }
      continue
    }

    // Row header: "Row N (RS):" or "Row N (WS):"
    const rowMatch = input.slice(pos).match(/^Row\s+(\d+)\s*\((RS|WS)\)/)
    if (rowMatch) {
      const number = parseInt(rowMatch[1], 10)
      const side = rowMatch[2] as 'RS' | 'WS'
      tokens.push({ kind: 'ROW', number, side })
      pos += rowMatch[0].length
      continue
    }

    // Comma
    if (ch === ',') {
      tokens.push({ kind: 'COMMA' })
      pos++
      continue
    }

    // Colon
    if (ch === ':') {
      tokens.push({ kind: 'COLON' })
      pos++
      continue
    }

    // Repeat star
    if (ch === '*') {
      // Lookahead: if this '*' is followed by optional whitespace then 'xN', it's a REPEAT_END
      // followed by a TIMES token. Otherwise it's a REPEAT_START.
      const afterStar = input.slice(pos + 1)
      const closingMatch = afterStar.match(/^[ \t]*x(\d+)/)
      if (closingMatch) {
        tokens.push({ kind: 'REPEAT_END' })
        repeatDepth = Math.max(0, repeatDepth - 1)
        pos++ // consume the '*'
        // skip whitespace before xN
        skipWhitespace()
        const timesMatch2 = input.slice(pos).match(/^x(\d+)/)
        if (timesMatch2) {
          tokens.push({ kind: 'TIMES', count: parseInt(timesMatch2[1], 10) })
          pos += timesMatch2[0].length
        }
      } else {
        tokens.push({ kind: 'REPEAT_START' })
        repeatDepth++
        pos++
      }
      continue
    }

    // Times: xN (standalone, not preceded by closing *)
    const timesMatch = input.slice(pos).match(/^x(\d+)/)
    if (timesMatch) {
      tokens.push({ kind: 'TIMES', count: parseInt(timesMatch[1], 10) })
      pos += timesMatch[0].length
      continue
    }

    // Cable: C{N}F or C{N}B
    const cableMatch = input.slice(pos).match(/^C(\d+)([FB])/)
    if (cableMatch) {
      tokens.push({
        kind: 'CABLE',
        count: parseInt(cableMatch[1], 10),
        direction: cableMatch[2] as 'F' | 'B',
      })
      pos += cableMatch[0].length
      continue
    }

    // Fixed stitches — must check BEFORE simple k/p/sl to avoid partial matches
    // k2tog
    if (input.slice(pos).startsWith('k2tog')) {
      tokens.push({ kind: 'FIXED_STITCH', stitch: 'k2tog' })
      pos += 5
      continue
    }

    // kfb
    if (input.slice(pos).startsWith('kfb')) {
      tokens.push({ kind: 'FIXED_STITCH', stitch: 'kfb' })
      pos += 3
      continue
    }

    // ssk
    if (input.slice(pos).startsWith('ssk')) {
      tokens.push({ kind: 'FIXED_STITCH', stitch: 'ssk' })
      pos += 3
      continue
    }

    // yo
    if (input.slice(pos).startsWith('yo')) {
      tokens.push({ kind: 'FIXED_STITCH', stitch: 'yo' })
      pos += 2
      continue
    }

    // sl (slip) with optional count — check before 'ssk' would match but ssk handled above
    const slMatch = input.slice(pos).match(/^sl(\d*)/)
    if (slMatch) {
      const count = slMatch[1] ? parseInt(slMatch[1], 10) : 1
      tokens.push({ kind: 'STITCH', stitch: 'sl', count })
      pos += slMatch[0].length
      continue
    }

    // k with optional count
    const kMatch = input.slice(pos).match(/^k(\d*)/)
    if (kMatch) {
      const count = kMatch[1] ? parseInt(kMatch[1], 10) : 1
      tokens.push({ kind: 'STITCH', stitch: 'k', count })
      pos += kMatch[0].length
      continue
    }

    // p with optional count
    const pMatch = input.slice(pos).match(/^p(\d*)/)
    if (pMatch) {
      const count = pMatch[1] ? parseInt(pMatch[1], 10) : 1
      tokens.push({ kind: 'STITCH', stitch: 'p', count })
      pos += pMatch[0].length
      continue
    }

    // Unknown token
    return makeError(`Unexpected character '${ch}' at position ${pos}`)
  }

  tokens.push({ kind: 'EOF' })
  return ok(tokens)
}
