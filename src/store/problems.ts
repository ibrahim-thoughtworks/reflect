import type { Problem } from '../types'

const STORAGE_KEY = 'reflect_problems'

export function getProblems(): Problem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Problem[]) : []
  } catch {
    return []
  }
}

export function saveProblem(problem: Problem): void {
  const existing = getProblems()
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, problem]))
}
