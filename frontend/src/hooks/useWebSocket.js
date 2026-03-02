import { useRef, useCallback } from 'react'
import useStore from '../store/index.js'

const WS_BASE = `ws://${window.location.host}`

export function useWebSocket() {
  const wsRef = useRef(null)

  const {
    appendTerminalLine,
    addFlag,
    setIsRunning,
    setToolResult,
  } = useStore()

  const runTool = useCallback((sessionId, toolKey) => {
    // Close any existing connection
    if (wsRef.current) {
      wsRef.current.close()
    }

    setIsRunning(true)
    const url = `${WS_BASE}/ws/${sessionId}/${toolKey}`
    const ws  = new WebSocket(url)
    wsRef.current = ws

    let outputBuffer = []

    ws.onopen = () => {
      appendTerminalLine(`\x1b[1;32m[WS] Connected — running ${toolKey}...\x1b[0m\r\n`)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'start':
            appendTerminalLine(
              `\x1b[1;36m${'═'.repeat(50)}\x1b[0m\r\n` +
              `\x1b[1;36m🔧 ${msg.data.name}\x1b[0m\r\n` +
              `\x1b[0;37m   ${msg.data.description}\x1b[0m\r\n` +
              `\x1b[1;36m${'═'.repeat(50)}\x1b[0m\r\n\r\n`
            )
            break

          case 'line':
            // Convert \n to \r\n for xterm.js
            const line = msg.data.replace(/\n/g, '\r\n')
            appendTerminalLine(line)
            outputBuffer.push(msg.data)
            break

          case 'flag':
            addFlag(msg.data)
            appendTerminalLine(
              `\r\n\x1b[1;33m🚩 FLAG DETECTED: ${msg.data}\x1b[0m\r\n\r\n`
            )
            break

          case 'done':
            setToolResult(toolKey, {
              output: outputBuffer.join(''),
              flags:  msg.data.flags || [],
            })
            appendTerminalLine(
              `\r\n\x1b[1;32m✅ ${msg.data.message}\x1b[0m\r\n`
            )
            setIsRunning(false)
            break

          case 'error':
            appendTerminalLine(
              `\x1b[1;31m[ERROR] ${msg.data}\x1b[0m\r\n`
            )
            setIsRunning(false)
            break

          default:
            break
        }
      } catch {
        // Raw text fallback
        appendTerminalLine(event.data.replace(/\n/g, '\r\n'))
      }
    }

    ws.onerror = () => {
      appendTerminalLine('\x1b[1;31m[WS] Connection error\x1b[0m\r\n')
      setIsRunning(false)
    }

    ws.onclose = () => {
      appendTerminalLine('\x1b[0;37m[WS] Connection closed\x1b[0m\r\n')
      setIsRunning(false)
    }

  }, [appendTerminalLine, addFlag, setIsRunning, setToolResult])


  const runBatch = useCallback((sessionId, toolKeys) => {
    if (wsRef.current) {
      wsRef.current.close()
    }

    setIsRunning(true)
    const url = `${WS_BASE}/ws/${sessionId}/batch`
    const ws  = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ tools: toolKeys }))
      appendTerminalLine(`\x1b[1;35m[BATCH] Running ${toolKeys.length} tools...\x1b[0m\r\n\r\n`)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'tool_start':
            appendTerminalLine(
              `\r\n\x1b[1;35m▶ Starting: ${msg.data.name}\x1b[0m\r\n`
            )
            break

          case 'line':
            appendTerminalLine(msg.data.replace(/\n/g, '\r\n'))
            break

          case 'flag':
            addFlag(msg.data)
            appendTerminalLine(
              `\r\n\x1b[1;33m🚩 FLAG: ${msg.data}\x1b[0m\r\n`
            )
            break

          case 'tool_done':
            appendTerminalLine(
              `\x1b[1;32m✅ Done: ${msg.data.tool}\x1b[0m\r\n`
            )
            break

          case 'batch_done':
            appendTerminalLine(
              `\r\n\x1b[1;35m${'═'.repeat(50)}\x1b[0m\r\n` +
              `\x1b[1;35m${msg.data.message}\x1b[0m\r\n` +
              `\x1b[1;35m${'═'.repeat(50)}\x1b[0m\r\n`
            )
            setIsRunning(false)
            break

          case 'error':
            appendTerminalLine(`\x1b[1;31m[ERROR] ${msg.data}\x1b[0m\r\n`)
            setIsRunning(false)
            break
        }
      } catch {
        appendTerminalLine(event.data.replace(/\n/g, '\r\n'))
      }
    }

    ws.onerror = () => {
      appendTerminalLine('\x1b[1;31m[WS] Batch connection error\x1b[0m\r\n')
      setIsRunning(false)
    }

    ws.onclose = () => {
      setIsRunning(false)
    }

  }, [appendTerminalLine, addFlag, setIsRunning])


  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  return { runTool, runBatch, disconnect }
}
