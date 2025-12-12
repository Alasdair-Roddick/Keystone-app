import { create } from 'zustand'

type SessionTarget =
  | { type: 'local' }
  | { type: 'remote'; hostId: string; name: string }

type State = {
  status: 'idle' | 'creating' | 'active' | 'error'
  target?: SessionTarget
  sessionId?: string
  error?: string

  // actions
  startLocal: () => void
  startRemote: (host: { hostId: string; name: string }) => void
  setActive: (sessionId: string) => void
  setError: (error: string) => void
  reset: () => void
}

export const useSessionStore = create<State>((set) => ({
  status: 'idle',

  // ---- session creation ----

  startLocal() {
    set({
      status: 'creating',
      target: { type: 'local' },
      error: undefined,
    })
  },

  startRemote(host) {
    set({
      status: 'creating',
      target: {
        type: 'remote',
        hostId: host.hostId,
        name: host.name,
      },
      error: undefined,
    })
  },

  // ---- lifecycle transitions ----

  setActive(sessionId) {
    set({
      status: 'active',
      sessionId,
    })
  },

  setError(error) {
    set({
      status: 'error',
      error,
    })
  },

  reset() {
    set({
      status: 'idle',
      target: undefined,
      sessionId: undefined,
      error: undefined,
    })
  },
}))
