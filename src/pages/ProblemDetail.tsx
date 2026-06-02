type Props = {
  id: string
  onBack: () => void
}

export default function ProblemDetail({ id: _id, onBack }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <p className="text-gray-500">Problem Detail — coming soon</p>
      <button onClick={onBack} className="mt-4 text-sm text-gray-400 underline">Back</button>
    </div>
  )
}
