import { describe, it, expect, beforeEach } from 'vitest'
import { getProblems, saveProblem } from './problems'
import type { Problem } from '../types'

const makeProblem = (overrides: Partial<Problem> = {}): Problem => ({
  id: 'test-id',
  description: 'Test problem',
  whys: [],
  createdAt: 1000,
  ...overrides,
})

describe('getProblems', () => {
  beforeEach(() => localStorage.clear())

  it('returns empty array when storage is empty', () => {
    expect(getProblems()).toEqual([])
  })

  it('returns empty array when storage contains invalid JSON', () => {
    localStorage.setItem('reflect_problems', 'not-json')
    expect(getProblems()).toEqual([])
  })
})

describe('saveProblem', () => {
  beforeEach(() => localStorage.clear())

  it('saves a problem and retrieves it', () => {
    const p = makeProblem()
    saveProblem(p)
    expect(getProblems()).toEqual([p])
  })

  it('appends without overwriting existing problems', () => {
    const p1 = makeProblem({ id: 'a', description: 'First' })
    const p2 = makeProblem({ id: 'b', description: 'Second' })
    saveProblem(p1)
    saveProblem(p2)
    const result = getProblems()
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(p1)
    expect(result[1]).toEqual(p2)
  })

  it('preserves whys and root cause selections on round-trip', () => {
    const p = makeProblem({
      whys: [
        { text: 'Because X', skipped: false, isActionableRootCause: true },
        { text: '', skipped: true, isActionableRootCause: false },
      ],
    })
    saveProblem(p)
    expect(getProblems()[0].whys).toEqual(p.whys)
  })
})
