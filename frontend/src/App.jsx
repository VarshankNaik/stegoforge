import React, { useEffect } from 'react'
import {
  Shield, Terminal as TerminalIcon, FileSearch,
  FolderOpen, Binary, Activity, Flag, RefreshCw
} from 'lucide-react'
import useStore from './store/index.js'
import DropZone from './components/DropZone.jsx'
import ToolPanel from './components/ToolPanel.jsx'
import Terminal from './components/Terminal.jsx'
import ResultsTab from './components/ResultsTab.jsx'
import FilePreview from './components/FilePreview.jsx'
import FlagManager from './components/FlagManager.jsx'

const TABS = [
  { id: 'terminal',    label: 'Terminal',    icon: TerminalIcon },
  { id: 'results',     label: 'Results',     icon: FileSearch   },
  { id: 'files',       label: 'Files',       icon: FolderOpen   },
  { id: 'hex',         label: 'Hex View',    icon: Binary       },
  { id: 'spectrogram', label: 'Spectrogram', icon: Activity     },
  { id: 'flags',       label: 'Flag Formats',icon: Flag         },
]

export default function App() {
  const {
    sessionId, activeTab, setActiveTab,
    flags, isRunning, resetUpload,
  } = useStore()

  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        useStore.getState().clearTerminal()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-ctp-base text-ctp-text overflow-hidden">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3
                         bg-ctp-mantle border-b border-ctp-surface0 shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="text-ctp-blue w-6 h-6" />
          <span className="text-ctp-blue font-bold text-lg tracking-widest uppercase">
            StegoForge
          </span>
          <span className="text-ctp-overlay0 text-xs tracking-wider">
            CTF Steganography Platform
          </span>
        </div>

        <div className="flex items-center gap-4">
          {flags.length > 0 && (
            <div className="flex items-center gap-2 bg-ctp-yellow/10
                            border border-ctp-yellow/30 rounded px-3 py-1">
              <Flag className="w-4 h-4 text-ctp-yellow" />
              <span className="text-ctp-yellow text-sm font-bold">
                {flags.length} flag{flags.length > 1 ? 's' : ''} found
              </span>
            </div>
          )}

          {isRunning && (
            <div className="flex items-center gap-2 text-ctp-green text-sm">
              <span className="w-2 h-2 bg-ctp-green rounded-full animate-pulse" />
              Running...
            </div>
          )}

          {sessionId && (
            <button
              onClick={resetUpload}
              className="flex items-center gap-1 text-ctp-overlay1
                         hover:text-ctp-red transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          )}
        </div>
      </header>

      {/* ── Main Layout ─────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar ───────────────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 flex flex-col bg-ctp-mantle
                          border-r border-ctp-surface0 overflow-y-auto">
          <div className="p-4 border-b border-ctp-surface0">
            <DropZone />
          </div>
          {sessionId && (
            <div className="flex-1 overflow-y-auto">
              <ToolPanel />
            </div>
          )}
          <div className="p-3 border-t border-ctp-surface0 text-xs text-ctp-overlay0">
            <div className="flex justify-between">
              <span>
                <kbd className="bg-ctp-surface0 px-1 rounded">Ctrl+K</kbd> clear
              </span>
              <span>Docker 🐳 sandboxed</span>
            </div>
          </div>
        </aside>

        {/* ── Right Panel ───────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center gap-1 px-4 pt-2 bg-ctp-mantle
                          border-b border-ctp-surface0 shrink-0 overflow-x-auto">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm
                            rounded-t transition-colors border-b-2 whitespace-nowrap
                            ${activeTab === id
                              ? 'text-ctp-blue border-ctp-blue bg-ctp-base'
                              : 'text-ctp-overlay1 border-transparent hover:text-ctp-text'
                            }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {id === 'results' && flags.length > 0 && (
                  <span className="bg-ctp-yellow text-ctp-base
                                   text-xs font-bold px-1.5 rounded-full">
                    {flags.length}
                  </span>
                )}
                {id === 'flags' && (
                  <span className="bg-ctp-blue/20 text-ctp-blue
                                   text-xs px-1.5 rounded-full">
                    custom
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-hidden bg-ctp-base">
            {activeTab === 'terminal'    && <Terminal />}
            {activeTab === 'results'     && <ResultsTab />}
            {activeTab === 'files'       && <FilePreview mode="files" />}
            {activeTab === 'hex'         && <FilePreview mode="hex" />}
            {activeTab === 'spectrogram' && <FilePreview mode="spectrogram" />}
            {activeTab === 'flags'       && <FlagManager />}
          </div>
        </main>
      </div>
    </div>
  )
}
