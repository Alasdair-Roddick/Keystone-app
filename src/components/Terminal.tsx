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
    // DaisyUI 5 uses oklch format: e.g. "oklch(0.25 0.01 260)"
    // Try to parse the color (culori supports oklch, hsl, rgb, hex)
    const parsed = parse(value)
    if (parsed) {
      const hex = formatHex(parsed)
      if (hex) return hex
    }
  } catch {
    // Fall back if parsing fails
  }
  
  return fallback
}

// Build xterm theme from DaisyUI CSS variables
// DaisyUI 5 uses: --color-base-100, --color-base-content, --color-primary, etc.
function buildTheme() {
  // Get theme colors from DaisyUI CSS variables
  const base100 = getCssVarAsHex('--color-base-100', '#1d232a')
  const baseContent = getCssVarAsHex('--color-base-content', '#a6adbb')
  const primary = getCssVarAsHex('--color-primary', '#7c3aed')
  const base300 = getCssVarAsHex('--color-base-300', '#1c1c1c')
  const success = getCssVarAsHex('--color-success', '#4ade80')
  const error = getCssVarAsHex('--color-error', '#f87171')
  const warning = getCssVarAsHex('--color-warning', '#facc15')
  const info = getCssVarAsHex('--color-info', '#60a5fa')
  const secondary = getCssVarAsHex('--color-secondary', '#c084fc')
  const accent = getCssVarAsHex('--color-accent', '#22d3ee')
  
  return {
    background: base100,
    foreground: baseContent,
    cursor: primary,
    cursorAccent: base100,
    selectionBackground: primary + '40',
    selectionForeground: baseContent,
    // ANSI colors mapped to DaisyUI theme
    black: base300,
    red: error,
    green: success,
    yellow: warning,
    blue: info,
    magenta: secondary,
    cyan: accent,
    white: baseContent,
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

  // Watch for theme changes and update terminal colors
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'data-theme' && termRef.current) {
          // Small delay to let CSS variables update
          setTimeout(() => {
            termRef.current!.options.theme = buildTheme()
          }, 50)
        }
      })
    })

    observer.observe(document.documentElement, { attributes: true })

    return () => observer.disconnect()
  }, [])

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
