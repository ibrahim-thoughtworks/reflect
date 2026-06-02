type Props = {
  onAddProblem: () => void
  onSelectProblem: (id: string) => void
}

export default function Home({ onAddProblem, onSelectProblem: _onSelectProblem }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button onClick={onAddProblem} className="px-4 py-2 bg-indigo-600 text-white rounded">
        Add Problem
      </button>
    </div>
  )
}
