import '@testing-library/jest-dom'

// jsdom in this vitest version ships without a working localStorage — provide one
const store: Record<string, string> = {}

const localStorageMock: Storage = {
  getItem: (key) => store[key] ?? null,
  setItem: (key, value) => { store[key] = String(value) },
  removeItem: (key) => { delete store[key] },
  clear: () => { Object.keys(store).forEach((k) => delete store[k]) },
  get length() { return Object.keys(store).length },
  key: (index) => Object.keys(store)[index] ?? null,
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
})
