import { useEffect } from 'react'
import { useSessionStore } from '../state/session'

export default function Loading() {
  const target = useSessionStore((s) => s.target)
  const setActive = useSessionStore((s) => s.setActive)
  const setError = useSessionStore((s) => s.setError)

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
        setError(res.error)
      }
    }

    create()

    return () => {
      cancelled = true
    }
  }, [target, setActive, setError])

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="text-center">
        <span className="loading loading-spinner loading-lg"></span>
        <p className="mt-6 text-base-content/70">
          {target?.type === 'local'
            ? 'Starting local session…'
            : `Connecting to ${target?.name}…`}
        </p>
      </div>
    </div>
  )
}
