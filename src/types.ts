export type CauseNode = {
  id: string
  text: string
  isActionableRootCause: boolean
  children: CauseNode[]
  groupId?: string      // set on all instances of a linked group
  linkedToId?: string   // set on secondary instances; primary holds real children
}

export type Problem = {
  id: string
  description: string
  causes: CauseNode[]
  createdAt: number
}
