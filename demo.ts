import { parse } from './src/parser/index.js'
import { validateBlock } from './src/validator/validate.js'
import { renderText } from './src/renderer/text.js'
import { renderSvg } from './src/renderer/svg.js'
import { computeStats } from './src/renderer/stats.js'
import { formatValidationErrors, formatMetadataError } from './src/validator/format.js'
import type { Pattern } from './src/domain/types.js'
import { writeFileSync } from 'node:fs'

// === 1. 메타데이터 헤더 사용 ===
const ribPattern = `---
name: 2x2 리브 스카프
cast-on: 20
gauge: 20sts x 28rows / 10cm
yarn: 4ply wool
---
Row 1 (RS): *k2, p2* x5
Row 2 (WS): *p2, k2* x5`

console.log('=== 메타데이터 헤더가 있는 패턴 ===')
console.log(ribPattern)
console.log()

const ribResult = parse(ribPattern)
if (!ribResult.ok) {
  console.error('파싱 실패:', ribResult.error)
  process.exit(1)
}

if (ribResult.value.kind === 'block') {
  const block = ribResult.value as Pattern & { kind: 'block' }

  // 메타데이터 확인
  console.log('=== 메타데이터 ===')
  console.log(`이름: ${block.metadata?.name}`)
  console.log(`코 수: ${block.castOn}`)
  console.log(`게이지: ${block.metadata?.gauge}`)
  console.log(`실: ${block.metadata?.yarn}`)
  console.log()

  // 검증
  const validResult = validateBlock(block)
  if (!validResult.ok) {
    console.error('검증 실패:\n' + formatValidationErrors(validResult.error, 'ko'))
    process.exit(1)
  }
  console.log('=== 검증 결과 ===')
  console.log('✓ 패턴이 유효합니다')
  console.log()

  // 한국어/영어 렌더링
  console.log('=== 한국어 출력 ===')
  console.log(renderText(block, 'ko'))
  console.log()

  console.log('=== English Output ===')
  console.log(renderText(block, 'en'))
  console.log()

  // 통계
  const stats = computeStats(block)
  console.log('=== 통계 ===')
  console.log(`총 행 수: ${stats.totalRows}`)
  console.log(`총 코 수: ${stats.totalStitches}`)
  for (const [kind, count] of Object.entries(stats.stitchCounts)) {
    if (count > 0) console.log(`  ${kind}: ${count}`)
  }
  console.log()

  // SVG
  const svg = renderSvg(block)
  writeFileSync('demo-chart.svg', svg)
  console.log(`SVG 차트: demo-chart.svg (${svg.length} bytes)`)
  console.log()
}

// === 2. 새로운 스티치 타입 ===
console.log('=== 새로운 스티치 (셰이핑) ===')

const shapingPattern = `---
cast-on: 6
---
Row 1 (RS): k1, m1l, k2, m1r, k1
Row 2 (WS): p8`

console.log(shapingPattern)
const shapingResult = parse(shapingPattern)
if (shapingResult.ok && shapingResult.value.kind === 'block') {
  const block = shapingResult.value as Pattern & { kind: 'block' }
  const v = validateBlock(block)
  console.log(v.ok
    ? '✓ 유효 — m1l(+1), m1r(+1)로 6코 → 8코'
    : '✗ 무효:\n' + formatValidationErrors((v as any).error, 'ko'))
  console.log()
}

// === 3. 에러 검출 (잘못된 패턴) ===
console.log('=== 에러 검출 ===')

const badPattern = `---
cast-on: 5
---
Row 1 (RS): k1, sk2p, sk2p`

console.log(badPattern)
console.log('(5코에서 sk2p 두 번 = 6코 필요, 부족)')
const badResult = parse(badPattern)
if (badResult.ok && badResult.value.kind === 'block') {
  const block = badResult.value as Pattern & { kind: 'block' }
  const v = validateBlock(block)
  if (!v.ok) {
    console.log('✗ 검증 실패:')
    console.log(formatValidationErrors(v.error, 'ko'))
  }
}
