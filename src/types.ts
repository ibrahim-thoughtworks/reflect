export type CauseNode = {
  id: string
  text: string
  isActionableRootCause: boolean
  children: CauseNode[]
}

export type Problem = {
  id: string
  description: string
  causes: CauseNode[]
  createdAt: number
}
