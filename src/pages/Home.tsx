import { useState, useEffect } from 'react'
import { useSessionStore } from '../state/session'
import HostManager from '../components/HostManager'
import type { Host } from '../../packages/shared/contracts/ipc'
import { motion, AnimatePresence } from 'framer-motion'

// Icons as simple SVG components
const TerminalIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
)

const ServerIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
)

const PlusIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
  </svg>
)

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
)

const SignalIcon = ({ connected }: { connected?: boolean }) => (
  <svg className={`w-4 h-4 ${connected ? 'text-success' : 'text-base-content/30'}`} fill="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="3" />
  </svg>
)

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
}

const cardHover = {
  scale: 1.02,
  transition: { type: 'spring', stiffness: 400, damping: 17 },
}

const cardTap = {
  scale: 0.98,
}

export default function Home() {
  const startLocal = useSessionStore((s) => s.startLocal)
  const startRemote = useSessionStore((s) => s.startRemote)

  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)
  const [managerOpen, setManagerOpen] = useState(false)

  const loadHosts = async () => {
    setLoading(true)
    const data = await window.keystone.getHosts()
    setHosts(data)
    setLoading(false)
  }

  useEffect(() => {
    loadHosts()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-300 via-base-200 to-base-300 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* Settings button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute top-6 right-6 btn btn-ghost btn-circle"
        onClick={() => setManagerOpen(true)}
        whileHover={{ rotate: 90 }}
        whileTap={{ scale: 0.9 }}
      >
        <SettingsIcon />
      </motion.button>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-6"
          >
            <motion.span
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="text-4xl"
            >
              🔑
            </motion.span>
          </motion.div>

          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Keystone
          </h1>
          <p className="mt-4 text-lg text-base-content/60 max-w-md mx-auto">
            Your secure gateway to local and remote terminals
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-4xl"
        >
          {/* Section Label */}
          <motion.div variants={itemVariants} className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-base-content/10" />
            <span className="text-xs font-medium uppercase tracking-wider text-base-content/40">
              Quick Connect
            </span>
            <div className="h-px flex-1 bg-base-content/10" />
          </motion.div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Local Terminal Card */}
            <motion.button
              variants={itemVariants}
              whileHover={cardHover}
              whileTap={cardTap}
              onClick={startLocal}
              className="group relative overflow-hidden rounded-2xl bg-base-100 border border-base-content/5 shadow-lg hover:shadow-xl transition-shadow text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary">
                    <TerminalIcon />
                  </div>
                  <SignalIcon connected />
                </div>
                <h3 className="text-lg font-semibold mb-1">Local Terminal</h3>
                <p className="text-sm text-base-content/60">
                  Start a session on this machine
                </p>
                <div className="mt-4 flex items-center text-xs text-primary font-medium">
                  <span>Launch</span>
                  <motion.span
                    className="ml-1"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    →
                  </motion.span>
                </div>
              </div>
            </motion.button>

            {/* Remote Hosts */}
            <AnimatePresence mode="popLayout">
              {loading ? (
                <motion.div
                  key="loading"
                  variants={itemVariants}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="rounded-2xl bg-base-100 border border-base-content/5 shadow-lg p-6 flex items-center justify-center"
                >
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </motion.div>
              ) : (
                hosts.map((host, index) => (
                  <motion.button
                    key={host.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.9 }}
                    whileHover={cardHover}
                    whileTap={cardTap}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => startRemote({ hostId: host.id, name: host.name })}
                    className="group relative overflow-hidden rounded-2xl bg-base-100 border border-base-content/5 shadow-lg hover:shadow-xl transition-shadow text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="p-3 rounded-xl bg-secondary/10 text-secondary">
                          <ServerIcon />
                        </div>
                        <div className="flex items-center gap-2">
                          {host.password && (
                            <span className="badge badge-ghost badge-xs">🔒</span>
                          )}
                          <SignalIcon />
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold mb-1 truncate">{host.name}</h3>
                      <p className="text-sm text-base-content/60 font-mono truncate">
                        {host.username}@{host.host}
                      </p>
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-xs text-base-content/40">
                          Port {host.port}
                        </span>
                        <div className="flex items-center text-xs text-secondary font-medium">
                          <span>Connect</span>
                          <motion.span
                            className="ml-1"
                            animate={{ x: [0, 4, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            →
                          </motion.span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))
              )}
            </AnimatePresence>

            {/* Add New Host Card */}
            <motion.button
              variants={itemVariants}
              whileHover={cardHover}
              whileTap={cardTap}
              onClick={() => setManagerOpen(true)}
              className="group relative overflow-hidden rounded-2xl bg-base-100/50 border-2 border-dashed border-base-content/10 hover:border-primary/30 transition-colors text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative p-6 flex flex-col items-center justify-center h-full min-h-[180px]">
                <motion.div
                  className="p-3 rounded-xl bg-base-content/5 text-base-content/40 group-hover:text-primary group-hover:bg-primary/10 transition-colors"
                  whileHover={{ rotate: 90 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <PlusIcon />
                </motion.div>
                <h3 className="mt-4 text-base font-medium text-base-content/60 group-hover:text-base-content transition-colors">
                  Add SSH Host
                </h3>
                <p className="mt-1 text-xs text-base-content/40">
                  Configure a new server
                </p>
              </div>
            </motion.button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-16 text-center"
        >
          <p className="text-sm text-base-content/30">
            Local-first • Secure • Open Source
          </p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => setManagerOpen(true)}
              className="btn btn-ghost btn-sm text-base-content/50 hover:text-base-content"
            >
              Manage Hosts
            </button>
          </div>
        </motion.footer>
      </div>

      {/* Host Manager Modal */}
      <HostManager
        isOpen={managerOpen}
        onClose={() => setManagerOpen(false)}
        onHostsChanged={loadHosts}
      />
    </div>
  )
}
