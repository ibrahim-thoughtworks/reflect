import { describe, it, expect, beforeEach } from 'vitest'
import { getProblems, saveProblem } from './problems'
import type { Problem, CauseNode } from '../types'

const makeLeaf = (id: string, text: string, isActionableRootCause = false): CauseNode => ({
  id,
  text,
  isActionableRootCause,
  children: [],
})

const makeProblem = (overrides: Partial<Problem> = {}): Problem => ({
  id: 'test-id',
  description: 'Test problem',
  causes: [],
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

  it('preserves nested CauseNode tree on round-trip', () => {
    const child = makeLeaf('c2', 'no interest', true)
    const root = { ...makeLeaf('c1', 'lazy to read'), children: [child] }
    const p = makeProblem({ causes: [root] })
    saveProblem(p)
    const saved = getProblems()[0]
    expect(saved.causes[0].text).toBe('lazy to read')
    expect(saved.causes[0].children[0].text).toBe('no interest')
    expect(saved.causes[0].children[0].isActionableRootCause).toBe(true)
  })

  it('preserves multiple root-level causes', () => {
    const p = makeProblem({
      causes: [makeLeaf('c1', 'cause one'), makeLeaf('c2', 'cause two')],
    })
    saveProblem(p)
    expect(getProblems()[0].causes).toHaveLength(2)
  })

  it('preserves groupId and linkedToId on secondary nodes round-trip', () => {
    const primary: CauseNode = {
      id: 'b-primary',
      text: 'B',
      isActionableRootCause: false,
      children: [makeLeaf('e', 'E')],
      groupId: 'group-b',
    }
    const secondary: CauseNode = {
      id: 'b-secondary',
      text: 'B',
      isActionableRootCause: false,
      children: [],
      groupId: 'group-b',
      linkedToId: 'b-primary',
    }
    const p = makeProblem({ causes: [primary, secondary] })
    saveProblem(p)
    const saved = getProblems()[0]
    expect(saved.causes[0].groupId).toBe('group-b')
    expect(saved.causes[0].linkedToId).toBeUndefined()
    expect(saved.causes[1].groupId).toBe('group-b')
    expect(saved.causes[1].linkedToId).toBe('b-primary')
    expect(saved.causes[1].children).toHaveLength(0)
  })
})
