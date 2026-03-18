# Phase 1: Renderer Expansion — Design Spec

## 목표

기존 SVG 렌더러의 플레이스홀더 기호를 표준 기호로 교체하고, 일본식(JIS) 차트와 줄글(prose) 렌더링을 추가하여 하나의 패턴을 3가지 차트 스타일 + 2가지 텍스트 스타일로 자유롭게 변환할 수 있게 한다.

## 범위

1. SVG 렌더러에 기호 스타일 시스템 도입 (`'standard' | 'jis'`)
2. 국제 표준(CYC) 기호 세트 구현
3. 일본식(JIS) 기호 세트 구현
4. 기존 SVG 플레이스홀더 기호를 표준 기호로 교체
5. 줄글(prose) 텍스트 렌더러 추가

범위 밖: CLI 도구, 웹 에디터 — 별도 스텝.

---

## 1. SVG 기호 스타일 시스템

### API 변경

```typescript
type ChartStyle = 'standard' | 'jis'

// 기존 시그니처 유지 (하위 호환)
function renderSvg(pattern: Pattern): string
// 새 시그니처
function renderSvg(pattern: Pattern, style?: ChartStyle): string
```

`style` 생략 시 기본값 `'standard'`.

### 기호 세트 분리

기호 렌더링 로직을 데이터로 분리한다. 각 스타일은 `StitchKind → SVG 요소` 매핑 함수를 제공.

```typescript
// Stitch 전체를 받아서 cable.direction, cable.count 등 스티치별 데이터에 접근 가능
type SymbolRenderer = (stitch: Stitch, x: number, y: number, size: number) => string

type SymbolSet = Record<StitchKind, SymbolRenderer>
```

`SymbolRenderer`가 `Stitch` 객체를 직접 받으므로 cable의 `direction`/`count` 등 스티치별 데이터를 자연스럽게 처리할 수 있다. cable 특수 처리 불필요.

파일 구조:
- `src/renderer/symbols/standard.ts` — 국제 표준 기호 세트
- `src/renderer/symbols/jis.ts` — 일본식 기호 세트
- `src/renderer/symbols/index.ts` — 세트 조회

`src/renderer/svg.ts`는 기호 렌더링을 `SymbolSet`에 위임하고, 그리드 레이아웃만 담당.

---

## 2. 국제 표준(CYC) 기호 세트

| StitchKind | 기호 | SVG 구현 |
|-----------|------|----------|
| knit | □ | 빈 사각형 (흰 배경) |
| purl | • | 중앙 채움 원 |
| yarn-over | ○ | 중앙 빈 원 |
| k2tog | ╲ | 오른쪽 아래 사선 |
| ssk | ╱ | 왼쪽 아래 사선 |
| kfb | V | V자 폴리라인 |
| slip | — | 수평 가로선 |
| cable | ⤬ | 교차 곡선 (방향에 따라 다름) |
| m1l | ↖ | 왼쪽 위 화살표 |
| m1r | ↗ | 오른쪽 위 화살표 |
| p2tog | •╲ | 점 + 오른쪽 아래 사선 |
| ssp | •╱ | 점 + 왼쪽 아래 사선 |
| sk2p | ⋀ | 아래 화살표 + V |
| bind-off | × | X 교차선 |
| pick-up | ↑ | 위쪽 화살표 |

---

## 3. 일본식(JIS) 기호 세트

| StitchKind | 기호 | SVG 구현 |
|-----------|------|----------|
| knit | │ | 세로선 |
| purl | — | 가로선 |
| yarn-over | ○ | 빈 원 |
| k2tog | ⧹ | 오른쪽 사선 |
| ssk | ⧸ | 왼쪽 사선 |
| kfb | V | V자 |
| slip | → | 오른쪽 화살표 |
| cable | ⤬ | 교차선 |
| m1l | ∧ | 위 꺾쇠 |
| m1r | ∧ | 위 꺾쇠 |
| p2tog | •⧹ | 점 + 오른쪽 사선 |
| ssp | •⧸ | 점 + 왼쪽 사선 |
| sk2p | ⋏ | 하향 삼각 |
| bind-off | × | X |
| pick-up | ↑ | 위쪽 화살표 |

---

## 4. 줄글(Prose) 텍스트 렌더러

### API 변경

```typescript
type TextStyle = 'short' | 'prose'

// 기존 시그니처 유지 (하위 호환)
function renderText(pattern: Pattern, locale: 'ko' | 'en'): string
// 새 시그니처
function renderText(pattern: Pattern, locale: 'ko' | 'en', style?: TextStyle): string
```

`style` 생략 시 기본값 `'short'` (현재 동작 그대로).

### 출력 예시

**Korean prose:**
```
1단 (겉면): 겉뜨기 2코, 안뜨기 2코를 5번 반복합니다.
2단 (안면): 안뜨기 2코, 겉뜨기 2코를 5번 반복합니다.
```

**English prose:**
```
Row 1 (RS): Repeat knit 2, purl 2 a total of 5 times.
Row 2 (WS): Repeat purl 2, knit 2 a total of 5 times.
```

### 구현

줄글 렌더링은 `src/renderer/text.ts`에 prose 전용 함수를 추가. 기존 `renderPattern` 함수와 병렬로 `renderPatternProse` 함수 구현.

주요 차이:
- `short`: `(겉뜨기 2코, 안뜨기 2코) × 5회`
- `prose`: `겉뜨기 2코, 안뜨기 2코를 5번 반복합니다.`
- Row 헤더: `Row 1 (RS)` → `1단 (겉면)` (prose에서는 RS/WS를 겉면/안면으로 번역)

---

## 5. 기호 매핑 정확도

현재 SVG 렌더러의 기호들은 플레이스홀더 수준이다. 이번 작업에서:
- 기존 `renderCell`의 인라인 SVG 코드를 `SymbolSet`으로 이전
- 표준 기호 세트의 SVG를 표준에 맞게 구현
- 기존 테스트는 `<rect>`, `<circle>`, `<line>` 존재 여부만 확인하므로 기호 변경에 영향 없음

---

## 영향받는 파일

| 파일 | 변경 |
|------|------|
| `src/renderer/symbols/standard.ts` | 신규 — 국제 표준 기호 세트 |
| `src/renderer/symbols/jis.ts` | 신규 — 일본식 기호 세트 |
| `src/renderer/symbols/index.ts` | 신규 — 기호 세트 조회 |
| `src/renderer/svg.ts` | 리팩터 — renderCell을 SymbolSet에 위임, style 파라미터 추가 |
| `src/renderer/text.ts` | 확장 — prose 스타일 추가, style 파라미터 |
| `src/renderer/index.ts` | ChartStyle, TextStyle 타입 re-export |
| `src/index.ts` | 새 타입 export |
| `tests/renderer/svg.test.ts` | 수정 — 스타일별 테스트 추가 |
| `tests/renderer/text.test.ts` | 수정 — prose 스타일 테스트 추가 |

---

## 설계 원칙

- 하위 호환: 기존 `renderSvg(pattern)`, `renderText(pattern, locale)` 호출은 동일하게 동작
- DRY: 그리드 레이아웃 로직은 하나, 기호 세트만 교체
- 순수 함수 유지: 새 렌더러도 `(Pattern, options) → string`
- 데이터 주도: 기호를 코드가 아닌 데이터(SymbolSet)로 관리, 새 스타일 추가 용이
