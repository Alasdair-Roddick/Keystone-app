export type CreateSessionRequest =
  | { type: 'local' }
  | { type: 'remote'; hostId: string }

export type CreateSessionResponse =
  | { ok: true; sessionId: string }
  | { ok: false; error: string }

export interface KeystoneIPC {
  createSession(req: CreateSessionRequest): Promise<CreateSessionResponse>
  writeToSession(sessionId: string, data: string): void
  resizeSession(sessionId: string, cols: number, rows: number): void
  closeSession(sessionId: string): void

  onSessionData(
    sessionId: string,
    cb: (data: string) => void
  ): () => void
}
