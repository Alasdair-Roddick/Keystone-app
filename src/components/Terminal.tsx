import { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import { formatHex, parse } from 'culori'
import 'xterm/css/xterm.css'

type Props = {
  sessionId: string
}

// Convert CSS variable (oklch) to hex for xterm
function getCssVarAsHex(varName: string, fallback: string): string {
  if (typeof window === 'undefined') return fallback
  
  const style = getComputedStyle(document.documentElement)
  const value = style.getPropertyValue(varName).trim()
  
  if (!value) return fallback
  
  try {
    // Try to parse the color (supports oklch, hsl, rgb, hex)
    const parsed = parse(value)
    if (parsed) {
      return formatHex(parsed) || fallback
    }
  } catch {
    // Fall back if parsing fails
  }
  
  return fallback
}

// Build xterm theme from DaisyUI CSS variables
function buildTheme() {
  return {
    background: getCssVarAsHex('--b1', '#1d232a'),
    foreground: getCssVarAsHex('--bc', '#a6adbb'),
    cursor: getCssVarAsHex('--p', '#7c3aed'),
    cursorAccent: getCssVarAsHex('--b1', '#1d232a'),
    selectionBackground: getCssVarAsHex('--p', '#7c3aed') + '40',
    selectionForeground: getCssVarAsHex('--bc', '#a6adbb'),
    // ANSI colors
    black: getCssVarAsHex('--b3', '#1c1c1c'),
    red: '#f87171',
    green: '#4ade80',
    yellow: '#facc15',
    blue: '#60a5fa',
    magenta: '#c084fc',
    cyan: '#22d3ee',
    white: getCssVarAsHex('--bc', '#a6adbb'),
    brightBlack: '#6b7280',
    brightRed: '#fca5a5',
    brightGreen: '#86efac',
    brightYellow: '#fde047',
    brightBlue: '#93c5fd',
    brightMagenta: '#d8b4fe',
    brightCyan: '#67e8f9',
    brightWhite: '#f9fafb',
  }
}

export default function Terminal({ sessionId }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const termRef = useRef<XTerm | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    const term = new XTerm({
      cursorBlink: true,
      cursorStyle: 'bar',
      cursorWidth: 2,
      fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      fontWeight: '400',
      fontWeightBold: '600',
      letterSpacing: 0,
      lineHeight: 1.2,
      theme: buildTheme(),
      allowTransparency: true,
      scrollback: 10000,
      smoothScrollDuration: 100,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(container)

    // Delay fit() to ensure container has dimensions
    requestAnimationFrame(() => {
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        fitAddon.fit()
        window.keystone.resizeSession(sessionId, term.cols, term.rows)
        setIsReady(true)
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
        window.keystone.resizeSession(sessionId, term.cols, term.rows)
      }
    }

    // Use ResizeObserver for more reliable resize detection
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(handleResize)
    })
    resizeObserver.observe(container)

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      resizeObserver.disconnect()
      unsubscribe()
      term.dispose()
    }
  }, [sessionId])

  return (
    <div className="w-full h-full relative bg-base-100">
      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-base-100 z-10">
          <div className="flex flex-col items-center gap-3">
            <span className="loading loading-ring loading-lg text-primary"></span>
            <span className="text-sm text-base-content/50">Initializing terminal...</span>
          </div>
        </div>
      )}
      
      {/* Terminal container */}
      <div 
        ref={containerRef} 
        className={`w-full h-full p-2 transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
