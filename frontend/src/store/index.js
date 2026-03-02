import { create } from 'zustand'

const useStore = create((set, get) => ({

  // ── Upload State ────────────────────────────────────────────────────────────
  sessionId:    null,
  uploadedFile: null,   // { name, size_bytes, size_human, mime_type }
  uploadStatus: 'idle', // 'idle' | 'uploading' | 'done' | 'error'
  uploadProgress: 0,
  uploadError:  null,

  setSession: (sessionId, fileInfo) => set({
    sessionId,
    uploadedFile:   fileInfo,
    uploadStatus:   'done',
    uploadProgress: 100,
    uploadError:    null,
  }),

  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setUploadStatus:   (status)   => set({ uploadStatus: status }),
  setUploadError:    (error)    => set({ uploadError: error, uploadStatus: 'error' }),

  resetUpload: () => set({
    sessionId:      null,
    uploadedFile:   null,
    uploadStatus:   'idle',
    uploadProgress: 0,
    uploadError:    null,
    results:        {},
    flags:          [],
    activeTab:      'terminal',
    terminalLines:  [],
  }),

  // ── Active Tool State ───────────────────────────────────────────────────────
  activeTool:    null,
  isRunning:     false,
  runningTools:  [],   // for batch runs

  setActiveTool: (tool) => set({ activeTool: tool }),
  setIsRunning:  (val)  => set({ isRunning: val }),

  // ── Terminal Output ─────────────────────────────────────────────────────────
  terminalLines: [],   // array of strings

  appendTerminalLine: (line) => set((state) => ({
    terminalLines: [...state.terminalLines, line],
  })),

  clearTerminal: () => set({ terminalLines: [] }),

  // ── Flags Found ─────────────────────────────────────────────────────────────
  flags: [],

  addFlag: (flag) => set((state) => ({
    flags: state.flags.includes(flag)
      ? state.flags
      : [...state.flags, flag],
  })),

  clearFlags: () => set({ flags: [] }),

  // ── Results per tool ────────────────────────────────────────────────────────
  results: {},  // { [tool_key]: { output: string, flags: [], timestamp } }

  setToolResult: (toolKey, result) => set((state) => ({
    results: {
      ...state.results,
      [toolKey]: {
        ...result,
        timestamp: new Date().toISOString(),
      },
    },
  })),

  clearResults: () => set({ results: {} }),

  // ── UI State ────────────────────────────────────────────────────────────────
  activeTab: 'terminal',  // 'terminal' | 'results' | 'files' | 'hex' | 'spectrogram'

  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Extracted Files ─────────────────────────────────────────────────────────
  extractedFiles: [],

  setExtractedFiles: (files) => set({ extractedFiles: files }),
}))

export default useStore
