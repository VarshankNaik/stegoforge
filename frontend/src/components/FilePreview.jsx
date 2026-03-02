import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Download, FileX, Image, Music } from 'lucide-react'
import useStore from '../store/index.js'

const API_BASE = '/api'

// ── Hex View ──────────────────────────────────────────────────────────────────
function HexView({ sessionId }) {
  const [hexData, setHexData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  useEffect(() => {
    if (!sessionId) return
    setLoading(true)

    // Run xxd via analyze endpoint and capture output
    axios.post(`${API_BASE}/analyze/${sessionId}/xxd`, {}, {
      responseType: 'text',
    })
    .then(r => { setHexData(r.data); setLoading(false) })
    .catch(e => { setError(e.message); setLoading(false) })
  }, [sessionId])

  if (loading) return (
    <div className="flex items-center justify-center h-full text-ctp-overlay0">
      <span className="animate-pulse text-sm">Generating hex dump...</span>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full
                    text-ctp-red gap-2 text-sm">
      <FileX className="w-8 h-8 opacity-50" />
      <span>Failed to load hex: {error}</span>
    </div>
  )

  return (
    <div className="h-full overflow-auto p-4">
      <div className="mb-3 text-xs text-ctp-overlay0 font-mono uppercase tracking-wider">
        Hex Dump — first 512 bytes
      </div>
      <pre className="text-xs font-mono text-ctp-text leading-relaxed
                      whitespace-pre bg-ctp-mantle rounded-lg p-4
                      border border-ctp-surface0 overflow-x-auto">
        {hexData
          ?.replace(/\x1b\[[0-9;]*m/g, '')  // strip ANSI
          .trim()}
      </pre>
    </div>
  )
}

// ── Files Tab ─────────────────────────────────────────────────────────────────
function FilesView({ sessionId }) {
  const [files,   setFiles]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!sessionId) return
    axios.get(`${API_BASE}/session/${sessionId}`)
      .then(r => { setFiles(r.data.all_files || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [sessionId])

  const formatSize = (bytes) => {
    if (bytes < 1024)    return `${bytes} B`
    if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`
    return `${(bytes/1048576).toFixed(1)} MB`
  }

  const getIcon = (name) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (['png','jpg','jpeg','gif','bmp','webp'].includes(ext))
      return '🖼️'
    if (['mp3','wav','ogg','flac'].includes(ext)) return '🎵'
    if (['pdf'].includes(ext))                    return '📄'
    if (['zip','rar','7z','tar'].includes(ext))   return '📦'
    if (['txt','md'].includes(ext))               return '📝'
    return '📁'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full text-ctp-overlay0">
      <span className="animate-pulse text-sm">Loading files...</span>
    </div>
  )

  if (files.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full
                    text-ctp-overlay0 gap-3">
      <FileX className="w-10 h-10 opacity-20" />
      <div className="text-center text-sm space-y-1">
        <p>No extracted files yet</p>
        <p className="text-xs">Run binwalk or foremost to extract embedded files</p>
      </div>
    </div>
  )

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 text-xs text-ctp-overlay0 uppercase tracking-wider">
        Session Files ({files.length})
      </div>
      <div className="grid grid-cols-2 gap-3">
        {files.map((file, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3
                       bg-ctp-mantle border border-ctp-surface0
                       rounded-lg hover:border-ctp-blue/30 transition-colors"
          >
            <span className="text-2xl shrink-0">{getIcon(file.name)}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-ctp-text truncate">
                {file.name}
              </div>
              <div className="text-xs text-ctp-overlay0">
                {formatSize(file.size)}
              </div>
              <div className="text-xs text-ctp-overlay0 truncate">
                {file.path}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Spectrogram View ──────────────────────────────────────────────────────────
function SpectrogramView({ sessionId, uploadedFile }) {
  const [loading, setLoading] = useState(false)
  const [imgUrl,  setImgUrl]  = useState(null)
  const [error,   setError]   = useState(null)
  const [ran,     setRan]     = useState(false)

  const isAudio = uploadedFile?.mime_type?.startsWith('audio')

  const generate = async () => {
    if (!sessionId) return
    setLoading(true)
    setError(null)
    setRan(true)

    try {
      // Run sox spectrogram tool
      await axios.post(`${API_BASE}/analyze/${sessionId}/sox_spectrogram`,
        {}, { responseType: 'text' })

      // Fetch the generated image via session files
      const r = await axios.get(`${API_BASE}/session/${sessionId}`)
      const spectroFile = r.data.all_files?.find(f =>
        f.name.includes('spectrogram') && f.name.endsWith('.png')
      )

      if (spectroFile) {
        setImgUrl(`/data/uploads/${sessionId}/${spectroFile.path}`)
      } else {
        setError('Spectrogram PNG not found — is this an audio file?')
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAudio && !ran) return (
    <div className="flex flex-col items-center justify-center h-full
                    text-ctp-overlay0 gap-4">
      <Music className="w-10 h-10 opacity-20" />
      <div className="text-center space-y-2">
        <p className="text-sm">Spectrogram viewer is for audio files</p>
        <p className="text-xs">Upload a WAV, MP3, or OGG file</p>
        <button
          onClick={generate}
          className="mt-2 px-4 py-2 text-xs rounded
                     bg-ctp-blue/10 text-ctp-blue border border-ctp-blue/30
                     hover:bg-ctp-blue/20 transition-colors"
        >
          Try anyway
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-ctp-overlay0 uppercase tracking-wider">
          Audio Spectrogram
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="px-3 py-1.5 text-xs rounded
                     bg-ctp-blue/10 text-ctp-blue border border-ctp-blue/30
                     hover:bg-ctp-blue/20 disabled:opacity-40 transition-colors"
        >
          {loading ? 'Generating...' : 'Generate Spectrogram'}
        </button>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center
                        text-ctp-blue animate-pulse text-sm">
          Running sox spectrogram...
        </div>
      )}

      {error && (
        <div className="text-ctp-red text-sm p-3
                        bg-ctp-red/10 border border-ctp-red/30 rounded-lg">
          {error}
        </div>
      )}

      {imgUrl && !loading && (
        <div className="flex-1 overflow-auto">
          <img
            src={imgUrl}
            alt="Spectrogram"
            className="max-w-full rounded-lg border border-ctp-surface0"
            onError={() => setError('Could not load spectrogram image')}
          />
        </div>
      )}

      {!ran && !loading && !imgUrl && (
        <div className="flex-1 flex items-center justify-center
                        text-ctp-overlay0 text-sm">
          Click "Generate Spectrogram" to analyze audio
        </div>
      )}
    </div>
  )
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function FilePreview({ mode }) {
  const { sessionId, uploadedFile } = useStore()

  if (!sessionId) return (
    <div className="flex flex-col items-center justify-center h-full
                    text-ctp-overlay0 gap-3">
      <FileX className="w-10 h-10 opacity-20" />
      <p className="text-sm">Upload a file first</p>
    </div>
  )

  if (mode === 'hex')         return <HexView         sessionId={sessionId} />
  if (mode === 'files')       return <FilesView       sessionId={sessionId} />
  if (mode === 'spectrogram') return <SpectrogramView sessionId={sessionId}
                                                      uploadedFile={uploadedFile} />
  return null
}
