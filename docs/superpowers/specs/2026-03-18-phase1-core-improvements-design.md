# Phase 1: Core Improvements — Design Spec

## 목표

Knitt 코어 엔진을 확장하여 실용적인 패턴 대부분을 지원하고, 패턴 파일 포맷을 정의하며, 에러 메시지를 사람이 읽을 수 있는 형태로 제공한다.

## 범위

1. 메타데이터 헤더 + 패턴 파일 포맷 (`.knit`)
2. 새 스티치 7종 추가
3. 에러 메시지 포매터 (한국어/영어)

범위 밖: 렌더러 확장(줄글, 일본식), CLI 도구 — Phase 1의 후속 작업으로 별도 spec.

---

## 1. 메타데이터 헤더 + 패턴 파일 포맷

### 문법

```
---
name: 2x2 리브 스카프
cast-on: 40
gauge: 20sts x 28rows / 10cm
yarn: 4ply wool
---
Row 1 (RS): *k2, p2* x10
Row 2 (WS): *p2, k2* x10
```

- `---`로 감싼 YAML-like 헤더. 키-값 쌍, 한 줄에 하나.
- `cast-on`은 필수. 나머지(`name`, `gauge`, `yarn`)는 선택.
- 헤더 없이 `Row ...`로 시작하면 기존처럼 동작 (하위 호환, castOn=0).

### AST 변경

```typescript
type PatternMetadata = {
  readonly name?: string
  readonly castOn: number
  readonly gauge?: string
  readonly yarn?: string
}

// block 노드 확장
type BlockPattern = {
  readonly kind: 'block'
  readonly rows: Pattern[]
  readonly castOn: number
  readonly metadata?: PatternMetadata
}
```

`castOn`은 block 레벨에 그대로 유지 (하위 호환). `metadata`가 있으면 `metadata.castOn`과 `block.castOn`은 동일한 값.

### 파싱 전략

1. 입력 문자열의 첫 줄이 `---`인지 확인
2. 맞으면 두 번째 `---`까지의 내용을 메타데이터로 파싱 (간단한 `key: value` 파싱, YAML 라이브러리 불필요)
3. 나머지를 기존 lexer/parser에 전달
4. `cast-on` 값을 block의 `castOn` 필드에 설정

메타데이터 파서는 `src/parser/metadata.ts`에 별도 구현.

```typescript
type MetadataError = {
  readonly message: string
  readonly line: number
}

function parseMetadata(input: string): Result<{ metadata: PatternMetadata; rest: string }, MetadataError>
```

메타데이터 파싱은 lexer 이전에 발생하므로 Token이 없다. `MetadataError`는 `line` 정보를 포함하여 헤더 내 어느 줄에서 문제가 생겼는지 알려준다. 포매터에서도 이 타입을 지원.

### 파일 확장자

`.knit` — 관례적으로 사용. 파서 자체는 확장자에 의존하지 않음.

---

## 2. 새 스티치 추가

### 스티치 목록

| 표기 | StitchKind | consumes | produces | delta | 설명 |
|------|-----------|----------|----------|-------|------|
| `m1l` | `m1l` | 0 | 1 | +1 | 왼쪽 늘리기 |
| `m1r` | `m1r` | 0 | 1 | +1 | 오른쪽 늘리기 |
| `p2tog` | `p2tog` | 2 | 1 | -1 | 안뜨기 줄이기 |
| `ssp` | `ssp` | 2 | 1 | -1 | 안뜨기 왼코 줄이기 |
| `sk2p` | `sk2p` | 3 | 1 | -2 | 중앙 줄이기 (3코→1코) |
| `bo` / `boN` | `bind-off` | 1 | 0 | -1 | 코 마무리 |
| `pu` / `puN` | `pick-up` | 0 | 1 | +1 | 코 줍기 |

### 타입 변경

`StitchKind`에 7종 추가:

```typescript
type StitchKind =
  | 'knit' | 'purl' | 'yarn-over' | 'k2tog' | 'ssk' | 'kfb' | 'slip' | 'cable'
  // 새로 추가
  | 'm1l' | 'm1r' | 'p2tog' | 'ssp' | 'sk2p' | 'bind-off' | 'pick-up'
```

### Lexer 변경

- 고정 토큰 추가: `m1l`, `m1r`, `p2tog`, `ssp`, `sk2p` → `FIXED_STITCH`
- 카운트 토큰 추가: `bo`, `pu` → `STITCH` (k/p/sl과 동일한 구조)
  - `STITCH.stitch` 타입에 `'bo' | 'pu'` 추가

토큰 우선순위 (lexer 체크 순서):
1. `p2tog` → `p` 앞에서 체크 (`p`가 먼저 매칭되는 것 방지)
2. `pu` / `puN` → `p` 앞에서 체크 (`^p(\d*)`가 `pu`의 `p`를 먼저 잡는 것 방지)
3. `sk2p` → `ssk`, `sl` 앞에서 체크
4. `ssp` → `ssk`와 순서 무관 (둘 다 `ss`로 시작하지만 3번째 글자가 다르므로 `startsWith`로 안전)
5. `m1l`, `m1r` → 고유 접두사이므로 충돌 없음
6. `bo` / `boN` → 기존 토큰과 충돌 없음 (`b`로 시작하는 토큰 없음)

### Signatures 변경

`STITCH_SIGNATURES`에 7종 모두 추가. 모든 시그니처는 1코 단위 기준:
- `m1l`, `m1r`, `p2tog`, `ssp`, `sk2p` → 고정 스티치와 동일하게 FIXED_STITCH로 처리
- `bind-off` (consumes=1, produces=0), `pick-up` (consumes=0, produces=1) → 카운트 토큰이므로 `bo5`는 parser가 bind-off × 5 repeat 노드로 변환

### Renderer 변경

각 렌더러에 새 스티치 이름/기호 추가:

| StitchKind | 한국어 | English | SVG 심볼 |
|-----------|--------|---------|----------|
| `m1l` | 왼쪽 늘리기 | m1l | 왼쪽 화살표 |
| `m1r` | 오른쪽 늘리기 | m1r | 오른쪽 화살표 |
| `p2tog` | 안뜨기 오른코 줄이기 | p2tog | 점 + 오른쪽 사선 |
| `ssp` | 안뜨기 왼코 줄이기 | ssp | 점 + 왼쪽 사선 |
| `sk2p` | 중앙 줄이기 | sk2p | 아래 화살표 |
| `bind-off` | 코 마무리 | bo | X 표시 |
| `pick-up` | 코 줍기 | pu | 위쪽 화살표 |

---

## 3. 에러 메시지 포매터

### 설계

검증 로직과 표현을 분리한다. `ValidationError`는 구조화된 데이터로 유지, 별도 포매터 함수가 사람이 읽는 메시지를 생성.

```typescript
function formatValidationError(error: ValidationError, locale: 'ko' | 'en'): string
function formatValidationErrors(errors: ValidationError[], locale: 'ko' | 'en'): string
```

### 파일 위치

`src/validator/format.ts` — 포매터 전용 모듈.

### 메시지 예시

**insufficient-stitches:**
- ko: `"1단 3번째 위치: 2코가 필요하지만 1코만 남아있습니다"`
- en: `"Row 1, position 3: needs 2 stitches but only 1 available"`

**count-mismatch:**
- ko: `"1단: 20코를 예상했지만 18코입니다"`
- en: `"Row 1: expected 20 stitches but got 18"`

**unbalanced-shaping:**
- ko: `"1단: 코 수가 2만큼 변합니다 (증감 불균형)"`
- en: `"Row 1: stitch count changes by 2 (unbalanced shaping)"`

### LexerError / ParseError 포매터

같은 패턴으로 확장:

```typescript
function formatParseError(error: ParseError, locale: 'ko' | 'en'): string
function formatLexerError(error: LexerError, locale: 'ko' | 'en'): string
```

---

## 영향받는 파일

| 파일 | 변경 |
|------|------|
| `src/domain/types.ts` | StitchKind 확장, PatternMetadata 타입 추가, MetadataError 타입 추가, Pattern block variant에 metadata 필드 추가, Token STITCH 타입에 'bo'/'pu' 추가 |
| `src/domain/signatures.ts` | 새 스티치 7종 시그니처 추가 |
| `src/parser/metadata.ts` | 신규 — 메타데이터 헤더 파서 |
| `src/parser/lexer.ts` | 새 토큰 추가 (m1l, m1r, p2tog, ssp, sk2p, bo, pu) |
| `src/parser/parser.ts` | 메타데이터 파서 통합, 새 FIXED_STITCH/STITCH 매핑 추가 |
| `src/validator/format.ts` | 신규 — 에러 메시지 포매터 |
| `src/renderer/text.ts` | 새 스티치 이름 추가 |
| `src/renderer/svg.ts` | 새 스티치 심볼 추가 |
| `src/renderer/stats.ts` | StitchKind 확장으로 자동 대응 (ALL_STITCH_KINDS 배열 갱신) |
| `src/index.ts` | 새 export 추가 |

---

## 설계 원칙

- 기존 아키텍처 유지: 파이프라인 구조, 순수 함수, Result 타입
- 하위 호환: 헤더 없는 기존 패턴도 동작
- YAGNI: YAML 라이브러리 도입하지 않음 (key: value 파싱으로 충분)
- 외부 의존성 추가 없음
