import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Play, Zap, RotateCw, ChevronDown, ChevronRight } from 'lucide-react'
import CategoryBadge from './CategoryBadge.jsx'
import { useWebSocket } from '../hooks/useWebSocket.js'
import useStore from '../store/index.js'

const API_BASE = '/api'

export default function ToolPanel() {
  const [toolsData,   setToolsData]   = useState(null)
  const [collapsed,   setCollapsed]   = useState({})
  const [selected,    setSelected]    = useState([])

  const { sessionId, isRunning, setActiveTab } = useStore()
  const { runTool, runBatch } = useWebSocket()

  // ── Fetch tool list from backend ───────────────────────────────────────────
  useEffect(() => {
    axios.get(`${API_BASE}/tools`)
      .then(r => setToolsData(r.data))
      .catch(console.error)
  }, [])

  if (!toolsData) {
    return (
      <div className="p-4 text-ctp-overlay0 text-sm animate-pulse">
        Loading tools...
      </div>
    )
  }

  const { by_category, categories, quick_tools } = toolsData

  const toggleCollapse = (cat) =>
    setCollapsed(p => ({ ...p, [cat]: !p[cat] }))

  const toggleSelect = (key) =>
    setSelected(p =>
      p.includes(key) ? p.filter(k => k !== key) : [...p, key]
    )

  const handleRunTool = (toolKey) => {
    if (!sessionId || isRunning) return
    setActiveTab('terminal')
    runTool(sessionId, toolKey)
  }

  const handleRunSelected = () => {
    if (!sessionId || isRunning || selected.length === 0) return
    setActiveTab('terminal')
    runBatch(sessionId, selected)
  }

  const handleRunAll = () => {
    if (!sessionId || isRunning) return
    const allKeys = Object.values(by_category)
      .flat()
      .map(t => t.key)
    setActiveTab('terminal')
    runBatch(sessionId, allKeys)
  }

  return (
    <div className="flex flex-col h-full text-sm">

      {/* ── Quick Tools ───────────────────────────────────────────────────── */}
      <div className="p-3 border-b border-ctp-surface0">
        <div className="text-xs text-ctp-overlay0 uppercase tracking-wider mb-2 flex items-center gap-1">
          <Zap className="w-3 h-3" /> Quick Tools
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quick_tools.map(key => (
            <button
              key={key}
              onClick={() => handleRunTool(key)}
              disabled={isRunning}
              className="px-2 py-1 text-xs rounded bg-ctp-surface0
                         text-ctp-blue border border-ctp-blue/20
                         hover:bg-ctp-blue/10 hover:border-ctp-blue/50
                         disabled:opacity-40 disabled:cursor-not-allowed
                         transition-all font-mono"
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      {/* ── Run Selected / Run All ────────────────────────────────────────── */}
      <div className="p-3 border-b border-ctp-surface0 flex gap-2">
        <button
          onClick={handleRunSelected}
          disabled={isRunning || selected.length === 0}
          className="flex-1 flex items-center justify-center gap-1.5
                     py-1.5 rounded text-xs font-medium
                     bg-ctp-blue/10 text-ctp-blue border border-ctp-blue/30
                     hover:bg-ctp-blue/20 disabled:opacity-40
                     disabled:cursor-not-allowed transition-all"
        >
          <Play className="w-3 h-3" />
          Run {selected.length > 0 ? `(${selected.length})` : 'Selected'}
        </button>

        <button
          onClick={handleRunAll}
          disabled={isRunning}
          className="flex-1 flex items-center justify-center gap-1.5
                     py-1.5 rounded text-xs font-medium
                     bg-ctp-mauve/10 text-ctp-mauve border border-ctp-mauve/30
                     hover:bg-ctp-mauve/20 disabled:opacity-40
                     disabled:cursor-not-allowed transition-all"
        >
          <RotateCw className="w-3 h-3" />
          Run All
        </button>
      </div>

      {/* ── Tool Categories ───────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(by_category).map(([catKey, tools]) => {
          if (!tools || tools.length === 0) return null
          const catMeta   = categories[catKey]
          const isCollapsed = collapsed[catKey]

          return (
            <div key={catKey} className="border-b border-ctp-surface0/50">
              {/* Category header */}
              <button
                onClick={() => toggleCollapse(catKey)}
                className="w-full flex items-center justify-between
                           px-3 py-2 text-xs font-semibold
                           text-ctp-subtext0 hover:text-ctp-text
                           hover:bg-ctp-surface0/30 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <span>{catMeta?.icon}</span>
                  <span className="uppercase tracking-wider">{catMeta?.label}</span>
                  <span className="text-ctp-overlay0 font-normal">({tools.length})</span>
                </span>
                {isCollapsed
                  ? <ChevronRight className="w-3 h-3" />
                  : <ChevronDown  className="w-3 h-3" />
                }
              </button>

              {/* Tool list */}
              {!isCollapsed && (
                <div className="pb-1">
                  {tools.map(tool => (
                    <div
                      key={tool.key}
                      className={`flex items-center gap-2 px-3 py-1.5
                                  hover:bg-ctp-surface0/50 transition-colors
                                  ${selected.includes(tool.key)
                                    ? 'bg-ctp-blue/5 border-l-2 border-ctp-blue'
                                    : 'border-l-2 border-transparent'
                                  }`}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selected.includes(tool.key)}
                        onChange={() => toggleSelect(tool.key)}
                        className="accent-ctp-blue w-3 h-3 shrink-0"
                      />

                      {/* Tool name + description */}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-mono text-ctp-text truncate">
                          {tool.key}
                        </div>
                        <div className="text-xs text-ctp-overlay0 truncate leading-tight">
                          {tool.description}
                        </div>
                      </div>

                      {/* Run button */}
                      <button
                        onClick={() => handleRunTool(tool.key)}
                        disabled={isRunning}
                        className="shrink-0 p-1 rounded
                                   text-ctp-overlay1 hover:text-ctp-green
                                   hover:bg-ctp-green/10
                                   disabled:opacity-30 disabled:cursor-not-allowed
                                   transition-all"
                        title={`Run ${tool.key}`}
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
