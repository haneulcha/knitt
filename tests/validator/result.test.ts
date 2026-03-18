import { describe, it, expect } from 'vitest'
import { ok, err, isOk, isErr, map, flatMap, collect } from '../../src/validator/result.js'

describe('Result', () => {
  describe('ok / err', () => {
    it('ok wraps a value', () => {
      const r = ok(42)
      expect(r).toEqual({ ok: true, value: 42 })
    })

    it('err wraps an error', () => {
      const r = err('fail')
      expect(r).toEqual({ ok: false, error: 'fail' })
    })
  })

  describe('isOk / isErr', () => {
    it('isOk returns true for ok', () => {
      expect(isOk(ok(1))).toBe(true)
      expect(isOk(err('x'))).toBe(false)
    })

    it('isErr returns true for err', () => {
      expect(isErr(err('x'))).toBe(true)
      expect(isErr(ok(1))).toBe(false)
    })
  })

  describe('map', () => {
    it('maps over ok value', () => {
      expect(map(ok(2), (x) => x * 3)).toEqual(ok(6))
    })

    it('passes through err unchanged', () => {
      expect(map(err('fail'), (x: number) => x * 3)).toEqual(err('fail'))
    })
  })

  describe('flatMap', () => {
    it('chains ok results', () => {
      const double = (x: number) => ok(x * 2)
      expect(flatMap(ok(5), double)).toEqual(ok(10))
    })

    it('short-circuits on err', () => {
      const double = (x: number) => ok(x * 2)
      expect(flatMap(err('nope'), double)).toEqual(err('nope'))
    })

    it('propagates err from fn', () => {
      const fail = (_x: number) => err('inner fail')
      expect(flatMap(ok(5), fail)).toEqual(err('inner fail'))
    })
  })

  describe('collect', () => {
    it('collects all ok values', () => {
      expect(collect([ok(1), ok(2), ok(3)])).toEqual(ok([1, 2, 3]))
    })

    it('collects all errors', () => {
      expect(collect([ok(1), err('a'), ok(3), err('b')])).toEqual(err(['a', 'b']))
    })

    it('returns ok([]) for empty array', () => {
      expect(collect([])).toEqual(ok([]))
    })
  })
})
