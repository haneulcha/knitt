# Knitt — Knitting Pattern DSL

뜨개질 패턴 표기법을 위한 DSL. 텍스트 패턴을 파싱하여 AST로 변환하고, 코 수 일관성을 검증하며, 다양한 형식으로 렌더링한다.

## Tech Stack

- TypeScript (strict mode), Node.js, Vitest
- 외부 의존성 없음 — 파서(recursive descent), Result 타입, CLI 모두 직접 구현

## Architecture

```
텍스트 입력 → Lexer(Token[]) → Parser(AST) → Validator(Result) → Renderer(출력)
```

모든 핵심 로직은 순수 함수. 불변 데이터. `throw` 금지, `any` 금지. 에러는 `Result<T, E>`로 표현.

## 디렉토리 구조

```
src/
  domain/types.ts         — AST 타입 (StitchKind 15종, Stitch, Pattern, Token, Error 타입, PatternMetadata)
  domain/signatures.ts    — 스티치별 코 수 변화 (consumes/produces/delta)
  parser/lexer.ts         — 토크나이저: string → Token[]
  parser/parser.ts        — Recursive descent parser: Token[] → AST
  parser/metadata.ts      — 메타데이터 헤더 파서 (--- YAML-like ---)
  validator/result.ts     — Result<T,E> 모나드 (ok, err, map, flatMap, collect)
  validator/validate.ts   — validateStitch, validateRow, validateBlock
  validator/format.ts     — 에러 메시지 포매터 (한국어/영어)
  renderer/text.ts        — 텍스트 렌더러 (short/prose × ko/en)
  renderer/stats.ts       — 통계 렌더러
  renderer/svg.ts         — SVG 차트 렌더러 (그리드 엔진)
  renderer/symbols/       — 기호 스타일 시스템 (standard, jis)
  cli.ts                  — CLI 진입점 (validate, render, stats, help)
  index.ts                — Public API barrel export
tests/                    — Vitest 테스트 (154개)
examples/                 — 예제 .knit 파일
demo.ts                   — 전체 파이프라인 데모
run.ts                    — 간단한 파일 실행 스크립트
```

## 설계 원칙

- **함수형**: 순수 함수, 불변 데이터, 합성
- **Result 타입**: 예외 대신 `Result<T, E>`로 에러를 명시적으로 표현
- **에러 수집**: 검증 시 가능한 한 모든 에러를 수집해서 반환 (`ValidationError[]`)
- **타입 안전성**: `any` 금지, 제네릭과 discriminated union 활용
- **테스트 우선**: TDD로 구현
- **데이터 주도**: SVG 기호를 SymbolSet 레코드로 관리, 새 스타일 추가 용이

## 명령어

```bash
npm test          # 테스트 실행
npm run build     # TypeScript 컴파일
npx tsx demo.ts   # 데모 실행

# CLI
npx tsx src/cli.ts validate <file> [--en]
npx tsx src/cli.ts render <file> [--format text|prose|chart|jis] [--out <file>] [--en]
npx tsx src/cli.ts stats <file> [--en]
npx tsx src/cli.ts help
```

## 알려진 제약

- `validateStitch` (public API)와 `validateRow` (internal)가 다른 카운팅 모델 사용
- SVG 렌더러는 `castOn` 기준으로 폭 계산 — 셰이핑 후 코 수 변화 미반영
- JIS 기호 세트에서 m1l/m1r은 동일 기호 사용 (JIS 관례)

## GitHub

https://github.com/haneulcha/knitt
