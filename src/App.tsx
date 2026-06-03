import { useState } from 'react'
import Home from './pages/Home'
import AddProblem from './pages/AddProblem'
import ProblemDetail from './pages/ProblemDetail'
import SolveProblem from './pages/SolveProblem'
import { getProblems } from './store/problems'

type View = 'home' | 'add' | 'detail' | 'edit' | 'solve'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const goHome = () => setView('home')

  const goAdd = () => setView('add')

  const goDetail = (id: string) => {
    setSelectedId(id)
    setView('detail')
  }

  const goEdit = (id: string) => {
    setSelectedId(id)
    setView('edit')
  }

  const goSolve = (id: string) => {
    setSelectedId(id)
    setView('solve')
  }

  if (view === 'add') {
    return <AddProblem onSave={goSolve} onCancel={goHome} />
  }

  if (view === 'edit' && selectedId) {
    const problem = getProblems().find(p => p.id === selectedId)
    if (problem) {
      return (
        <AddProblem
          existingProblem={problem}
          onSave={goSolve}
          onCancel={() => goDetail(selectedId)}
        />
      )
    }
  }

  if (view === 'solve' && selectedId) {
    return <SolveProblem id={selectedId} onDone={goHome} />
  }

  if (view === 'detail' && selectedId) {
    return <ProblemDetail id={selectedId} onBack={goHome} onEdit={goEdit} />
  }

  return <Home onAddProblem={goAdd} onSelectProblem={goDetail} />
}
