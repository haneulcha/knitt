# Knitt

뜨개질 패턴을 위한 DSL(Domain-Specific Language). 텍스트로 작성한 뜨개질 패턴을 파싱하고, 코 수 일관성을 검증하며, 다양한 형식으로 변환합니다.

## 설치

```bash
git clone https://github.com/haneulcha/knitt.git
cd knitt
npm install
```

## 빠른 시작

`.knit` 파일을 만들고:

```
---
name: 2x2 리브
cast-on: 20
---
Row 1 (RS): *k2, p2* x5
Row 2 (WS): *p2, k2* x5
```

CLI로 실행:

```bash
# 패턴 검증
npx tsx src/cli.ts validate my-pattern.knit

# 한국어 줄글로 변환
npx tsx src/cli.ts render my-pattern.knit --format prose

# SVG 차트 생성
npx tsx src/cli.ts render my-pattern.knit --format chart --out chart.svg
```

## CLI 명령어

### validate — 패턴 검증

```bash
npx tsx src/cli.ts validate <file> [--en]
```

패턴의 코 수 일관성을 검사합니다. 유효하면 코 수와 행 수를 표시하고, 문제가 있으면 위치와 함께 에러 메시지를 출력합니다.

```
$ npx tsx src/cli.ts validate examples/rib-scarf.knit
✓ 패턴이 유효합니다 (20코, 2행)
```

### render — 렌더링

```bash
npx tsx src/cli.ts render <file> [--format <fmt>] [--out <file>] [--en]
```

| 포맷 | 설명 | 출력 |
|------|------|------|
| `text` | 약어 텍스트 (기본) | 터미널 |
| `prose` | 자연어 줄글 | 터미널 |
| `chart` | SVG 차트 (국제 표준) | `--out` 또는 stdout |
| `jis` | SVG 차트 (일본식) | `--out` 또는 stdout |

```bash
# 한국어 텍스트 (기본)
npx tsx src/cli.ts render examples/rib-scarf.knit

# 영어 줄글
npx tsx src/cli.ts render examples/rib-scarf.knit --format prose --en

# 국제 표준 SVG 차트
npx tsx src/cli.ts render examples/rib-scarf.knit --format chart --out chart.svg

# 일본식 SVG 차트
npx tsx src/cli.ts render examples/rib-scarf.knit --format jis --out chart-jis.svg
```

### stats — 통계

```bash
npx tsx src/cli.ts stats <file> [--en]
```

```
$ npx tsx src/cli.ts stats examples/rib-scarf.knit
패턴: 2x2 리브 스카프
총 2행, 40코
  knit: 20
  purl: 20
```

### help — 도움말

```bash
npx tsx src/cli.ts help
```

## DSL 문법

### 패턴 파일 (.knit)

```
---
name: 패턴 이름
cast-on: 20
gauge: 20sts x 28rows / 10cm
yarn: 4ply wool
---
// 주석
Row 1 (RS): k2, p2, *k2, p2* x4
Row 2 (WS): *p2, k2* x5
```

- `---`로 감싼 메타데이터 헤더 (`cast-on` 필수, 나머지 선택)
- `//`로 시작하는 줄 주석
- `Row N (RS|WS):` 행 헤더

### 스티치 표기

| 표기 | 의미 | 코 수 변화 |
|------|------|-----------|
| `k` / `kN` | 겉뜨기 | ±0 |
| `p` / `pN` | 안뜨기 | ±0 |
| `yo` | 걸기코 | +1 |
| `k2tog` | 오른코 줄이기 | -1 |
| `ssk` | 왼코 줄이기 | -1 |
| `kfb` | 앞뒤 겉뜨기 | +1 |
| `sl` / `slN` | 걸러뜨기 | ±0 |
| `C{N}F` / `C{N}B` | 케이블 | ±0 |
| `m1l` | 왼쪽 늘리기 | +1 |
| `m1r` | 오른쪽 늘리기 | +1 |
| `p2tog` | 안뜨기 오른코 줄이기 | -1 |
| `ssp` | 안뜨기 왼코 줄이기 | -1 |
| `sk2p` | 중앙 줄이기 (3코→1코) | -2 |
| `bo` / `boN` | 코 마무리 | -1 |
| `pu` / `puN` | 코 줍기 | +1 |

### 반복

```
*k2, p2* x5        — 겉2, 안2를 5번 반복
*k2, *p1, yo* x2* x3  — 중첩 반복 가능
```

## 출력 예시

### 텍스트 (short)

```
Cast on: 20코
Row 1 (RS): (겉뜨기 2코, 안뜨기 2코) × 5회
Row 2 (WS): (안뜨기 2코, 겉뜨기 2코) × 5회
```

### 줄글 (prose)

```
20코를 만듭니다.
1단 (겉면): 겉뜨기 2코, 안뜨기 2코를 5번 반복합니다.
2단 (안면): 안뜨기 2코, 겉뜨기 2코를 5번 반복합니다.
```

## 개발

```bash
npm test          # 테스트 실행 (154개)
npm run build     # TypeScript 컴파일
npx tsx demo.ts   # 데모 실행
```

## 기술 스택

- TypeScript (strict mode), Node.js, Vitest
- 외부 의존성 없음 — 파서, Result 타입, CLI 모두 직접 구현
- 함수형 프로그래밍: 순수 함수, 불변 데이터, `throw` 금지, `any` 금지

## 라이선스

MIT
