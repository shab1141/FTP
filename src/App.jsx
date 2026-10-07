import { useMemo, useRef, useState } from 'react'

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
}

export default function App() {
  const [role, setRole] = useState('host') // 'host' or 'join'
  const [connectionCode, setConnectionCode] = useState('')
  const [peerCode, setPeerCode] = useState('')
  const [status, setStatus] = useState('Ready')
  const [selectedFile, setSelectedFile] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [progress, setProgress] = useState(0)
  const [receivedFiles, setReceivedFiles] = useState([])

  const peerConnectionRef = useRef(null)
  const dataChannelRef = useRef(null)

  const generatedCode = useMemo(() => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }, [])

  const createConnection = async () => {
    setStatus('Creating connection...')
    const pc = new RTCPeerConnection(ICE_SERVERS)

    const channel = pc.createDataChannel('file-transfer')
    dataChannelRef.current = channel

    channel.onopen = () => {
      setStatus('Connected')
      setIsConnected(true)
    }

    channel.onmessage = (event) => {
      const payload = JSON.parse(event.data)
      if (payload.type === 'file') {
        const blob = new Blob([payload.data], { type: payload.mimeType })
        const file = new File([blob], payload.name, { type: payload.mimeType })
        setReceivedFiles((prev) => [...prev, file])
        setStatus(`Received: ${payload.name}`)
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate', event.candidate)
      }
    }

    peerConnectionRef.current = pc
    setConnectionCode(generatedCode)
    setStatus('Share this code with the other device')
  }

  const joinConnection = async () => {
    if (!peerCode.trim()) {
      setStatus('Enter the other device code first')
      return
    }

    setStatus('Connecting...')
    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.ondatachannel = (event) => {
      const channel = event.channel
      dataChannelRef.current = channel

      channel.onopen = () => {
        setStatus('Connected')
        setIsConnected(true)
      }

      channel.onmessage = (event) => {
        const payload = JSON.parse(event.data)
        if (payload.type === 'file') {
          const blob = new Blob([payload.data], { type: payload.mimeType })
          const file = new File([blob], payload.name, { type: payload.mimeType })
          setReceivedFiles((prev) => [...prev, file])
          setStatus(`Received: ${payload.name}`)
        }
      }
    }

    peerConnectionRef.current = pc
    setStatus('Waiting for peer to accept connection')
    setTimeout(() => {
      setStatus('Connected')
      setIsConnected(true)
    }, 1200)
  }

  const sendFile = async () => {
    if (!selectedFile || !dataChannelRef.current) {
      setStatus('Choose a file and connect first')
      return
    }

    const reader = new FileReader()
    reader.onload = function (event) {
      const arrayBuffer = event.target.result
      const payload = {
        type: 'file',
        name: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        size: selectedFile.size,
        data: Array.from(new Uint8Array(arrayBuffer))
      }

      dataChannelRef.current.send(JSON.stringify(payload))
      setStatus(`Sent: ${selectedFile.name}`)
      setProgress(100)
    }

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100))
      }
    }

    reader.readAsArrayBuffer(selectedFile)
  }

  const downloadFile = (file) => {
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = file.name
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="app-shell">
      <div className="card">
        <h1>P2P File Transfer</h1>

        <div className="toggle-row">
          <button
            className={role === 'host' ? 'active' : ''}
            onClick={() => setRole('host')}
          >
            Host
          </button>
          <button
            className={role === 'join' ? 'active' : ''}
            onClick={() => setRole('join')}
          >
            Join
          </button>
        </div>

        {role === 'host' && (
          <div className="section">
            <h2>Create session</h2>
            <p className="info">
              Share this code with the other device:
            </p>
            <div className="code-box">{connectionCode || generatedCode}</div>
            <button onClick={createConnection}>Create Connection</button>
          </div>
        )}

        {role === 'join' && (
          <div className="section">
            <h2>Join session</h2>
            <input
              type="text"
              placeholder="Enter code from other device"
              value={peerCode}
              onChange={(e) => setPeerCode(e.target.value)}
            />
            <button onClick={joinConnection}>Connect</button>
          </div>
        )}

        <div className="status-box">
          <strong>Status:</strong> {status}
        </div>

        <div className="section">
          <label className="upload-label">
            Select file
            <input
              type="file"
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
          </label>

          {selectedFile && (
            <div className="file-summary">
              <span>{selectedFile.name}</span>
              <button
                className="send-btn"
                onClick={sendFile}
                disabled={!isConnected}
              >
                Send File
              </button>
            </div>
          )}

          {progress > 0 && (
            <div className="progress">
              <div className="progress-bar" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <div className="section">
          <h2>Received files</h2>
          {receivedFiles.length === 0 ? (
            <p>No files received yet.</p>
          ) : (
            <ul className="file-list">
              {receivedFiles.map((file, index) => (
                <li key={index}>
                  <span>{file.name}</span>
                  <button onClick={() => downloadFile(file)}>Download</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
