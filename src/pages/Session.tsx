import { useEffect, useState } from 'react'
import { useSessionStore } from '../state/session'
import Terminal from '../components/Terminal'
import { motion, AnimatePresence } from 'framer-motion'
import { Home, Terminal as TerminalIcon, Server, X } from 'lucide-react'

const SignalIcon = () => (
  <span className="relative flex h-2 w-2">
    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
    <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
  </span>
)

export default function Session() {
  const sessionId = useSessionStore((s) => s.sessionId)
  const target = useSessionStore((s) => s.target)
  const reset = useSessionStore((s) => s.reset)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    return () => {
      if (sessionId) {
        window.keystone.closeSession(sessionId)
      }
    }
  }, [sessionId])

  if (!sessionId) return null

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const isRemote = target?.type === 'remote'
  const sessionName = isRemote ? target.name : 'Local Terminal'

  const handleClose = () => {
    if (elapsed > 5) {
      setShowCloseConfirm(true)
    } else {
      reset()
    }
  }

  return (
    <div className="h-screen bg-base-200 flex flex-col overflow-hidden">
      {/* Top bar */}
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="h-12 px-4 flex items-center justify-between bg-base-100 border-b border-base-300 flex-shrink-0 shadow-sm"
      >
        {/* Left section - Session info */}
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClose}
            className="btn btn-ghost btn-sm btn-square"
            title="Back to home"
          >
            <Home className="w-4 h-4" />
          </motion.button>

          <div className="h-6 w-px bg-base-300" />

          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isRemote ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
              {isRemote ? <Server className="w-4 h-4" /> : <TerminalIcon className="w-4 h-4" />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-tight">{sessionName}</span>
              {isRemote && (
                <span className="text-xs text-base-content/50 font-mono leading-tight">
                  {target.hostId.slice(0, 8)}...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center section - Status */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-base-200">
          <SignalIcon />
          <span className="text-xs font-medium text-base-content/70">Connected</span>
          <span className="text-xs text-base-content/40">•</span>
          <span className="text-xs font-mono text-base-content/50">{formatTime(elapsed)}</span>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClose}
            className="btn btn-ghost btn-sm gap-2"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">End Session</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Terminal area */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className="flex-1 min-h-0 p-2 sm:p-3"
      >
        <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl ring-1 ring-base-content/5">
          <Terminal sessionId={sessionId} />
        </div>
      </motion.div>

      {/* Bottom status bar */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 300, damping: 30 }}
        className="h-8 px-4 flex items-center justify-between bg-base-100 border-t border-base-300 flex-shrink-0 text-xs"
      >
        <div className="flex items-center gap-4 text-base-content/50">
          <span className="font-mono">Session: {sessionId.slice(0, 8)}</span>
        </div>
        <div className="flex items-center gap-4 text-base-content/50">
          <kbd className="kbd kbd-xs">⌘</kbd>
          <span>+ scroll to zoom</span>
        </div>
      </motion.div>

      {/* Close confirmation modal */}
      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-2xl shadow-2xl p-6 max-w-sm mx-4"
            >
              <h3 className="text-lg font-semibold mb-2">End Session?</h3>
              <p className="text-base-content/60 mb-6">
                You've been connected for {formatTime(elapsed)}. Are you sure you want to disconnect?
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowCloseConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-error"
                  onClick={reset}
                >
                  End Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
