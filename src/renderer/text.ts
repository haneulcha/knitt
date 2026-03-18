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
    case 'm1l': return '왼쪽 늘리기'
    case 'm1r': return '오른쪽 늘리기'
    case 'p2tog': return '안뜨기 오른코 줄이기'
    case 'ssp': return '안뜨기 왼코 줄이기'
    case 'sk2p': return '중앙 줄이기'
    case 'bind-off': return '코 마무리'
    case 'pick-up': return '코 줍기'
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
    case 'm1l': return 'm1l'
    case 'm1r': return 'm1r'
    case 'p2tog': return 'p2tog'
    case 'ssp': return 'ssp'
    case 'sk2p': return 'sk2p'
    case 'bind-off': return 'bo'
    case 'pick-up': return 'pu'
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
      const firstNode = body[0]
      if (body.length === 1 && firstNode !== undefined && firstNode.kind === 'stitch') {
        if (locale === 'ko') {
          const name = stitchNameKo(firstNode.value)
          return `${name} ${times}코`
        } else {
          const abbr = stitchAbbrEn(firstNode.value)
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

export type TextStyle = 'short' | 'prose'

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

// Renders a repeat's body item as a fragment (no sentence terminator)
function renderRepeatBodyItemProse(pattern: Pattern, locale: Locale): string {
  switch (pattern.kind) {
    case 'stitch': {
      if (locale === 'ko') return stitchNameKo(pattern.value)
      return stitchNameProseEn(pattern.value)
    }
    case 'repeat': {
      const { body, times } = pattern
      const firstNode = body[0]
      if (body.length === 1 && firstNode !== undefined && firstNode.kind === 'stitch') {
        if (locale === 'ko') {
          const name = stitchNameKo(firstNode.value)
          return `${name} ${times}코`
        } else {
          const name = stitchNameProseEn(firstNode.value)
          return `${name} ${times}`
        }
      }
      const inner = body.map(p => renderRepeatBodyItemProse(p, locale)).join(', ')
      return inner
    }
    default:
      return renderPatternProse(pattern, locale)
  }
}

function renderPatternProse(pattern: Pattern, locale: Locale): string {
  switch (pattern.kind) {
    case 'stitch': {
      if (locale === 'ko') return stitchNameKo(pattern.value)
      return stitchNameProseEn(pattern.value)
    }

    case 'repeat': {
      const { body, times } = pattern
      const firstNode = body[0]
      if (body.length === 1 && firstNode !== undefined && firstNode.kind === 'stitch') {
        if (locale === 'ko') {
          const name = stitchNameKo(firstNode.value)
          return `${name} ${times}코를 뜹니다.`
        } else {
          const name = stitchNameProseEn(firstNode.value)
          return `${name} ${times}.`
        }
      }
      // Multi-stitch repeat: render body items as fragments
      const inner = body.map(p => renderRepeatBodyItemProse(p, locale)).join(', ')
      if (locale === 'ko') {
        return `${inner}를 ${times}번 반복합니다.`
      } else {
        return `Repeat ${inner} a total of ${times} times.`
      }
    }

    case 'row': {
      const rowNum = pattern.rowNumber ?? ''
      let header: string
      if (locale === 'ko') {
        const side = pattern.side === 'RS' ? '겉면' : '안면'
        header = `${rowNum}단 (${side}): `
      } else {
        header = `Row ${rowNum} (${pattern.side}): `
      }
      const stitches = pattern.stitches.map(p => renderPatternProse(p, locale)).join(', ')
      return header + stitches
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

export function renderText(pattern: Pattern, locale: 'ko' | 'en', style: TextStyle = 'short'): string {
  if (style === 'prose') {
    return renderPatternProse(pattern, locale)
  }
  return renderPattern(pattern, locale)
}
