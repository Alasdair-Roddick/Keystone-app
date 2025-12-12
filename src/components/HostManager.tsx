import { useState, useEffect } from 'react'
import type { Host, CreateHostInput, UpdateHostInput } from '../../packages/shared/contracts/ipc'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Server } from 'lucide-react'

type Props = {
  isOpen: boolean
  onClose: () => void
  onHostsChanged: () => void
}

type EditingHost = Host | 'new' | null

export default function HostManager({ isOpen, onClose, onHostsChanged }: Props) {
  const [hosts, setHosts] = useState<Host[]>([])
  const [loading, setLoading] = useState(true)
  const [editingHost, setEditingHost] = useState<EditingHost>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadHosts = async () => {
    setLoading(true)
    const data = await window.keystone.getHosts()
    setHosts(data)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen) {
      loadHosts()
    }
  }, [isOpen])

  const handleDelete = async (id: string) => {
    await window.keystone.deleteHost(id)
    setDeleteConfirm(null)
    await loadHosts()
    onHostsChanged()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-base-300 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">Manage Hosts</h3>
                <p className="text-sm text-base-content/60 mt-1">Configure your SSH servers</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="btn btn-primary btn-sm gap-2"
                onClick={() => setEditingHost('new')}
              >
                <Plus className="w-4 h-4" />
                Add Host
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
              {loading ? (
                <div className="flex justify-center py-12">
                  <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
              ) : hosts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-base-200 flex items-center justify-center text-base-content/40">
                    <Server className="w-8 h-8" />
                  </div>
                  <p className="text-base-content/60 mb-4">No hosts configured yet</p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setEditingHost('new')}
                  >
                    Add Your First Host
                  </button>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {hosts.map((host, index) => (
                    <motion.div
                      key={host.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group p-4 rounded-xl bg-base-200/50 hover:bg-base-200 transition-colors border border-base-300/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary">
                            <Server className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{host.name}</h4>
                            <p className="text-sm text-base-content/60 font-mono">
                              {host.username}@{host.host}:{host.port}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {host.password ? (
                            <span className="badge badge-success badge-sm gap-1">
                              <span>🔒</span> Saved
                            </span>
                          ) : (
                            <span className="badge badge-ghost badge-sm">Prompt</span>
                          )}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="btn btn-ghost btn-xs btn-square"
                              onClick={() => setEditingHost(host)}
                            >
                              <Pencil className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="btn btn-ghost btn-xs btn-square text-error"
                              onClick={() => setDeleteConfirm(host.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-base-300 flex justify-end">
              <button className="btn btn-ghost" onClick={onClose}>
                Done
              </button>
            </div>
          </motion.div>

          {/* Edit/Add Modal */}
          <AnimatePresence>
            {editingHost && (
              <HostEditModal
                host={editingHost === 'new' ? null : editingHost}
                onClose={() => setEditingHost(null)}
                onSave={async () => {
                  await loadHosts()
                  setEditingHost(null)
                  onHostsChanged()
                }}
              />
            )}
          </AnimatePresence>

          {/* Delete confirmation */}
          <AnimatePresence>
            {deleteConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
                onClick={() => setDeleteConfirm(null)}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-base-100 rounded-2xl shadow-2xl p-6 max-w-sm mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold mb-2">Delete Host?</h3>
                  <p className="text-base-content/60 mb-6">
                    This action cannot be undone.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button
                      className="btn btn-ghost"
                      onClick={() => setDeleteConfirm(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-error"
                      onClick={() => handleDelete(deleteConfirm)}
                    >
                      Delete
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
 

// --------------------
// Host Edit Modal
// --------------------

type HostEditModalProps = {
  host: Host | null
  onClose: () => void
  onSave: () => void
}

function HostEditModal({ host, onClose, onSave }: HostEditModalProps) {
  const isNew = !host

  const [form, setForm] = useState({
    name: host?.name || '',
    host: host?.host || '',
    port: host?.port || 22,
    username: host?.username || '',
    password: host?.password || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!form.name.trim()) {
      setError('Name is required')
      return
    }
    if (!form.host.trim()) {
      setError('Host is required')
      return
    }
    if (!form.username.trim()) {
      setError('Username is required')
      return
    }

    setSaving(true)

    try {
      if (isNew) {
        const input: CreateHostInput = {
          name: form.name.trim(),
          host: form.host.trim(),
          port: form.port,
          username: form.username.trim(),
          password: form.password || null,
        }
        await window.keystone.createHost(input)
      } else {
        const input: UpdateHostInput = {
          name: form.name.trim(),
          host: form.host.trim(),
          port: form.port,
          username: form.username.trim(),
          password: form.password || null,
        }
        await window.keystone.updateHost(host.id, input)
      }
      onSave()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save host')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-base-300">
          <h3 className="text-xl font-bold">
            {isNew ? 'Add New Host' : 'Edit Host'}
          </h3>
          <p className="text-sm text-base-content/60 mt-1">
            {isNew ? 'Configure a new SSH server connection' : 'Update server configuration'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="alert alert-error mb-4 rounded-xl"
              >
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="form-control w-full">
              <label className="label pb-1">
                <span className="label-text font-medium">Display Name</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Production Server"
                className="input input-bordered w-full rounded-xl focus:input-primary transition-colors"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-control w-full">
              <label className="label pb-1">
                <span className="label-text font-medium">Host / IP Address</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 192.168.1.100 or server.example.com"
                className="input input-bordered w-full rounded-xl focus:input-primary transition-colors font-mono text-sm"
                value={form.host}
                onChange={(e) => setForm({ ...form, host: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label pb-1">
                  <span className="label-text font-medium">Port</span>
                </label>
                <input
                  type="number"
                  placeholder="22"
                  className="input input-bordered w-full rounded-xl focus:input-primary transition-colors font-mono"
                  value={form.port}
                  onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 22 })}
                />
              </div>

              <div className="form-control w-full">
                <label className="label pb-1">
                  <span className="label-text font-medium">Username</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. root"
                  className="input input-bordered w-full rounded-xl focus:input-primary transition-colors font-mono text-sm"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
            </div>

            <div className="form-control w-full">
              <label className="label pb-1">
                <span className="label-text font-medium">Password</span>
                <span className="label-text-alt text-base-content/50 text-xs">
                  Optional — leave empty to prompt
                </span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered w-full rounded-xl focus:input-primary transition-colors"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="off"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end mt-6 pt-6 border-t border-base-300">
            <button
              type="button"
              className="btn btn-ghost rounded-xl"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary rounded-xl min-w-[120px]"
              disabled={saving}
            >
              {saving ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : isNew ? (
                'Add Host'
              ) : (
                'Save Changes'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
