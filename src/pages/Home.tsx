import { useState, useEffect } from 'react'
import { useSessionStore } from '../state/session'
import { useSettingsStore } from '../state/settings'
import HostManager from '../components/HostManager'
import SettingsModal from '../components/SettingsModal'
import type { Host } from '../../packages/shared/contracts/ipc'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, Server, Plus, Settings, Circle } from 'lucide-react'

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
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

const cardHover = {
  scale: 1.02,
  transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
}

const cardTap = {
  scale: 0.98,
}

export default function Home() {
  const startLocal = useSessionStore((s) => s.startLocal)
  const startRemote = useSessionStore((s) => s.startRemote)
  
  // Initialize theme on mount
  const theme = useSettingsStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)
  const [managerOpen, setManagerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

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
        onClick={() => setSettingsOpen(true)}
        whileHover={{ rotate: 90 }}
        whileTap={{ scale: 0.9 }}
      >
        <Settings className="w-5 h-5" />
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
                    <Terminal className="w-8 h-8" />
                  </div>
                  <Circle className="w-3 h-3 fill-success text-success" />
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
                          <Server className="w-8 h-8" />
                        </div>
                        <div className="flex items-center gap-2">
                          {host.password && (
                            <span className="badge badge-ghost badge-xs">🔒</span>
                          )}
                          <Circle className="w-3 h-3 text-base-content/30" />
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
                  <Plus className="w-8 h-8" />
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
            <button
              onClick={() => setSettingsOpen(true)}
              className="btn btn-ghost btn-sm text-base-content/50 hover:text-base-content"
            >
              Settings
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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  )
}
