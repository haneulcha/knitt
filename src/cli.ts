#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { parse } from './parser/index.js'
import { validateBlock } from './validator/validate.js'
import { formatValidationErrors, formatParseError, formatMetadataError } from './validator/format.js'
import { renderText } from './renderer/text.js'
import { renderSvg } from './renderer/svg.js'
import { computeStats } from './renderer/stats.js'
import type { Pattern } from './domain/types.js'
import type { ChartStyle } from './renderer/symbols/index.js'
import type { TextStyle } from './renderer/text.js'

type Locale = 'ko' | 'en'

function parseArgs(argv: string[]): { command: string; file?: string; flags: Record<string, string | boolean> } {
  const args = argv.slice(2)
  const command = args[0] ?? 'help'
  const flags: Record<string, string | boolean> = {}
  let file: string | undefined

  for (let i = 1; i < args.length; i++) {
    const arg = args[i]!
    if (arg === '--en') {
      flags.en = true
    } else if (arg === '--format' && i + 1 < args.length) {
      flags.format = args[++i]!
    } else if (arg === '--out' && i + 1 < args.length) {
      flags.out = args[++i]!
    } else if (!arg.startsWith('-')) {
      file = arg
    }
  }

  return { command, file, flags }
}

function getLocale(flags: Record<string, string | boolean>): Locale {
  return flags.en ? 'en' : 'ko'
}

function loadAndParse(file: string) {
  const input = readFileSync(file, 'utf-8')
  return parse(input)
}

function printHelp(): void {
  console.log(`knitt — 뜨개질 패턴 DSL 도구

사용법:
  knitt validate <file> [--en]                    패턴 검증
  knitt render <file> [--format <fmt>] [--out <file>] [--en]  렌더링
  knitt stats <file> [--en]                       통계
  knitt help                                      도움말

렌더링 포맷 (--format):
  text    약어 텍스트 (기본)
  prose   줄글 (자연어)
  chart   SVG 차트 (국제 표준)
  jis     SVG 차트 (일본식)

옵션:
  --en    영어 출력
  --out   SVG 출력 파일 경로 (chart/jis 포맷 시)`)
}

function cmdValidate(file: string, locale: Locale): void {
  const result = loadAndParse(file)
  if (!result.ok) {
    console.error(locale === 'ko' ? `파싱 실패: ${result.error.message}` : `Parse error: ${result.error.message}`)
    process.exit(1)
  }

  if (result.value.kind !== 'block') {
    console.error('Not a block pattern')
    process.exit(1)
  }

  const block = result.value as Pattern & { kind: 'block' }
  const valid = validateBlock(block)

  if (!valid.ok) {
    console.error(formatValidationErrors(valid.error, locale))
    process.exit(1)
  }

  const stats = computeStats(block)
  console.log(locale === 'ko'
    ? `✓ 패턴이 유효합니다 (${block.castOn}코, ${stats.totalRows}행)`
    : `✓ Pattern is valid (${block.castOn} sts, ${stats.totalRows} rows)`)
}

function cmdRender(file: string, flags: Record<string, string | boolean>, locale: Locale): void {
  const result = loadAndParse(file)
  if (!result.ok) {
    console.error(locale === 'ko' ? `파싱 실패: ${result.error.message}` : `Parse error: ${result.error.message}`)
    process.exit(1)
  }

  if (result.value.kind !== 'block') {
    console.error('Not a block pattern')
    process.exit(1)
  }

  const block = result.value as Pattern & { kind: 'block' }
  const format = (flags.format as string) ?? 'text'

  switch (format) {
    case 'text':
      console.log(renderText(block, locale, 'short'))
      break
    case 'prose':
      console.log(renderText(block, locale, 'prose'))
      break
    case 'chart':
    case 'jis': {
      const style: ChartStyle = format === 'jis' ? 'jis' : 'standard'
      const svg = renderSvg(block, style)
      const outFile = flags.out as string | undefined
      if (outFile) {
        writeFileSync(outFile, svg)
        console.log(locale === 'ko' ? `SVG 저장: ${outFile}` : `SVG saved: ${outFile}`)
      } else {
        console.log(svg)
      }
      break
    }
    default:
      console.error(`Unknown format: ${format}`)
      console.error('Available: text, prose, chart, jis')
      process.exit(1)
  }
}

function cmdStats(file: string, locale: Locale): void {
  const result = loadAndParse(file)
  if (!result.ok) {
    console.error(locale === 'ko' ? `파싱 실패: ${result.error.message}` : `Parse error: ${result.error.message}`)
    process.exit(1)
  }

  if (result.value.kind !== 'block') {
    console.error('Not a block pattern')
    process.exit(1)
  }

  const block = result.value as Pattern & { kind: 'block' }
  const stats = computeStats(block)

  if (block.metadata?.name) {
    console.log(locale === 'ko' ? `패턴: ${block.metadata.name}` : `Pattern: ${block.metadata.name}`)
  }

  console.log(locale === 'ko'
    ? `총 ${stats.totalRows}행, ${stats.totalStitches}코`
    : `${stats.totalRows} rows, ${stats.totalStitches} stitches`)

  for (const [kind, count] of Object.entries(stats.stitchCounts)) {
    if (count > 0) {
      console.log(`  ${kind}: ${count}`)
    }
  }
}

// Main
const { command, file, flags } = parseArgs(process.argv)
const locale = getLocale(flags)

switch (command) {
  case 'help':
  case '--help':
  case '-h':
    printHelp()
    break

  case 'validate':
    if (!file) {
      console.error('Usage: knitt validate <file>')
      process.exit(1)
    }
    cmdValidate(file, locale)
    break

  case 'render':
    if (!file) {
      console.error('Usage: knitt render <file> [--format text|prose|chart|jis] [--out <file>]')
      process.exit(1)
    }
    cmdRender(file, flags, locale)
    break

  case 'stats':
    if (!file) {
      console.error('Usage: knitt stats <file>')
      process.exit(1)
    }
    cmdStats(file, locale)
    break

  default:
    console.error(`Unknown command: ${command}`)
    printHelp()
    process.exit(1)
}
