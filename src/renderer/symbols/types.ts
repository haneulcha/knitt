import type { Stitch, StitchKind } from '../../domain/types.js'

export type SymbolRenderer = (stitch: Stitch, x: number, y: number, size: number) => string

export type SymbolSet = Record<StitchKind, SymbolRenderer>

export type ChartStyle = 'standard' | 'jis'
