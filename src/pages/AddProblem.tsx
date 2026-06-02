import { useState } from 'react'
import WhyStep from '../components/WhyStep'
import type { WhyAnswer } from '../types'

const TOTAL_WHYS = 5

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=problem, 1-5=whys, 6=root cause selection

type Props = {
  onDone: () => void
  onCancel: () => void
}

type WizardState = {
  description: string
  whys: WhyAnswer[]
  currentInput: string
}

export default function AddProblem({ onDone, onCancel }: Props) {
  const [step, setStep] = useState<WizardStep>(0)
  const [state, setState] = useState<WizardState>({
    description: '',
    whys: [],
    currentInput: '',
  })

  const whyStep = step as number // 1-5 when in why phase

  function startWhys() {
    setStep(1)
    setState((s) => ({ ...s, currentInput: '' }))
  }

  function advance(answer: WhyAnswer) {
    const updatedWhys = [...state.whys, answer]
    const nextStep = (step + 1) as WizardStep
    setState((s) => ({ ...s, whys: updatedWhys, currentInput: '' }))
    setStep(nextStep)
  }

  function handleNext() {
    advance({ text: state.currentInput.trim(), skipped: false, isActionableRootCause: false })
  }

  function handleSkip() {
    advance({ text: '', skipped: true, isActionableRootCause: false })
  }

  // Step 6 — root cause selection (placeholder; Task 6 replaces this)
  if (step === 6) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg p-8">
          <p className="text-gray-500 text-sm">Root cause selection — coming in Task 6</p>
          <button onClick={onDone} className="mt-4 text-sm text-indigo-600 underline">
            Go home (temporary)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-lg p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold text-gray-800">
            {step === 0 ? "What's the problem?" : 'Five Whys'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-sm transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Step 0 — problem description */}
        {step === 0 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Describe the problem
              </label>
              <textarea
                autoFocus
                rows={4}
                value={state.description}
                onChange={(e) => setState((s) => ({ ...s, description: e.target.value }))}
                placeholder="e.g. The deployment failed and affected users for 20 minutes"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>
            <button
              onClick={startWhys}
              disabled={state.description.trim() === ''}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Start 5 Whys →
            </button>
          </div>
        )}

        {/* Steps 1–5 — why prompts */}
        {step >= 1 && step <= TOTAL_WHYS && (
          <WhyStep
            step={whyStep}
            total={TOTAL_WHYS}
            value={state.currentInput}
            onChange={(v) => setState((s) => ({ ...s, currentInput: v }))}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        )}
      </div>
    </div>
  )
}
