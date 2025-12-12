import React from 'react'
import { useSessionStore } from '../state/session'

export default function Home() {
  const startLocal = useSessionStore((s) => s.startLocal)
  const startRemote = useSessionStore((s) => s.startRemote)

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="w-full max-w-3xl px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-semibold tracking-tight">
            Keystone
          </h1>
          <p className="mt-3 text-base-content/60">
            A persistent SSH workspace
          </p>
        </div>

        {/* Session options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Local session */}
          <button
            onClick={startLocal}
            className="card bg-base-100 shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="card-body">
              <h2 className="card-title">Local</h2>
              <p className="text-base-content/70">
                Start a local terminal session
              </p>
            </div>
          </button>

          {/* Remote session (stubbed) */}
          <button
            onClick={() =>
              startRemote({
                hostId: 'example-host',
                name: 'example-server',
              })
            }
            className="card bg-base-100 shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="card-body">
              <h2 className="card-title">example-server</h2>
              <p className="text-base-content/70">
                Connect via SSH
              </p>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-sm text-base-content/40">
          Keystone is local-first and open-source.
        </div>
      </div>
    </div>
  )
}
