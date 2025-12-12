import { useState, useEffect, useRef } from 'react'

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
      inputRef.current.focus()
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

  if (!promptData) return null

  return (
    <dialog className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">SSH Authentication</h3>
        <p className="py-2 text-base-content/70">
          Connecting to <span className="font-mono text-primary">{promptData.username}@{promptData.host}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-control w-full mt-4">
            <label className="label">
              <span className="label-text">{promptData.prompt || 'Password'}</span>
            </label>
            <input
              ref={inputRef}
              type="password"
              placeholder="Enter password"
              className="input input-bordered w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              autoComplete="off"
            />
          </div>

          <div className="modal-action">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !password}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Connect'
              )}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={handleCancel}>close</button>
      </form>
    </dialog>
  )
}
