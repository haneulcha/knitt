import type { SymbolSet, ChartStyle } from './types.js'
import { standardSymbols } from './standard.js'
import { jisSymbols } from './jis.js'

export type { SymbolRenderer, SymbolSet, ChartStyle } from './types.js'

const SYMBOL_SETS: Record<ChartStyle, SymbolSet> = {
  standard: standardSymbols,
  jis: jisSymbols,
}

export function getSymbolSet(style: ChartStyle): SymbolSet {
  return SYMBOL_SETS[style]
}
