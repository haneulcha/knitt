# Phase 1: CLI Tool — Design Spec

## 목표

`knitt` CLI 도구를 만들어 터미널에서 `.knit` 파일을 검증, 렌더링, 통계 조회할 수 있게 한다.

## 명령어

```
knitt validate <file>         — 패턴 검증
knitt render <file> [options] — 포맷 변환 출력
knitt stats <file>            — 통계 출력
knitt help                    — 도움말
```

### knitt validate

```bash
$ knitt validate examples/rib-scarf.knit
✓ 패턴이 유효합니다 (20코, 2행)

$ knitt validate bad.knit
✗ 1단 2번째 위치: 3코가 필요하지만 1코만 남아있습니다
```

- 성공 시 exit code 0, 실패 시 exit code 1
- `--en` 플래그로 영어 출력

### knitt render

```bash
$ knitt render examples/rib-scarf.knit
# 기본: short 텍스트 (한국어)

$ knitt render examples/rib-scarf.knit --format prose
# 줄글 출력

$ knitt render examples/rib-scarf.knit --format chart --out chart.svg
# SVG 차트 파일 생성

$ knitt render examples/rib-scarf.knit --format jis --out chart-jis.svg
# JIS 스타일 SVG 차트

$ knitt render examples/rib-scarf.knit --en
# 영어 출력
```

옵션:
- `--format`: `text` (기본) | `prose` | `chart` | `jis`
- `--out <file>`: SVG 출력 파일 (chart/jis 포맷 시 필수)
- `--en`: 영어 출력

### knitt stats

```bash
$ knitt stats examples/rib-scarf.knit
패턴: 2x2 리브 스카프
총 2행, 40코
  knit: 20
  purl: 20
```

## 구현

- `src/cli.ts` — CLI 진입점, process.argv 파싱
- `package.json`에 `"bin": { "knitt": "dist/cli.js" }` 추가
- 외부 의존성 없음 (직접 argv 파싱)
- 에러 메시지는 `formatValidationErrors` 등 기존 포매터 사용

## 파일 구조

```
src/
  cli.ts    — CREATE: CLI 진입점
```
