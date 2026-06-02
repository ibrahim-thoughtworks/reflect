export type WhyAnswer = {
  text: string
  skipped: boolean
  isActionableRootCause: boolean
}

export type Problem = {
  id: string
  description: string
  whys: WhyAnswer[]
  createdAt: number
}
