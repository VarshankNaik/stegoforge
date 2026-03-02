import React, { useState } from 'react'
import { Copy, Flag, CheckCheck, ChevronDown, ChevronRight } from 'lucide-react'
import useStore from '../store/index.js'
import CategoryBadge from './CategoryBadge.jsx'

function CopyButton({ text, label = 'Copy' }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs
                 text-ctp-overlay1 hover:text-ctp-blue
                 hover:bg-ctp-blue/10 transition-colors"
    >
      {copied
        ? <><CheckCheck className="w-3 h-3 text-ctp-green" /> Copied!</>
        : <><Copy       className="w-3 h-3" /> {label}</>
      }
    </button>
  )
}

function FlagCard({ flag }) {
  return (
    <div className="flex items-center justify-between
                    bg-ctp-yellow/10 border border-ctp-yellow/30
                    rounded-lg px-4 py-3 gap-3 animate-fade-in">
      <div className="flex items-center gap-2">
        <Flag className="w-4 h-4 text-ctp-yellow shrink-0" />
        <code className="text-ctp-yellow font-mono text-sm font-bold break-all">
          {flag}
        </code>
      </div>
      <CopyButton text={flag} />
    </div>
  )
}

function ToolResult({ toolKey, result }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="border border-ctp-surface0 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(p => !p)}
        className="w-full flex items-center justify-between
                   px-4 py-2.5 bg-ctp-mantle
                   hover:bg-ctp-surface0/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {collapsed
            ? <ChevronRight className="w-4 h-4 text-ctp-overlay0" />
            : <ChevronDown  className="w-4 h-4 text-ctp-overlay0" />
          }
          <span className="font-mono text-sm text-ctp-blue font-medium">
            {toolKey}
          </span>
          {result.flags?.length > 0 && (
            <span className="flex items-center gap-1 text-xs
                             text-ctp-yellow bg-ctp-yellow/10
                             border border-ctp-yellow/20 rounded px-1.5 py-0.5">
              <Flag className="w-3 h-3" />
              {result.flags.length} flag{result.flags.length > 1 ? 's' : ''}
            </span>
          )}
          {result.timestamp && (
            <span className="text-xs text-ctp-overlay0">
              {new Date(result.timestamp).toLocaleTimeString()}
            </span>
          )}
        </div>
        <CopyButton text={result.output || ''} label="Copy output" />
      </button>

      {/* Output */}
      {!collapsed && (
        <div className="bg-ctp-base border-t border-ctp-surface0">
          <pre className="p-4 text-xs font-mono text-ctp-text
                          overflow-x-auto whitespace-pre-wrap
                          max-h-64 overflow-y-auto leading-relaxed">
            {result.output
              ? result.output
                  // strip ANSI escape codes for clean display
                  .replace(/\x1b\[[0-9;]*m/g, '')
                  .trim()
              : <span className="text-ctp-overlay0 italic">No output</span>
            }
          </pre>
        </div>
      )}
    </div>
  )
}

export default function ResultsTab() {
  const { flags, results, uploadedFile } = useStore()

  const hasResults = Object.keys(results).length > 0
  const hasFlags   = flags.length > 0

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!hasResults && !hasFlags) {
    return (
      <div className="flex flex-col items-center justify-center h-full
                      text-ctp-overlay0 gap-4">
        <Flag className="w-12 h-12 opacity-20" />
        <div className="text-center space-y-1">
          <p className="text-sm font-medium">No results yet</p>
          <p className="text-xs">
            Run a tool from the left panel to see output here
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6">

      {/* ─��� Flags Section ─────────────────────────────────────────────────── */}
      {hasFlags && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-5 h-5 text-ctp-yellow" />
            <h2 className="text-sm font-bold text-ctp-yellow uppercase tracking-wider">
              Flags Detected ({flags.length})
            </h2>
          </div>
          <div className="space-y-2">
            {flags.map((flag, i) => (
              <FlagCard key={i} flag={flag} />
            ))}
          </div>
        </section>
      )}

      {/* ── File Info ─────────────────────────────────────────────────────── */}
      {uploadedFile && (
        <section>
          <h2 className="text-xs font-bold text-ctp-overlay0
                         uppercase tracking-wider mb-3">
            File Info
          </h2>
          <div className="bg-ctp-mantle border border-ctp-surface0
                          rounded-lg p-4 grid grid-cols-2 gap-3 text-sm">
            {[
              ['Name',      uploadedFile.name],
              ['Size',      uploadedFile.size_human],
              ['MIME Type', uploadedFile.mime_type],
              ['Type',      uploadedFile.mime_type?.split('/')[0] || 'unknown'],
            ].map(([key, val]) => (
              <div key={key}>
                <div className="text-xs text-ctp-overlay0 mb-0.5">{key}</div>
                <div className="font-mono text-ctp-text text-xs break-all">{val}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Per-Tool Results ──────────────────────────────────────────────── */}
      {hasResults && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold text-ctp-overlay0
                           uppercase tracking-wider">
              Tool Results ({Object.keys(results).length})
            </h2>
            <CopyButton
              text={Object.entries(results)
                .map(([k, v]) => `=== ${k} ===\n${v.output}\n`)
                .join('\n')}
              label="Copy all"
            />
          </div>
          <div className="space-y-3">
            {Object.entries(results).map(([toolKey, result]) => (
              <ToolResult key={toolKey} toolKey={toolKey} result={result} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
