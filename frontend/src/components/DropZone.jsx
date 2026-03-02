import React, { useCallback, useState } from 'react'
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useUpload } from '../hooks/useUpload.js'
import useStore from '../store/index.js'

const ACCEPTED_TYPES = [
  'image/*', 'audio/*', 'video/*',
  'application/pdf', 'application/zip',
  'application/octet-stream', 'text/*',
]

function formatSize(bytes) {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1048576)    return `${(bytes/1024).toFixed(1)} KB`
  return `${(bytes/1048576).toFixed(1)} MB`
}

export default function DropZone() {
  const [dragOver, setDragOver]   = useState(false)
  const { uploadFile, resetUpload } = useUpload()

  const {
    uploadStatus, uploadProgress,
    uploadError,  uploadedFile,
    sessionId,
  } = useStore()

  // ── Handle file selection ──────────────────────────────────────────────────
  const handleFile = useCallback(async (file) => {
    if (!file) return
    await uploadFile(file)
  }, [uploadFile])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const onDragOver = (e) => { e.preventDefault(); setDragOver(true)  }
  const onDragLeave = ()  => setDragOver(false)

  const onInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  // ── Uploaded state ─────────────────────────────────────────────────────────
  if (uploadStatus === 'done' && uploadedFile) {
    return (
      <div className="animate-fade-in">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 text-ctp-green">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="text-sm font-medium">File ready</span>
          </div>
          <button
            onClick={resetUpload}
            className="text-ctp-overlay0 hover:text-ctp-red transition-colors"
            title="Remove file"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-ctp-surface0 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <File className="w-4 h-4 text-ctp-blue shrink-0" />
            <span className="text-ctp-text text-sm font-medium truncate">
              {uploadedFile.name}
            </span>
          </div>
          <div className="text-xs text-ctp-overlay1 pl-6 space-y-0.5">
            <div>{formatSize(uploadedFile.size_bytes)}</div>
            <div className="text-ctp-overlay0">{uploadedFile.mime_type}</div>
          </div>
          <div className="text-xs text-ctp-overlay0 pl-6 font-mono truncate">
            {sessionId}
          </div>
        </div>
      </div>
    )
  }

  // ── Uploading state ────────────────────────────────────────────────────────
  if (uploadStatus === 'uploading') {
    return (
      <div className="space-y-3">
        <div className="text-sm text-ctp-blue text-center">Uploading...</div>
        <div className="w-full bg-ctp-surface0 rounded-full h-2">
          <div
            className="bg-ctp-blue h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
        <div className="text-center text-xs text-ctp-overlay1">
          {uploadProgress}%
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (uploadStatus === 'error') {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-ctp-red text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Upload failed</span>
        </div>
        <p className="text-xs text-ctp-overlay1">{uploadError}</p>
        <button
          onClick={resetUpload}
          className="w-full text-sm text-ctp-blue hover:underline"
        >
          Try again
        </button>
      </div>
    )
  }

  // ── Idle drop zone ─────────────────────────────────────────────────────────
  return (
    <label
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`flex flex-col items-center justify-center gap-3
                  border-2 border-dashed rounded-xl p-6 cursor-pointer
                  transition-all duration-200
                  ${dragOver
                    ? 'border-ctp-blue bg-ctp-blue/10 scale-[1.02]'
                    : 'border-ctp-surface2 hover:border-ctp-blue/50 hover:bg-ctp-surface0/30'
                  }`}
    >
      <input
        type="file"
        className="hidden"
        onChange={onInputChange}
        accept={ACCEPTED_TYPES.join(',')}
      />

      <div className={`p-3 rounded-full transition-colors
                       ${dragOver ? 'bg-ctp-blue/20' : 'bg-ctp-surface0'}`}>
        <Upload className={`w-6 h-6 transition-colors
                            ${dragOver ? 'text-ctp-blue' : 'text-ctp-overlay1'}`} />
      </div>

      <div className="text-center space-y-1">
        <p className="text-sm text-ctp-text font-medium">
          {dragOver ? 'Drop it!' : 'Drop file here'}
        </p>
        <p className="text-xs text-ctp-overlay0">
          or click to browse
        </p>
        <p className="text-xs text-ctp-overlay0">
          Max 50MB — any file type
        </p>
      </div>
    </label>
  )
}
