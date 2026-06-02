type Props = {
  onDone: () => void
  onCancel: () => void
}

export default function AddProblem({ onCancel }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <p className="text-gray-500">Add Problem — coming soon</p>
      <button onClick={onCancel} className="mt-4 text-sm text-gray-400 underline">Cancel</button>
    </div>
  )
}
