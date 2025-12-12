import { useEffect, useRef } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'

type Props = {
  sessionId: string
}

export default function Terminal({ sessionId }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const termRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: 'monospace',
      fontSize: 13,
      theme: {
        background: '#0f172a', // slate-900
      },
    })

    const fitAddon = new FitAddon()

    term.loadAddon(fitAddon)
    term.open(container)

    // Delay fit() to ensure container has dimensions
    requestAnimationFrame(() => {
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        fitAddon.fit()
        // Send initial size to PTY
        window.keystone.resizeSession(sessionId, term.cols, term.rows)
      }
    })

    // Send terminal input to PTY
    term.onData((data) => {
      window.keystone.writeToSession(sessionId, data)
    })

    // Receive PTY output and write to terminal
    const unsubscribe = window.keystone.onSessionData(sessionId, (data) => {
      term.write(data)
    })

    termRef.current = term
    fitAddonRef.current = fitAddon

    const handleResize = () => {
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        fitAddon.fit()
        // Notify PTY of new size
        window.keystone.resizeSession(sessionId, term.cols, term.rows)
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      unsubscribe()
      term.dispose()
    }
  }, [sessionId])

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
