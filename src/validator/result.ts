export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error })

export const isOk = <T, E>(r: Result<T, E>): r is { ok: true; value: T } => r.ok
export const isErr = <T, E>(r: Result<T, E>): r is { ok: false; error: E } => !r.ok

export function map<T, U, E>(r: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return r.ok ? ok(fn(r.value)) : r
}

export function flatMap<T, U, E>(r: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return r.ok ? fn(r.value) : r
}

export function collect<T, E>(results: Result<T, E>[]): Result<T[], E[]> {
  const values: T[] = []
  const errors: E[] = []

  for (const r of results) {
    if (r.ok) {
      values.push(r.value)
    } else {
      errors.push(r.error)
    }
  }

  return errors.length > 0 ? err(errors) : ok(values)
}
