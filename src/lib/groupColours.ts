export type GroupColour = {
  bg: string
  border: string
  text: string
  ring: string
}

export const GROUP_COLOURS: GroupColour[] = [
  { bg: 'bg-violet-50',  border: 'border-violet-400',  text: 'text-violet-800',  ring: 'ring-violet-400'  },
  { bg: 'bg-cyan-50',    border: 'border-cyan-400',    text: 'text-cyan-800',    ring: 'ring-cyan-400'    },
  { bg: 'bg-rose-50',    border: 'border-rose-400',    text: 'text-rose-800',    ring: 'ring-rose-400'    },
  { bg: 'bg-emerald-50', border: 'border-emerald-400', text: 'text-emerald-800', ring: 'ring-emerald-400' },
  { bg: 'bg-orange-50',  border: 'border-orange-400',  text: 'text-orange-800',  ring: 'ring-orange-400'  },
  { bg: 'bg-pink-50',    border: 'border-pink-400',    text: 'text-pink-800',    ring: 'ring-pink-400'    },
]

export function groupColour(groupId: string, allGroupIds: string[]): GroupColour {
  const idx = allGroupIds.indexOf(groupId)
  return GROUP_COLOURS[Math.max(idx, 0) % GROUP_COLOURS.length]
}

// Returns all unique groupIds from a flat node list, in insertion order.
export function collectGroupIds<T extends { groupId?: string }>(nodes: T[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const n of nodes) {
    if (n.groupId && !seen.has(n.groupId)) {
      seen.add(n.groupId)
      result.push(n.groupId)
    }
  }
  return result
}
