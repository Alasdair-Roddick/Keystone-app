import { useEffect } from 'react'
import { useSessionStore } from '../state/session'

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

  if (!sessionId) {
    return null
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Top bar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-base-300">
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

      {/* Terminal placeholder */}
      <div className="flex-1 flex items-center justify-center text-base-content/40">
        <p>Terminal will render here</p>
      </div>
    </div>
  )
}
