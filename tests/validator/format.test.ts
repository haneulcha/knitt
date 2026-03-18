import { describe, it, expect } from 'vitest'
import {
  formatValidationError, formatValidationErrors,
  formatParseError, formatLexerError, formatMetadataError,
} from '../../src/validator/format.js'
import type { ValidationError, ParseError, LexerError, MetadataError } from '../../src/domain/types.js'

describe('formatValidationError', () => {
  it('formats insufficient-stitches in Korean', () => {
    const e: ValidationError = { kind: 'insufficient-stitches', needed: 2, available: 1, location: { row: 1, position: 3 } }
    expect(formatValidationError(e, 'ko')).toBe('1단 3번째 위치: 2코가 필요하지만 1코만 남아있습니다')
  })
  it('formats insufficient-stitches in English', () => {
    const e: ValidationError = { kind: 'insufficient-stitches', needed: 2, available: 1, location: { row: 1, position: 3 } }
    expect(formatValidationError(e, 'en')).toBe('Row 1, position 3: needs 2 stitches but only 1 available')
  })
  it('formats count-mismatch in Korean', () => {
    const e: ValidationError = { kind: 'count-mismatch', expected: 20, actual: 18, row: 1 }
    expect(formatValidationError(e, 'ko')).toBe('1단: 20코를 예상했지만 18코입니다')
  })
  it('formats count-mismatch in English', () => {
    const e: ValidationError = { kind: 'count-mismatch', expected: 20, actual: 18, row: 1 }
    expect(formatValidationError(e, 'en')).toBe('Row 1: expected 20 stitches but got 18')
  })
  it('formats unbalanced-shaping in Korean', () => {
    const e: ValidationError = { kind: 'unbalanced-shaping', delta: 2, row: 3 }
    expect(formatValidationError(e, 'ko')).toBe('3단: 코 수가 2만큼 변합니다 (증감 불균형)')
  })
  it('formats unbalanced-shaping in English', () => {
    const e: ValidationError = { kind: 'unbalanced-shaping', delta: 2, row: 3 }
    expect(formatValidationError(e, 'en')).toBe('Row 3: stitch count changes by 2 (unbalanced shaping)')
  })
})

describe('formatValidationErrors', () => {
  it('joins multiple errors with newlines', () => {
    const errors: ValidationError[] = [
      { kind: 'insufficient-stitches', needed: 2, available: 1, location: { row: 1, position: 0 } },
      { kind: 'count-mismatch', expected: 10, actual: 8, row: 2 },
    ]
    expect(formatValidationErrors(errors, 'en')).toBe(
      'Row 1, position 0: needs 2 stitches but only 1 available\nRow 2: expected 10 stitches but got 8'
    )
  })
})

describe('formatLexerError', () => {
  it('formats in Korean', () => {
    const e: LexerError = { message: "Unexpected character '@'", position: 5, line: 1 }
    expect(formatLexerError(e, 'ko')).toBe("1번째 줄, 위치 5: Unexpected character '@'")
  })
  it('formats in English', () => {
    const e: LexerError = { message: "Unexpected character '@'", position: 5, line: 1 }
    expect(formatLexerError(e, 'en')).toBe("Line 1, position 5: Unexpected character '@'")
  })
})

describe('formatParseError', () => {
  it('formats in Korean', () => {
    const e: ParseError = { message: 'Expected ROW but got EOF' }
    expect(formatParseError(e, 'ko')).toBe('파싱 오류: Expected ROW but got EOF')
  })
  it('formats in English', () => {
    const e: ParseError = { message: 'Expected ROW but got EOF' }
    expect(formatParseError(e, 'en')).toBe('Parse error: Expected ROW but got EOF')
  })
})

describe('formatMetadataError', () => {
  it('formats in Korean', () => {
    const e: MetadataError = { message: 'Missing required field: cast-on', line: 1 }
    expect(formatMetadataError(e, 'ko')).toBe('메타데이터 1번째 줄: Missing required field: cast-on')
  })
  it('formats in English', () => {
    const e: MetadataError = { message: 'Missing required field: cast-on', line: 1 }
    expect(formatMetadataError(e, 'en')).toBe('Metadata line 1: Missing required field: cast-on')
  })
})
