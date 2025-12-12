import { useEffect } from 'react'
import { useSessionStore } from '../state/session'
import Terminal from '../components/Terminal'

export default function Session() {
  const sessionId = useSessionStore((s) => s.sessionId)
  const reset = useSessionStore((s) => s.reset)

  useEffect(() => {
    return () => {
      if (sessionId) {
        window.keystone.closeSession(sessionId)
      }
    }
  }, [sessionId])

  if (!sessionId) return null

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      {/* Top bar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-base-300 flex-shrink-0">
        <span className="text-sm text-base-content/60">
          Session active
        </span>

        <button
          className="btn btn-xs btn-ghost"
          onClick={reset}
        >
          Close
        </button>
      </div>

      {/* Terminal */}
      <div className="flex-1 min-h-0">
        <Terminal sessionId={sessionId} />
      </div>
    </div>
  )
}
