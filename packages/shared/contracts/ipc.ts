export type SessionStepId = 'init' | 'connect' | 'auth' | 'shell'

export type SessionProgressUpdate = {
  requestId: string
  step: SessionStepId
}

export type CreateSessionRequest =
  | { type: 'local'; requestId: string }
  | { type: 'remote'; hostId: string; requestId: string }

export type CreateSessionResponse =
  | { ok: true; sessionId: string }
  | { ok: false; error: string }

export type PasswordPromptData = {
  requestId: string
  host: string
  username: string
  prompt: string
}

// --------------------
// Host Types
// --------------------

export interface Host {
  id: string
  name: string
  host: string
  port: number
  username: string
  password?: string | null
  createdAt: number
  updatedAt: number
}

export interface CreateHostInput {
  name: string
  host: string
  port: number
  username: string
  password?: string | null
}

export interface UpdateHostInput {
  name?: string
  host?: string
  port?: number
  username?: string
  password?: string | null
}

// --------------------
// IPC Interface
// --------------------

export interface KeystoneIPC {
  // Session management
  createSession(req: CreateSessionRequest): Promise<CreateSessionResponse>
  writeToSession(sessionId: string, data: string): void
  resizeSession(sessionId: string, cols: number, rows: number): void
  closeSession(sessionId: string): void

  onSessionStatus(
    cb: (update: SessionProgressUpdate) => void
  ): () => void

  onSessionData(
    sessionId: string,
    cb: (data: string) => void
  ): () => void

  onPasswordPrompt(
    cb: (data: PasswordPromptData) => void
  ): () => void

  respondToPasswordPrompt(requestId: string, password: string | null): void

  // Host management
  getHosts(): Promise<Host[]>
  getHost(id: string): Promise<Host | null>
  createHost(input: CreateHostInput): Promise<Host>
  updateHost(id: string, input: UpdateHostInput): Promise<Host | null>
  deleteHost(id: string): Promise<boolean>
}
