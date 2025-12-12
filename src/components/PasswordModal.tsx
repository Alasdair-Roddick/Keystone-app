import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KeyRound } from 'lucide-react'

type PasswordPrompt = {
  requestId: string
  host: string
  username: string
  prompt: string
}

export default function PasswordModal() {
  const [promptData, setPromptData] = useState<PasswordPrompt | null>(null)
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const unsubscribe = window.keystone.onPasswordPrompt((data) => {
      setPromptData(data)
      setPassword('')
      setIsSubmitting(false)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (promptData && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [promptData])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!promptData) return

    setIsSubmitting(true)
    window.keystone.respondToPasswordPrompt(promptData.requestId, password)
    setPromptData(null)
    setPassword('')
  }

  const handleCancel = () => {
    if (!promptData) return

    window.keystone.respondToPasswordPrompt(promptData.requestId, null)
    setPromptData(null)
    setPassword('')
  }

  return (
    <AnimatePresence>
      {promptData && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 text-center border-b border-base-300">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <KeyRound className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">SSH Authentication</h3>
              <p className="text-sm text-base-content/60 mt-2 font-mono">
                {promptData.username}@{promptData.host}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="form-control w-full">
                <label className="label pb-1">
                  <span className="label-text font-medium">
                    {promptData.prompt || 'Password'}
                  </span>
                </label>
                <input
                  ref={inputRef}
                  type="password"
                  placeholder="Enter password"
                  className="input input-bordered w-full rounded-xl focus:input-primary transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  className="btn btn-ghost flex-1 rounded-xl"
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn btn-primary flex-1 rounded-xl"
                  disabled={isSubmitting || !password}
                >
                  {isSubmitting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Connect'
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
