import { useEffect, useState } from 'react'
import { useSessionStore } from '../state/session'
import { motion } from 'framer-motion'

const steps = [
  'Initializing...',
  'Establishing connection...',
  'Authenticating...',
  'Starting shell...',
]

export default function Loading() {
  const target = useSessionStore((s) => s.target)
  const setActive = useSessionStore((s) => s.setActive)
  const setError = useSessionStore((s) => s.setError)
  const reset = useSessionStore((s) => s.reset)
  const [step, setStep] = useState(0)
  const [failed, setFailed] = useState<string | null>(null)

  useEffect(() => {
    // Animate through steps
    const interval = setInterval(() => {
      setStep((s) => (s < steps.length - 1 ? s + 1 : s))
    }, 800)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function create() {
      if (!target) return

      const res = await window.keystone.createSession(
        target.type === 'local'
          ? { type: 'local' }
          : { type: 'remote', hostId: target.hostId }
      )

      if (cancelled) return

      if (res.ok) {
        setActive(res.sessionId)
      } else {
        setFailed(res.error)
        setError(res.error)
      }
    }

    create()

    return () => {
      cancelled = true
    }
  }, [target, setActive, setError])

  const isRemote = target?.type === 'remote'

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
        className="relative z-10 text-center px-6"
      >
        {failed ? (
          // Error state
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-full bg-error/10 flex items-center justify-center mb-6">
              <svg className="w-10 h-10 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Connection Failed</h2>
            <p className="text-base-content/60 mb-6 max-w-sm">{failed}</p>
            <button onClick={reset} className="btn btn-primary">
              Back to Home
            </button>
          </motion.div>
        ) : (
          // Loading state
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-base-100 shadow-xl flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className={`text-3xl`}
              >
                {isRemote ? '🔌' : '💻'}
              </motion.div>
            </motion.div>

            <h2 className="text-2xl font-bold mb-2">
              {isRemote ? `Connecting to ${target.name}` : 'Starting Local Session'}
            </h2>

            <div className="h-6 mb-8">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-base-content/60"
              >
                {isRemote ? steps[step] : steps[Math.min(step, 1)]}
              </motion.p>
            </div>

            {/* Progress dots */}
            <div className="flex justify-center gap-2">
              {(isRemote ? steps : steps.slice(0, 2)).map((_, i) => (
                <motion.div
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i <= step ? 'bg-primary' : 'bg-base-content/20'
                  }`}
                  animate={i === step ? { scale: [1, 1.3, 1] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
