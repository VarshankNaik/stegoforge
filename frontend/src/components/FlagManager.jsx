import React, { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Flag, Plus, Trash2, CheckCircle,
  AlertCircle, ChevronDown, ChevronRight, TestTube
} from 'lucide-react'

const API = '/api'

export default function FlagManager() {
  const [patterns,    setPatterns]    = useState({ builtin: [], custom: [] })
  const [newPrefix,   setNewPrefix]   = useState('')
  const [testText,    setTestText]    = useState('')
  const [testResult,  setTestResult]  = useState(null)
  const [message,     setMessage]     = useState(null)   // {type, text}
  const [showBuiltin, setShowBuiltin] = useState(false)
  const [loading,     setLoading]     = useState(false)

  // ── Load patterns ───────────────────────────────────────────────────────────
  const loadPatterns = () => {
    axios.get(`${API}/flags/patterns`)
      .then(r => setPatterns(r.data))
      .catch(console.error)
  }

  useEffect(() => { loadPatterns() }, [])

  const showMsg = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  // ── Add custom prefix ───────────────────────────────────────────────────────
  const handleAdd = async () => {
    const prefix = newPrefix.trim()
    if (!prefix) return

    setLoading(true)
    try {
      const r = await axios.post(`${API}/flags/patterns`, { prefix })
      showMsg('success', r.data.message)
      setNewPrefix('')
      loadPatterns()
    } catch (e) {
      showMsg('error', e.response?.data?.detail || 'Failed to add pattern')
    } finally {
      setLoading(false)
    }
  }

  // ── Remove custom prefix ────────────────────────────────────────────────────
  const handleRemove = async (prefix) => {
    try {
      await axios.delete(`${API}/flags/patterns/${prefix}`)
      showMsg('success', `Removed ${prefix}{...}`)
      loadPatterns()
    } catch (e) {
      showMsg('error', e.response?.data?.detail || 'Failed to remove')
    }
  }

  // ── Test text ───────────────────────────────────────────────────────────────
  const handleTest = async () => {
    if (!testText.trim()) return
    try {
      const r = await axios.post(`${API}/flags/test`, { text: testText })
      setTestResult(r.data)
    } catch (e) {
      showMsg('error', 'Test failed')
    }
  }

  // ── Extract prefix from stored regex ─────────────────────────────────────
  const extractPrefix = (pattern) => {
    const m = pattern.match(/^(.+?)\\?\{/)
    return m ? m[1].replace(/\\/g, '') : pattern
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Flag className="w-5 h-5 text-ctp-yellow" />
        <h2 className="text-sm font-bold text-ctp-text uppercase tracking-wider">
          Flag Format Manager
        </h2>
      </div>

      <p className="text-xs text-ctp-overlay1 leading-relaxed">
        Add custom flag prefixes for your CTF competition.
        e.g. adding <code className="text-ctp-blue bg-ctp-surface0 px-1 rounded">HiO</code> will
        detect <code className="text-ctp-yellow bg-ctp-surface0 px-1 rounded">HiO&#123;...&#125;</code> in
        all tool outputs automatically.
      </p>

      {/* ── Status message ──────────────────────────────────────────────────── */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm
                         border animate-fade-in
                         ${message.type === 'success'
                           ? 'bg-ctp-green/10 border-ctp-green/30 text-ctp-green'
                           : 'bg-ctp-red/10  border-ctp-red/30  text-ctp-red'
                         }`}>
          {message.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />
          }
          {message.text}
        </div>
      )}

      {/* ── Add custom prefix ───────────────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider">
          Add Custom Flag Prefix
        </label>

        <div className="flex gap-2">
          <div className="flex-1 flex items-center bg-ctp-surface0
                          border border-ctp-surface1 rounded-lg
                          focus-within:border-ctp-blue transition-colors">
            <input
              type="text"
              value={newPrefix}
              onChange={e => setNewPrefix(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="e.g.  HiO  or  myctf  or  ACME"
              className="flex-1 bg-transparent px-3 py-2 text-sm
                         text-ctp-text placeholder-ctp-overlay0
                         outline-none font-mono"
            />
            <span className="pr-3 text-ctp-overlay0 text-sm font-mono">
              {newPrefix ? `${newPrefix}{...}` : '{...}'}
            </span>
          </div>

          <button
            onClick={handleAdd}
            disabled={!newPrefix.trim() || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg
                       text-sm font-medium
                       bg-ctp-blue/10 text-ctp-blue border border-ctp-blue/30
                       hover:bg-ctp-blue/20
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
      </div>

      {/* ── Custom patterns ─────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider">
            Custom Patterns ({patterns.custom?.length || 0})
          </label>
        </div>

        {patterns.custom?.length === 0 ? (
          <div className="text-xs text-ctp-overlay0 italic py-3 text-center
                          border border-dashed border-ctp-surface1 rounded-lg">
            No custom patterns yet — add one above
          </div>
        ) : (
          <div className="space-y-1.5">
            {patterns.custom.map((pattern, i) => {
              const prefix = extractPrefix(pattern)
              return (
                <div
                  key={i}
                  className="flex items-center justify-between
                             bg-ctp-surface0 border border-ctp-surface1
                             rounded-lg px-3 py-2.5
                             hover:border-ctp-blue/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Flag className="w-3.5 h-3.5 text-ctp-yellow shrink-0" />
                    <div>
                      <span className="font-mono text-sm text-ctp-yellow font-bold">
                        {prefix}
                      </span>
                      <span className="font-mono text-sm text-ctp-overlay1">
                        &#123;...&#125;
                      </span>
                    </div>
                    <span className="text-xs text-ctp-overlay0 font-mono
                                     bg-ctp-mantle px-2 py-0.5 rounded">
                      {pattern}
                    </span>
                  </div>

                  <button
                    onClick={() => handleRemove(prefix)}
                    className="p-1.5 rounded text-ctp-overlay0
                               hover:text-ctp-red hover:bg-ctp-red/10
                               transition-colors"
                    title={`Remove ${prefix}{...}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Test patterns ───────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider flex items-center gap-1.5">
          <TestTube className="w-3.5 h-3.5" />
          Test Flag Detection
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            value={testText}
            onChange={e => { setTestText(e.target.value); setTestResult(null) }}
            onKeyDown={e => e.key === 'Enter' && handleTest()}
            placeholder='e.g.  HiO{secret_flag_here}'
            className="flex-1 bg-ctp-surface0 border border-ctp-surface1
                       rounded-lg px-3 py-2 text-sm font-mono
                       text-ctp-text placeholder-ctp-overlay0 outline-none
                       focus:border-ctp-blue transition-colors"
          />
          <button
            onClick={handleTest}
            disabled={!testText.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm
                       bg-ctp-mauve/10 text-ctp-mauve border border-ctp-mauve/30
                       hover:bg-ctp-mauve/20
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all"
          >
            <TestTube className="w-4 h-4" />
            Test
          </button>
        </div>

        {/* Test result */}
        {testResult && (
          <div className={`p-3 rounded-lg border text-sm animate-fade-in
                           ${testResult.matched
                             ? 'bg-ctp-green/10 border-ctp-green/30'
                             : 'bg-ctp-surface0  border-ctp-surface1'
                           }`}>
            {testResult.matched ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-ctp-green font-medium">
                  <CheckCircle className="w-4 h-4" />
                  {testResult.count} flag{testResult.count > 1 ? 's' : ''} detected!
                </div>
                {testResult.flags_found.map((f, i) => (
                  <div key={i} className="font-mono text-ctp-yellow text-xs pl-6">
                    🚩 {f}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-ctp-overlay1">
                <AlertCircle className="w-4 h-4" />
                No flags detected in that text
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Built-in patterns (collapsible) ─────────────────────────────────── */}
      <div className="space-y-2">
        <button
          onClick={() => setShowBuiltin(p => !p)}
          className="flex items-center gap-2 text-xs font-semibold
                     text-ctp-overlay0 uppercase tracking-wider
                     hover:text-ctp-text transition-colors"
        >
          {showBuiltin
            ? <ChevronDown  className="w-3 h-3" />
            : <ChevronRight className="w-3 h-3" />
          }
          Built-in Patterns ({patterns.builtin?.length || 0})
        </button>

        {showBuiltin && (
          <div className="space-y-1 pl-2">
            {patterns.builtin?.map((p, i) => (
              <div key={i}
                   className="text-xs font-mono text-ctp-overlay1
                              bg-ctp-surface0 px-2 py-1 rounded">
                {p}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
