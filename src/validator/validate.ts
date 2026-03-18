import type { Stitch, Pattern, ValidationError } from '../domain/types.js'
import type { Result } from './result.js'
import { ok, err } from './result.js'
import { getSignature } from '../domain/signatures.js'

export type ValidationState = {
  readonly currentCount: number
  readonly rowNumber: number
}

export function validateStitch(
  stitch: Stitch,
  state: ValidationState,
  position: number,
): Result<ValidationState, ValidationError> {
  const sig = getSignature(stitch)

  if (sig.consumes > state.currentCount) {
    return err({
      kind: 'insufficient-stitches',
      needed: sig.consumes,
      available: state.currentCount,
      location: { row: state.rowNumber, position },
    })
  }

  return ok({
    currentCount: state.currentCount + sig.delta,
    rowNumber: state.rowNumber,
  })
}

// Internal state for row-level validation
// remaining: stitches left on left needle (decreases by consumes)
// output: stitches produced on right needle (increases by produces)
type RowState = {
  readonly remaining: number
  readonly output: number
  readonly rowNumber: number
}

function validatePatternRow(
  pattern: Pattern,
  state: RowState,
  position: number,
): Result<RowState, ValidationError> {
  switch (pattern.kind) {
    case 'stitch': {
      const sig = getSignature(pattern.value)
      if (sig.consumes > state.remaining) {
        return err({
          kind: 'insufficient-stitches',
          needed: sig.consumes,
          available: state.remaining,
          location: { row: state.rowNumber, position },
        })
      }
      return ok({
        remaining: state.remaining - sig.consumes,
        output: state.output + sig.produces,
        rowNumber: state.rowNumber,
      })
    }

    case 'repeat': {
      let current = state
      for (let t = 0; t < pattern.times; t++) {
        for (let i = 0; i < pattern.body.length; i++) {
          const result = validatePatternRow(pattern.body[i]!, current, position + i)
          if (!result.ok) return result
          current = result.value
        }
      }
      return ok(current)
    }

    default:
      return ok(state)
  }
}

export function validateRow(
  row: Pattern & { kind: 'row' },
  initialCount: number,
): Result<number, ValidationError> {
  let state: RowState = { remaining: initialCount, output: 0, rowNumber: row.rowNumber ?? 0 }

  for (let i = 0; i < row.stitches.length; i++) {
    const result = validatePatternRow(row.stitches[i]!, state, i)
    if (!result.ok) return result
    state = result.value
  }

  return ok(state.output)
}

export function validateBlock(
  block: Pattern & { kind: 'block' },
): Result<void, ValidationError[]> {
  const errors: ValidationError[] = []
  let currentCount = block.castOn

  for (const row of block.rows) {
    if (row.kind !== 'row') continue
    const typedRow = row as Pattern & { kind: 'row' }
    const result = validateRow(typedRow, currentCount)
    if (result.ok) {
      currentCount = result.value
    } else {
      errors.push(result.error)
    }
  }

  return errors.length > 0 ? err(errors) : ok(undefined)
}
