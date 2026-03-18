import { parse } from './src/parser/index.js'
import { validateBlock } from './src/validator/validate.js'
import { renderText } from './src/renderer/text.js'
import { renderSvg } from './src/renderer/svg.js'
import { computeStats } from './src/renderer/stats.js'
import type { Pattern } from './src/domain/types.js'
import { writeFileSync } from 'node:fs'

const input = `// 2x2 리브 패턴
Row 1 (RS): *k2, p2* x5
Row 2 (WS): *p2, k2* x5`

console.log('=== 입력 패턴 ===')
console.log(input)
console.log()

// 1. Parse
const parseResult = parse(input)
if (!parseResult.ok) {
  console.error('파싱 실패:', parseResult.error)
  process.exit(1)
}

const block = { ...parseResult.value, castOn: 20 } as Pattern & { kind: 'block' }

// 2. Validate
const validationResult = validateBlock(block)
if (!validationResult.ok) {
  console.error('검증 실패:', validationResult.error)
  process.exit(1)
}
console.log('=== 검증 결과 ===')
console.log('✓ 패턴이 유효합니다 (코 수 일관성 확인)')
console.log()

// 3. Text Render (Korean)
console.log('=== 한국어 출력 ===')
console.log(renderText(block, 'ko'))
console.log()

// 4. Text Render (English)
console.log('=== English Output ===')
console.log(renderText(block, 'en'))
console.log()

// 5. Stats
const stats = computeStats(block)
console.log('=== 통계 ===')
console.log(`총 행 수: ${stats.totalRows}`)
console.log(`총 코 수: ${stats.totalStitches}`)
console.log('스티치별 분포:')
for (const [kind, count] of Object.entries(stats.stitchCounts)) {
  if (count > 0) console.log(`  ${kind}: ${count}`)
}
console.log()

// 6. SVG Chart
const svg = renderSvg(block)
writeFileSync('demo-chart.svg', svg)
console.log('=== SVG 차트 ===')
console.log(`demo-chart.svg 저장 완료 (${svg.length} bytes)`)
console.log()

// --- 셰이핑 패턴 검증 데모 ---
console.log('=== 셰이핑 패턴 (증감 검증) ===')

const shapingInput = `Row 1 (RS): k1, yo, k2tog, k1`
console.log(`입력: ${shapingInput} (cast on: 4)`)

const shapingResult = parse(shapingInput)
if (shapingResult.ok) {
  const shapingBlock = { ...shapingResult.value, castOn: 4 } as Pattern & { kind: 'block' }
  const v = validateBlock(shapingBlock)
  console.log(v.ok ? '✓ 유효 — yo(+1)와 k2tog(-1)이 상쇄됨' : '✗ 무효')
}
console.log()

// --- 잘못된 패턴 검증 데모 ---
console.log('=== 잘못된 패턴 (에러 검출) ===')

const badInput = `Row 1 (RS): k2, C4F, k2`
console.log(`입력: ${badInput} (cast on: 6, 필요: 8)`)

const badResult = parse(badInput)
if (badResult.ok) {
  const badBlock = { ...badResult.value, castOn: 6 } as Pattern & { kind: 'block' }
  const v = validateBlock(badBlock)
  if (!v.ok) {
    console.log('✗ 검증 실패:')
    for (const e of v.error) {
      if (e.kind === 'insufficient-stitches') {
        console.log(`  Row ${e.location.row}: ${e.needed}코 필요, ${e.available}코만 있음`)
      }
    }
  }
}
