import Database from 'better-sqlite3'
import path from 'node:path'
import { app } from 'electron'

// --------------------
// Types
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
  id: string
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
// Database Setup
// --------------------

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (db) return db

  const dbPath = path.join(app.getPath('userData'), 'keystone.db')
  console.log('[db] Opening database at:', dbPath)

  db = new Database(dbPath)

  // Enable WAL mode for better performance
  db.pragma('journal_mode = WAL')

  // Create hosts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hosts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 22,
      username TEXT NOT NULL,
      password TEXT,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    )
  `)

  console.log('[db] Database initialized')

  return db
}

// --------------------
// Host Operations
// --------------------

export function getAllHosts(): Host[] {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM hosts ORDER BY name ASC')
  return stmt.all() as Host[]
}

export function getHostById(id: string): Host | null {
  const db = getDb()
  const stmt = db.prepare('SELECT * FROM hosts WHERE id = ?')
  return (stmt.get(id) as Host) || null
}

export function createHost(input: CreateHostInput): Host {
  const db = getDb()
  const now = Date.now()

  const stmt = db.prepare(`
    INSERT INTO hosts (id, name, host, port, username, password, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  stmt.run(
    input.id,
    input.name,
    input.host,
    input.port,
    input.username,
    input.password || null,
    now,
    now
  )

  return getHostById(input.id)!
}

export function updateHost(id: string, input: UpdateHostInput): Host | null {
  const db = getDb()
  const existing = getHostById(id)

  if (!existing) return null

  const updates: string[] = []
  const values: (string | number | null)[] = []

  if (input.name !== undefined) {
    updates.push('name = ?')
    values.push(input.name)
  }
  if (input.host !== undefined) {
    updates.push('host = ?')
    values.push(input.host)
  }
  if (input.port !== undefined) {
    updates.push('port = ?')
    values.push(input.port)
  }
  if (input.username !== undefined) {
    updates.push('username = ?')
    values.push(input.username)
  }
  if (input.password !== undefined) {
    updates.push('password = ?')
    values.push(input.password)
  }

  if (updates.length === 0) return existing

  updates.push('updatedAt = ?')
  values.push(Date.now())
  values.push(id)

  const stmt = db.prepare(`
    UPDATE hosts SET ${updates.join(', ')} WHERE id = ?
  `)

  stmt.run(...values)

  return getHostById(id)
}

export function deleteHost(id: string): boolean {
  const db = getDb()
  const stmt = db.prepare('DELETE FROM hosts WHERE id = ?')
  const result = stmt.run(id)
  return result.changes > 0
}

export function closeDb(): void {
  if (db) {
    db.close()
    db = null
    console.log('[db] Database closed')
  }
}
