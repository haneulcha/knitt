import { describe, it, expect } from 'vitest'
import { execSync } from 'node:child_process'

function run(args: string): { stdout: string; exitCode: number } {
  try {
    const stdout = execSync(`npx tsx src/cli.ts ${args}`, {
      cwd: '/Users/haneul/Projects/knitt',
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { stdout: stdout.trim(), exitCode: 0 }
  } catch (e: any) {
    return { stdout: (e.stdout ?? '').trim(), exitCode: e.status ?? 1 }
  }
}

describe('CLI', () => {
  describe('validate', () => {
    it('validates a correct pattern', () => {
      const { stdout, exitCode } = run('validate examples/rib-scarf.knit')
      expect(exitCode).toBe(0)
      expect(stdout).toContain('✓')
      expect(stdout).toContain('20코')
    })

    it('validates with --en flag', () => {
      const { stdout, exitCode } = run('validate examples/rib-scarf.knit --en')
      expect(exitCode).toBe(0)
      expect(stdout).toContain('valid')
      expect(stdout).toContain('20 sts')
    })

    it('exits 1 for missing file argument', () => {
      const { exitCode } = run('validate')
      expect(exitCode).toBe(1)
    })
  })

  describe('render', () => {
    it('renders text by default', () => {
      const { stdout, exitCode } = run('render examples/rib-scarf.knit')
      expect(exitCode).toBe(0)
      expect(stdout).toContain('Cast on:')
      expect(stdout).toContain('Row 1')
    })

    it('renders prose format', () => {
      const { stdout, exitCode } = run('render examples/rib-scarf.knit --format prose')
      expect(exitCode).toBe(0)
      expect(stdout).toContain('반복합니다')
    })

    it('renders chart to stdout', () => {
      const { stdout, exitCode } = run('render examples/rib-scarf.knit --format chart')
      expect(exitCode).toBe(0)
      expect(stdout).toContain('<svg')
    })

    it('renders jis chart to stdout', () => {
      const { stdout, exitCode } = run('render examples/rib-scarf.knit --format jis')
      expect(exitCode).toBe(0)
      expect(stdout).toContain('<svg')
    })

    it('renders English text', () => {
      const { stdout, exitCode } = run('render examples/rib-scarf.knit --en')
      expect(exitCode).toBe(0)
      expect(stdout).toContain('sts')
    })
  })

  describe('stats', () => {
    it('shows statistics', () => {
      const { stdout, exitCode } = run('stats examples/rib-scarf.knit')
      expect(exitCode).toBe(0)
      expect(stdout).toContain('2행')
      expect(stdout).toContain('40코')
      expect(stdout).toContain('knit: 20')
    })

    it('shows stats in English', () => {
      const { stdout, exitCode } = run('stats examples/rib-scarf.knit --en')
      expect(exitCode).toBe(0)
      expect(stdout).toContain('rows')
      expect(stdout).toContain('stitches')
    })
  })

  describe('help', () => {
    it('shows help text', () => {
      const { stdout, exitCode } = run('help')
      expect(exitCode).toBe(0)
      expect(stdout).toContain('knitt')
      expect(stdout).toContain('validate')
      expect(stdout).toContain('render')
      expect(stdout).toContain('stats')
    })
  })
})
