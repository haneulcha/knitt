import type { Stitch, ValidationError } from '../domain/types.js'
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
