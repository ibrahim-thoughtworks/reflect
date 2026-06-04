import { useState } from 'react'
import Home from './pages/Home'
import AddProblem from './pages/AddProblem'
import ProblemDetail from './pages/ProblemDetail'
import SolveProblem from './pages/SolveProblem'
import ComplexityMatrix from './pages/ComplexityMatrix'
import ApplyingSteps from './pages/ApplyingSteps'
import { getProblems } from './store/problems'

type View = 'home' | 'add' | 'detail' | 'edit' | 'solve' | 'matrix' | 'applying'

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

  const goMatrix = (id: string) => {
    setSelectedId(id)
    setView('matrix')
  }

  const goApplying = (id: string) => {
    setSelectedId(id)
    setView('applying')
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
    return <SolveProblem id={selectedId} onDone={goHome} onNext={goMatrix} />
  }

  if (view === 'matrix' && selectedId) {
    return <ComplexityMatrix id={selectedId} onDone={goApplying} />
  }

  if (view === 'applying' && selectedId) {
    return <ApplyingSteps id={selectedId} onDone={goDetail} onBack={goDetail} />
  }

  if (view === 'detail' && selectedId) {
    return <ProblemDetail id={selectedId} onBack={goHome} onEdit={goEdit} />
  }

  return <Home onAddProblem={goAdd} onSelectProblem={goDetail} />
}
