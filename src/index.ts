export type {
  StitchKind,
  Stitch,
  Pattern,
  StitchSignature,
  ValidationError,
  Token,
  ParseError,
} from './domain/index.js'
export { STITCH_SIGNATURES, getSignature } from './domain/index.js'

export { parse } from './parser/index.js'
export { tokenize } from './parser/index.js'

export { ok, err, isOk, isErr, map, flatMap, collect } from './validator/index.js'
export type { Result } from './validator/index.js'
export { validateStitch, validateRow, validateBlock } from './validator/index.js'
export type { ValidationState } from './validator/index.js'

export { renderText } from './renderer/index.js'
export { computeStats } from './renderer/index.js'
export type { PatternStats } from './renderer/index.js'
