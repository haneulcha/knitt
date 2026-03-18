import { Result, ok, err } from '../validator/result.js'
import { Token, Pattern, Stitch, ParseError } from '../domain/types.js'
import { tokenize } from './lexer.js'

type TokenStream = {
  tokens: Token[]
  pos: number
}

function peek(stream: TokenStream): Token {
  return stream.tokens[stream.pos] ?? { kind: 'EOF' }
}

function advance(stream: TokenStream): Token {
  const token = stream.tokens[stream.pos] ?? { kind: 'EOF' }
  stream.pos++
  return token
}

function consume(stream: TokenStream, kind: Token['kind']): Result<Token, ParseError> {
  const token = peek(stream)
  if (token.kind !== kind) {
    return err({ message: `Expected ${kind} but got ${token.kind}`, token })
  }
  advance(stream)
  return ok(token)
}

function mapStitchKind(stitch: 'k' | 'p' | 'sl'): Stitch {
  switch (stitch) {
    case 'k':
      return { kind: 'knit' }
    case 'p':
      return { kind: 'purl' }
    case 'sl':
      return { kind: 'slip' }
  }
}

function mapFixedStitch(stitch: 'yo' | 'k2tog' | 'ssk' | 'kfb'): Stitch {
  switch (stitch) {
    case 'yo':
      return { kind: 'yarn-over' }
    case 'k2tog':
      return { kind: 'k2tog' }
    case 'ssk':
      return { kind: 'ssk' }
    case 'kfb':
      return { kind: 'kfb' }
  }
}

function parsePatternList(stream: TokenStream): Result<Pattern[], ParseError> {
  const items: Pattern[] = []

  while (true) {
    const token = peek(stream)

    // Stop conditions
    if (token.kind === 'EOF' || token.kind === 'REPEAT_END' || token.kind === 'ROW') {
      break
    }

    // Skip commas
    if (token.kind === 'COMMA') {
      advance(stream)
      continue
    }

    // Skip colons (after row header)
    if (token.kind === 'COLON') {
      advance(stream)
      continue
    }

    if (token.kind === 'STITCH') {
      advance(stream)
      const stitchValue = mapStitchKind(token.stitch)
      if (token.count > 1) {
        items.push({
          kind: 'repeat',
          body: [{ kind: 'stitch', value: stitchValue }],
          times: token.count,
        })
      } else {
        items.push({ kind: 'stitch', value: stitchValue })
      }
      continue
    }

    if (token.kind === 'FIXED_STITCH') {
      advance(stream)
      items.push({ kind: 'stitch', value: mapFixedStitch(token.stitch) })
      continue
    }

    if (token.kind === 'CABLE') {
      advance(stream)
      items.push({
        kind: 'stitch',
        value: {
          kind: 'cable',
          count: token.count,
          direction: token.direction === 'F' ? 'front' : 'back',
        },
      })
      continue
    }

    if (token.kind === 'REPEAT_START') {
      advance(stream)
      const bodyResult = parsePatternList(stream)
      if (!bodyResult.ok) return bodyResult

      const endResult = consume(stream, 'REPEAT_END')
      if (!endResult.ok) return endResult

      // Optional TIMES token
      let times = 1
      if (peek(stream).kind === 'TIMES') {
        const timesToken = advance(stream)
        if (timesToken.kind === 'TIMES') {
          times = timesToken.count
        }
      }

      items.push({ kind: 'repeat', body: bodyResult.value, times })
      continue
    }

    // Unexpected token
    return err({ message: `Unexpected token: ${token.kind}`, token })
  }

  return ok(items)
}

function parseRow(stream: TokenStream): Result<Pattern, ParseError> {
  const rowToken = peek(stream)
  if (rowToken.kind !== 'ROW') {
    return err({ message: `Expected ROW token but got ${rowToken.kind}`, token: rowToken })
  }
  advance(stream)

  // Optional COLON
  if (peek(stream).kind === 'COLON') {
    advance(stream)
  }

  const stitchesResult = parsePatternList(stream)
  if (!stitchesResult.ok) return stitchesResult

  return ok({
    kind: 'row',
    stitches: stitchesResult.value,
    side: rowToken.side,
    rowNumber: rowToken.number,
  })
}

function parseBlock(stream: TokenStream): Result<Pattern, ParseError> {
  const rows: Pattern[] = []

  while (peek(stream).kind !== 'EOF') {
    const rowResult = parseRow(stream)
    if (!rowResult.ok) return rowResult
    rows.push(rowResult.value)
  }

  return ok({ kind: 'block', rows, castOn: 0 })
}

export function parse(input: string): Result<Pattern, ParseError> {
  const tokenizeResult = tokenize(input)
  if (!tokenizeResult.ok) {
    return err({ message: tokenizeResult.error.message })
  }

  const stream: TokenStream = { tokens: tokenizeResult.value, pos: 0 }
  return parseBlock(stream)
}
