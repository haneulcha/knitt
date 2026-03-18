import type { Pattern, Stitch } from '../domain/types.js'

type Locale = 'ko' | 'en'

function stitchNameKo(stitch: Stitch): string {
  switch (stitch.kind) {
    case 'knit': return '겉뜨기'
    case 'purl': return '안뜨기'
    case 'yarn-over': return '걸기코'
    case 'k2tog': return '오른코 줄이기'
    case 'ssk': return '왼코 줄이기'
    case 'kfb': return '앞뒤 겉뜨기'
    case 'slip': return '걸러뜨기'
    case 'cable': return `${stitch.count}코 ${stitch.direction === 'front' ? '앞' : '뒤'} 케이블`
  }
}

function stitchAbbrEn(stitch: Stitch): string {
  switch (stitch.kind) {
    case 'knit': return 'k'
    case 'purl': return 'p'
    case 'yarn-over': return 'yo'
    case 'k2tog': return 'k2tog'
    case 'ssk': return 'ssk'
    case 'kfb': return 'kfb'
    case 'slip': return 'sl'
    case 'cable': return `C${stitch.count}${stitch.direction === 'front' ? 'F' : 'B'}`
  }
}

function renderPattern(pattern: Pattern, locale: Locale): string {
  switch (pattern.kind) {
    case 'stitch': {
      if (locale === 'ko') return stitchNameKo(pattern.value)
      return stitchAbbrEn(pattern.value)
    }

    case 'repeat': {
      const { body, times } = pattern
      // Check if body is a single stitch node
      if (body.length === 1 && body[0].kind === 'stitch') {
        if (locale === 'ko') {
          const name = stitchNameKo(body[0].value)
          return `${name} ${times}코`
        } else {
          const abbr = stitchAbbrEn(body[0].value)
          return `${abbr}${times}`
        }
      }
      // Multi-stitch repeat
      const inner = body.map(p => renderPattern(p, locale)).join(', ')
      if (locale === 'ko') {
        return `(${inner}) × ${times}회`
      } else {
        return `*${inner}* x${times}`
      }
    }

    case 'row': {
      const rowNum = pattern.rowNumber ?? ''
      const header = `Row ${rowNum} (${pattern.side}): `
      const stitches = pattern.stitches.map(p => renderPattern(p, locale)).join(', ')
      return header + stitches
    }

    case 'block': {
      const castOnLine = locale === 'ko'
        ? `Cast on: ${pattern.castOn}코`
        : `Cast on: ${pattern.castOn} sts`
      const rows = pattern.rows.map(r => renderPattern(r, locale))
      return [castOnLine, ...rows].join('\n')
    }
  }
}

export function renderText(pattern: Pattern, locale: 'ko' | 'en'): string {
  return renderPattern(pattern, locale)
}
