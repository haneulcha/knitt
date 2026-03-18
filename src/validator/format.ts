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
