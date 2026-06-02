import type { CauseNode } from '../types'
import type { EditorNode } from '../components/CauseTreeEditor'

export function causeTreeToEditorNodes(
  causes: CauseNode[],
  parentId: string | null = null,
  depth = 1,
): EditorNode[] {
  return causes.flatMap(cause => [
    {
      id: cause.id,
      text: cause.text,
      parentId,
      depth,
      status: 'closed' as const,
      isActionableRootCause: cause.isActionableRootCause,
      ...(cause.groupId ? { groupId: cause.groupId } : {}),
      ...(cause.linkedToId ? { linkedToId: cause.linkedToId } : {}),
    },
    // Secondary nodes store no children — their children come from the primary
    ...(!cause.linkedToId ? causeTreeToEditorNodes(cause.children, cause.id, depth + 1) : []),
  ])
}
