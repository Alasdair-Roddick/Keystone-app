import { useEffect, useMemo, useState } from 'react'
import { useSessionStore } from '../state/session'
import { motion } from 'framer-motion'
import { Terminal, Wifi, Shield, CheckCircle2, XCircle, ArrowLeft, Loader2 } from 'lucide-react'
import type { SessionStepId } from '../../packages/shared/contracts/ipc'

type Step = {
  id: SessionStepId
  label: string
  icon: typeof Terminal
}

const localSteps: Step[] = [
  { id: 'init', label: 'Initializing', icon: Terminal },
  { id: 'shell', label: 'Starting shell', icon: CheckCircle2 },
]

const remoteSteps: Step[] = [
  { id: 'init', label: 'Initializing', icon: Terminal },
  { id: 'connect', label: 'Connecting', icon: Wifi },
  { id: 'auth', label: 'Authenticating', icon: Shield },
  { id: 'shell', label: 'Starting shell', icon: CheckCircle2 },
]

const generateRequestId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

export default function Loading() {
  const target = useSessionStore((s) => s.target)
  const setActive = useSessionStore((s) => s.setActive)
  const setError = useSessionStore((s) => s.setError)
  const reset = useSessionStore((s) => s.reset)
  const [currentStep, setCurrentStep] = useState(0)
  const [failed, setFailed] = useState<string | null>(null)
  const requestId = useMemo(() => {
    const fingerprint =
      target?.type === 'remote'
        ? `${target.type}:${target.hostId}`
        : target?.type ?? 'none'
    return `${fingerprint}:${generateRequestId()}`
  }, [target])

  const isRemote = target?.type === 'remote'
  const steps = isRemote ? remoteSteps : localSteps

  useEffect(() => {
    setCurrentStep(0)
    setFailed(null)
  }, [target, isRemote])

  useEffect(() => {
    const unsubscribe = window.keystone.onSessionStatus((update) => {
      if (update.requestId !== requestId) return

      const index = steps.findIndex((step) => step.id === update.step)
      if (index === -1) return
      setCurrentStep((prev) => (index > prev ? index : prev))
    })

    return unsubscribe
  }, [requestId, steps])

  useEffect(() => {
    if (!target) return

    let cancelled = false

    async function create() {
      try {
        const res = await window.keystone.createSession(
          target.type === 'local'
            ? { type: 'local', requestId }
            : { type: 'remote', hostId: target.hostId, requestId }
        )

        if (cancelled) return

        if (res.ok) {
          setCurrentStep(steps.length - 1)
          // Brief delay to show completion before transitioning
          setTimeout(() => {
            if (!cancelled) setActive(res.sessionId)
          }, 300)
        } else {
          setFailed(res.error)
          setError(res.error)
        }
      } catch (err) {
        if (cancelled) return
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Failed to create session'
        setFailed(message)
        setError(message)
      }
    }

    create()

    return () => {
      cancelled = true
    }
  }, [target, requestId, setActive, setError, steps.length])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-300 via-base-200 to-base-300 relative overflow-hidden">
      {/* Animated background circles */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-primary/20 blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-secondary/20 blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {failed ? (
          // Error state
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-base-100 rounded-2xl shadow-2xl p-8"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mb-6">
                <XCircle className="w-8 h-8 text-error" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
              <p className="text-base-content/60 mb-6">{failed}</p>
              <button onClick={reset} className="btn btn-primary gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </button>
            </div>
          </motion.div>
        ) : (
          // Loading state with DaisyUI steps
          <div className="bg-base-100 rounded-2xl shadow-2xl p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center"
              >
                <Loader2 className="w-8 h-8 text-primary" />
              </motion.div>
              <h2 className="text-xl font-bold">
                {isRemote ? `Connecting to ${target?.name}` : 'Starting Local Session'}
              </h2>
            </div>

            {/* DaisyUI Steps - Vertical */}
            <ul className="steps steps-vertical w-full">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isComplete = index < currentStep
                const isCurrent = index === currentStep
                const isPending = index > currentStep

                return (
                  <li
                    key={step.id}
                    className={`step ${isComplete || isCurrent ? 'step-primary' : ''}`}
                    data-content={isComplete ? '✓' : undefined}
                  >
                    <div className="flex items-center gap-3 py-2">
                      <div className={`
                        p-2 rounded-lg transition-colors
                        ${isComplete ? 'bg-primary/10 text-primary' : ''}
                        ${isCurrent ? 'bg-primary/20 text-primary' : ''}
                        ${isPending ? 'bg-base-200 text-base-content/30' : ''}
                      `}>
                        {isCurrent ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Loader2 className="w-4 h-4" />
                          </motion.div>
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`
                        font-medium transition-colors
                        ${isComplete ? 'text-primary' : ''}
                        ${isCurrent ? 'text-base-content' : ''}
                        ${isPending ? 'text-base-content/40' : ''}
                      `}>
                        {step.label}
                        {isCurrent && (
                          <span className="loading loading-dots loading-xs ml-2"></span>
                        )}
                      </span>
                    </div>
                  </li>
                )
              })}
            </ul>

            {/* Progress bar */}
            <div className="mt-6">
              <progress
                className="progress progress-primary w-full"
                value={(currentStep + 1) * (100 / steps.length)}
                max="100"
              ></progress>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
