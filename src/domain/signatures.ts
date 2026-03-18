import type { Stitch, StitchKind, StitchSignature } from './types.js'

export const STITCH_SIGNATURES: Record<Exclude<StitchKind, 'cable'>, StitchSignature> = {
  knit:        { consumes: 1, produces: 1, delta: 0 },
  purl:        { consumes: 1, produces: 1, delta: 0 },
  'yarn-over': { consumes: 0, produces: 1, delta: 1 },
  k2tog:       { consumes: 2, produces: 1, delta: -1 },
  ssk:         { consumes: 2, produces: 1, delta: -1 },
  kfb:         { consumes: 1, produces: 2, delta: 1 },
  slip:        { consumes: 1, produces: 1, delta: 0 },
  m1l:         { consumes: 0, produces: 1, delta: 1 },
  m1r:         { consumes: 0, produces: 1, delta: 1 },
  p2tog:       { consumes: 2, produces: 1, delta: -1 },
  ssp:         { consumes: 2, produces: 1, delta: -1 },
  sk2p:        { consumes: 3, produces: 1, delta: -2 },
  'bind-off':  { consumes: 1, produces: 0, delta: -1 },
  'pick-up':   { consumes: 0, produces: 1, delta: 1 },
}

export function getSignature(stitch: Stitch): StitchSignature {
  if (stitch.kind === 'cable') {
    return { consumes: stitch.count, produces: stitch.count, delta: 0 }
  }
  return STITCH_SIGNATURES[stitch.kind]
}
