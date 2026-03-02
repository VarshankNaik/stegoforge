import { useCallback } from 'react'
import axios from 'axios'
import useStore from '../store/index.js'

const API_BASE = '/api'

export function useUpload() {
  const {
    setSession,
    setUploadProgress,
    setUploadStatus,
    setUploadError,
    resetUpload,
  } = useStore()

  const uploadFile = useCallback(async (file) => {
    if (!file) return

    setUploadStatus('uploading')
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const pct = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          )
          setUploadProgress(pct)
        },
      })

      const data = response.data
      setSession(data.session_id, {
        name:       data.filename,
        size_bytes: data.size_bytes,
        size_human: data.size_human,
        mime_type:  data.mime_type,
      })

      return data.session_id

    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Upload failed'
      setUploadError(msg)
      return null
    }
  }, [setSession, setUploadProgress, setUploadStatus, setUploadError])

  return { uploadFile, resetUpload }
}
