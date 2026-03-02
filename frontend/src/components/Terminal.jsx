import React, { useEffect, useRef, useCallback } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { Trash2, Copy, Pause, Play } from 'lucide-react'
import useStore from '../store/index.js'
import '@xterm/xterm/css/xterm.css'

// ── Catppuccin Mocha theme ────────────────────────────────────────────────────
const CATPPUCCIN_THEME = {
  background:          '#1e1e2e',
  foreground:          '#cdd6f4',
  cursor:              '#f5e0dc',
  cursorAccent:        '#1e1e2e',
  selectionBackground: '#585b7066',
  black:               '#45475a',
  red:                 '#f38ba8',
  green:               '#a6e3a1',
  yellow:              '#f9e2af',
  blue:                '#89b4fa',
  magenta:             '#cba6f7',
  cyan:                '#89dceb',
  white:               '#bac2de',
  brightBlack:         '#585b70',
  brightRed:           '#f38ba8',
  brightGreen:         '#a6e3a1',
  brightYellow:        '#f9e2af',
  brightBlue:          '#89b4fa',
  brightMagenta:       '#cba6f7',
  brightCyan:          '#89dceb',
  brightWhite:         '#a6adc8',
}

export default function Terminal() {
  const termRef      = useRef(null)
  const xtermRef     = useRef(null)
  const fitAddonRef  = useRef(null)
  const pausedRef    = useRef(false)
  const bufferRef    = useRef([])
  const [paused, setPaused] = React.useState(false)

  const { terminalLines, clearTerminal, isRunning } = useStore()
  const prevLinesRef = useRef(0)

  // ── Initialize xterm.js once ──────────────────────────────────────────────
  useEffect(() => {
    if (xtermRef.current) return

    const xterm = new XTerm({
      theme:             CATPPUCCIN_THEME,
      fontFamily:        "'JetBrains Mono', 'Fira Code', Consolas, monospace",
      fontSize:          13,
      lineHeight:        1.4,
      cursorBlink:       true,
      cursorStyle:       'block',
      scrollback:        10000,
      convertEol:        true,
      disableStdin:      true,
      allowTransparency: false,
    })

    const fitAddon      = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    xterm.loadAddon(fitAddon)
    xterm.loadAddon(webLinksAddon)
    xterm.open(termRef.current)

    // small delay so DOM is ready before fitting
    setTimeout(() => { try { fitAddon.fit() } catch {} }, 50)

    xtermRef.current    = xterm
    fitAddonRef.current = fitAddon

    // Welcome banner
    xterm.writeln('\x1b[1;36m╔' + '═'.repeat(58) + '╗\x1b[0m')
    xterm.writeln('\x1b[1;36m║' +
      '         🔐  StegoForge — CTF Stego Platform         ' +
      '\x1b[1;36m║\x1b[0m')
    xterm.writeln('\x1b[1;36m╚' + '═'.repeat(58) + '╝\x1b[0m')
    xterm.writeln('')
    xterm.writeln('\x1b[0;37m  Upload a file and select a tool to begin.\x1b[0m')
    xterm.writeln('\x1b[0;37m  All tools run inside Docker 🐳\x1b[0m')
    xterm.writeln('\x1b[0;37m  Ctrl+K to clear terminal\x1b[0m')
    xterm.writeln('')

    // Resize observer
    const observer = new ResizeObserver(() => {
      try { fitAddonRef.current?.fit() } catch {}
    })
    if (termRef.current) observer.observe(termRef.current)

    return () => {
      observer.disconnect()
      xterm.dispose()
      xtermRef.current    = null
      fitAddonRef.current = null
    }
  }, [])

  // ── Write new lines as they arrive ───────────────────────────────────────
  useEffect(() => {
    const xterm = xtermRef.current
    if (!xterm) return

    const newLines = terminalLines.slice(prevLinesRef.current)
    if (newLines.length === 0) return

    newLines.forEach(line => {
      if (pausedRef.current) {
        bufferRef.current.push(line)
      } else {
        xterm.write(line)
      }
    })

    prevLinesRef.current = terminalLines.length
  }, [terminalLines])

  // ── Actions ───────────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    xtermRef.current?.clear()
    xtermRef.current?.writeln('\x1b[0;37m  Terminal cleared\x1b[0m\r\n')
    clearTerminal()
    prevLinesRef.current = 0
    bufferRef.current    = []
  }, [clearTerminal])

  const handleCopy = useCallback(() => {
    const text = useStore.getState().terminalLines.join('')
    navigator.clipboard.writeText(text)
  }, [])

  const handlePause = useCallback(() => {
    pausedRef.current = !pausedRef.current
    setPaused(pausedRef.current)

    if (!pausedRef.current && xtermRef.current) {
      bufferRef.current.forEach(l => xtermRef.current.write(l))
      bufferRef.current = []
    }
  }, [])

  // Ctrl+K shortcut
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        handleClear()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClear])

  return (
    <div className="flex flex-col h-full bg-ctp-base">

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between
                      px-4 py-2 bg-ctp-mantle
                      border-b border-ctp-surface0 shrink-0">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-ctp-red"    />
          <span className="w-3 h-3 rounded-full bg-ctp-yellow" />
          <span className="w-3 h-3 rounded-full bg-ctp-green"  />
          <span className="ml-3 text-xs text-ctp-overlay0 font-mono">
            stegoforge — docker exec
          </span>
          {isRunning && (
            <span className="flex items-center gap-1 text-xs text-ctp-green ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-ctp-green animate-pulse" />
              running
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePause}
            title={paused ? 'Resume output' : 'Pause output'}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs
                        transition-colors
                        ${paused
                          ? 'bg-ctp-yellow/20 text-ctp-yellow border border-ctp-yellow/30'
                          : 'text-ctp-overlay1 hover:text-ctp-text hover:bg-ctp-surface0'
                        }`}
          >
            {paused
              ? <><Play  className="w-3 h-3" /> Resume</>
              : <><Pause className="w-3 h-3" /> Pause</>
            }
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs
                       text-ctp-overlay1 hover:text-ctp-text
                       hover:bg-ctp-surface0 transition-colors"
          >
            <Copy className="w-3 h-3" /> Copy
          </button>

          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs
                       text-ctp-overlay1 hover:text-ctp-red
                       hover:bg-ctp-red/10 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> Clear
          </button>
        </div>
      </div>

      {/* ── xterm.js mount point ──────────────────────────────────────────── */}
      <div
        ref={termRef}
        className="flex-1 overflow-hidden"
        style={{ background: '#1e1e2e', padding: '4px' }}
      />
    </div>
  )
}
