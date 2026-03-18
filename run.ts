import { readFileSync } from 'node:fs'
import { parse } from './src/parser/index.js'
import { validateBlock } from './src/validator/validate.js'
import { renderText } from './src/renderer/text.js'
import { renderSvg } from './src/renderer/svg.js'
import { computeStats } from './src/renderer/stats.js'
import { formatValidationErrors } from './src/validator/format.js'
import type { Pattern } from './src/domain/types.js'
import { writeFileSync } from 'node:fs'

const file = process.argv[2]
if (!file) {
  console.error('사용법: npx tsx run.ts <파일.knit> [--en] [--svg]')
  process.exit(1)
}

const locale = process.argv.includes('--en') ? 'en' as const : 'ko' as const
const wantSvg = process.argv.includes('--svg')

const input = readFileSync(file, 'utf-8')
const result = parse(input)

if (!result.ok) {
  console.error('파싱 실패:', result.error.message)
  process.exit(1)
}

if (result.value.kind !== 'block') {
  console.error('블록 패턴이 아닙니다')
  process.exit(1)
}

const block = result.value as Pattern & { kind: 'block' }

// 메타데이터
if (block.metadata?.name) {
  console.log(locale === 'ko' ? `패턴: ${block.metadata.name}` : `Pattern: ${block.metadata.name}`)
}
console.log(locale === 'ko' ? `코 수: ${block.castOn}` : `Cast on: ${block.castOn}`)
if (block.metadata?.gauge) console.log(locale === 'ko' ? `게이지: ${block.metadata.gauge}` : `Gauge: ${block.metadata.gauge}`)
if (block.metadata?.yarn) console.log(locale === 'ko' ? `실: ${block.metadata.yarn}` : `Yarn: ${block.metadata.yarn}`)
console.log()

// 검증
const valid = validateBlock(block)
if (!valid.ok) {
  console.error(locale === 'ko' ? '✗ 검증 실패:' : '✗ Validation failed:')
  console.error(formatValidationErrors(valid.error, locale))
  process.exit(1)
}
console.log(locale === 'ko' ? '✓ 패턴이 유효합니다' : '✓ Pattern is valid')
console.log()

// 렌더링
console.log(renderText(block, locale))
console.log()

// 통계
const stats = computeStats(block)
console.log(locale === 'ko' ? `총 ${stats.totalRows}행, ${stats.totalStitches}코` : `${stats.totalRows} rows, ${stats.totalStitches} stitches`)

// SVG
if (wantSvg) {
  const svgFile = file.replace(/\.knit$/, '') + '.svg'
  writeFileSync(svgFile, renderSvg(block))
  console.log(locale === 'ko' ? `SVG 저장: ${svgFile}` : `SVG saved: ${svgFile}`)
}
