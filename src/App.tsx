import { useState } from 'react'
import Home from './pages/Home'
import AddProblem from './pages/AddProblem'
import ProblemDetail from './pages/ProblemDetail'

type View = 'home' | 'add' | 'detail'

export default function App() {
  const [view, setView] = useState<View>('home')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const goHome = () => setView('home')

  const goAdd = () => setView('add')

  const goDetail = (id: string) => {
    setSelectedId(id)
    setView('detail')
  }

  if (view === 'add') return <AddProblem onDone={goHome} onCancel={goHome} />
  if (view === 'detail' && selectedId) return <ProblemDetail id={selectedId} onBack={goHome} />
  return <Home onAddProblem={goAdd} onSelectProblem={goDetail} />
}
