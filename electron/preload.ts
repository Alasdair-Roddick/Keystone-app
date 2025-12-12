import { contextBridge, ipcRenderer } from 'electron'
import { z } from 'zod'
import type {
  KeystoneIPC,
  CreateSessionRequest,
  CreateSessionResponse,
} from '../packages/shared/contracts/ipc'

// --------------------
// Validation Schemas
// --------------------

const CreateSessionRequestSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('local') }),
  z.object({
    type: z.literal('remote'),
    hostId: z.string().min(1),
  }),
])

const SessionIdSchema = z.string().min(1)

// --------------------
// IPC Implementation
// --------------------

const keystone: KeystoneIPC = {
  async createSession(req: CreateSessionRequest): Promise<CreateSessionResponse> {
    const parsed = CreateSessionRequestSchema.safeParse(req)
    if (!parsed.success) {
      return { ok: false, error: 'Invalid session request' }
    }

    return ipcRenderer.invoke('keystone:createSession', parsed.data)
  },

  writeToSession(sessionId, data) {
    if (!SessionIdSchema.safeParse(sessionId).success) return
    if (typeof data !== 'string') return

    ipcRenderer.send('keystone:write', { sessionId, data })
  },

  resizeSession(sessionId, cols, rows) {
    if (!SessionIdSchema.safeParse(sessionId).success) return
    if (!Number.isInteger(cols) || !Number.isInteger(rows)) return

    ipcRenderer.send('keystone:resize', { sessionId, cols, rows })
  },

  closeSession(sessionId) {
    if (!SessionIdSchema.safeParse(sessionId).success) return

    ipcRenderer.send('keystone:closeSession', sessionId)
  },

  onSessionData(sessionId, cb) {
    if (!SessionIdSchema.safeParse(sessionId).success) {
      return () => {}
    }

    const channel = `keystone:sessionData:${sessionId}`

    const handler = (_: unknown, data: string) => {
      if (typeof data === 'string') cb(data)
    }

    ipcRenderer.on(channel, handler)

    // unsubscribe function
    return () => {
      ipcRenderer.removeListener(channel, handler)
    }
  },
}

// --------------------
// Expose to Renderer
// --------------------

contextBridge.exposeInMainWorld('keystone', keystone)
