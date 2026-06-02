import { useState } from 'react'
import Home from './pages/Home'
import AddProblem from './pages/AddProblem'
import ProblemDetail from './pages/ProblemDetail'
import { getProblems } from './store/problems'

type View = 'home' | 'add' | 'detail' | 'edit'

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

  if (view === 'add') {
    return <AddProblem onDone={goHome} onCancel={goHome} />
  }

  if (view === 'edit' && selectedId) {
    const problem = getProblems().find(p => p.id === selectedId)
    if (problem) {
      return (
        <AddProblem
          existingProblem={problem}
          onDone={() => goDetail(selectedId)}
          onCancel={() => goDetail(selectedId)}
        />
      )
    }
  }

  if (view === 'detail' && selectedId) {
    return <ProblemDetail id={selectedId} onBack={goHome} onEdit={goEdit} />
  }

  return <Home onAddProblem={goAdd} onSelectProblem={goDetail} />
}
