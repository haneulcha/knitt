import type { PatternMetadata, MetadataError } from '../domain/types.js'
import type { Result } from '../validator/result.js'
import { ok, err } from '../validator/result.js'

export function parseMetadata(
  input: string,
): Result<{ metadata: PatternMetadata | null; rest: string }, MetadataError> {
  const trimmed = input.trimStart()
  if (!trimmed.startsWith('---')) {
    return ok({ metadata: null, rest: input })
  }

  const lines = trimmed.split('\n')
  let closingIndex = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]!.trim() === '---') {
      closingIndex = i
      break
    }
  }

  if (closingIndex === -1) {
    return err({ message: 'Missing closing --- in metadata header', line: 1 })
  }

  const headerLines = lines.slice(1, closingIndex)
  let name: string | undefined
  let castOn: number | undefined
  let gauge: string | undefined
  let yarn: string | undefined

  for (let i = 0; i < headerLines.length; i++) {
    const line = headerLines[i]!.trim()
    if (line === '') continue
    const colonIndex = line.indexOf(':')
    if (colonIndex === -1) continue
    const key = line.slice(0, colonIndex).trim()
    const value = line.slice(colonIndex + 1).trim()

    switch (key) {
      case 'name': name = value; break
      case 'cast-on':
        castOn = parseInt(value, 10)
        if (Number.isNaN(castOn)) {
          return err({ message: `cast-on must be a number, got '${value}'`, line: i + 2 })
        }
        break
      case 'gauge': gauge = value; break
      case 'yarn': yarn = value; break
    }
  }

  if (castOn === undefined) {
    return err({ message: 'Missing required field: cast-on', line: 1 })
  }

  const rest = lines.slice(closingIndex + 1).join('\n').trimStart()
  return ok({ metadata: { name, castOn, gauge, yarn }, rest })
}
