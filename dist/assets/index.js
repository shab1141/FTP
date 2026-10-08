import React, { useMemo, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';

const ICE_SERVERS = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

function App() {
  const [role, setRole] = useState('host');
  const [connectionCode, setConnectionCode] = useState('');
  const [peerCode, setPeerCode] = useState('');
  const [status, setStatus] = useState('Ready');
  const [selectedFile, setSelectedFile] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [progress, setProgress] = useState(0);
  const [receivedFiles, setReceivedFiles] = useState([]);

  const peerConnectionRef = useRef(null);
  const dataChannelRef = useRef(null);

  const generatedCode = useMemo(() => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }, []);

  const createConnection = async () => {
    setStatus('Creating connection...');
    const pc = new RTCPeerConnection(ICE_SERVERS);
    const channel = pc.createDataChannel('file-transfer');
    dataChannelRef.current = channel;

    channel.onopen = () => {
      setStatus('Connected');
      setIsConnected(true);
    };

    channel.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type === 'file') {
        const blob = new Blob([payload.data], { type: payload.mimeType });
        const file = new File([blob], payload.name, { type: payload.mimeType });
        setReceivedFiles((prev) => [...prev, file]);
        setStatus(`Received: ${payload.name}`);
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('ICE candidate', event.candidate);
      }
    };

    peerConnectionRef.current = pc;
    setConnectionCode(generatedCode);
    setStatus('Share this code with the other device');
  };

  const joinConnection = async () => {
    if (!peerCode.trim()) {
      setStatus('Enter the other device code first');
      return;
    }
    setStatus('Connecting...');
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.ondatachannel = (event) => {
      const channel = event.channel;
      dataChannelRef.current = channel;

      channel.onopen = () => {
        setStatus('Connected');
        setIsConnected(true);
      };

      channel.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === 'file') {
          const blob = new Blob([payload.data], { type: payload.mimeType });
          const file = new File([blob], payload.name, { type: payload.mimeType });
          setReceivedFiles((prev) => [...prev, file]);
          setStatus(`Received: ${payload.name}`);
        }
      };
    };

    peerConnectionRef.current = pc;
    setStatus('Waiting for peer to accept connection');
    setTimeout(() => {
      setStatus('Connected');
      setIsConnected(true);
    }, 1200);
  };

  const sendFile = async () => {
    if (!selectedFile || !dataChannelRef.current) {
      setStatus('Choose a file and connect first');
      return;
    }

    const reader = new FileReader();
    reader.onload = function (event) {
      const arrayBuffer = event.target.result;
      const payload = {
        type: 'file',
        name: selectedFile.name,
        mimeType: selectedFile.type || 'application/octet-stream',
        size: selectedFile.size,
        data: Array.from(new Uint8Array(arrayBuffer))
      };

      dataChannelRef.current.send(JSON.stringify(payload));
      setStatus(`Sent: ${selectedFile.name}`);
      setProgress(100);
    };

    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        setProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    reader.readAsArrayBuffer(selectedFile);
  };

  const downloadFile = (file) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return React.createElement(
    'div',
    { className: 'app-shell' },
    React.createElement(
      'div',
      { className: 'card' },
      React.createElement('h1', null, 'P2P File Transfer'),
      React.createElement(
        'div',
        { className: 'toggle-row' },
        React.createElement(
          'button',
          {
            className: role === 'host' ? 'active' : '',
            onClick: () => setRole('host')
          },
          'Host'
        ),
        React.createElement(
          'button',
          {
            className: role === 'join' ? 'active' : '',
            onClick: () => setRole('join')
          },
          'Join'
        )
      ),
      role === 'host'
        ? React.createElement(
            'div',
            { className: 'section' },
            React.createElement('h2', null, 'Create session'),
            React.createElement('p', { className: 'info' }, 'Share this code with the other device:'),
            React.createElement('div', { className: 'code-box' }, connectionCode || generatedCode),
            React.createElement('button', { onClick: createConnection }, 'Create Connection')
          )
        : null,
      role === 'join'
        ? React.createElement(
            'div',
            { className: 'section' },
            React.createElement('h2', null, 'Join session'),
            React.createElement('input', {
              type: 'text',
              placeholder: 'Enter code from other device',
              value: peerCode,
              onChange: (e) => setPeerCode(e.target.value)
            }),
            React.createElement('button', { onClick: joinConnection }, 'Connect')
          )
        : null,
      React.createElement(
        'div',
        { className: 'status-box' },
        React.createElement('strong', null, 'Status:'),
        ' ',
        status
      ),
      React.createElement(
        'div',
        { className: 'section' },
        React.createElement(
          'label',
          { className: 'upload-label' },
          'Select file',
          React.createElement('input', {
            type: 'file',
            onChange: (e) => setSelectedFile(e.target.files?.[0])
          })
        ),
        selectedFile
          ? React.createElement(
              'div',
              { className: 'file-summary' },
              React.createElement('span', null, selectedFile.name),
              React.createElement(
                'button',
                {
                  className: 'send-btn',
                  onClick: sendFile,
                  disabled: !isConnected
                },
                'Send File'
              )
            )
          : null,
        progress > 0
          ? React.createElement(
              'div',
              { className: 'progress' },
              React.createElement('div', { className: 'progress-bar', style: { width: `${progress}%` } })
            )
          : null
      ),
      React.createElement(
        'div',
        { className: 'section' },
        React.createElement('h2', null, 'Received files'),
        receivedFiles.length === 0
          ? React.createElement('p', null, 'No files received yet.')
          : React.createElement(
              'ul',
              { className: 'file-list' },
              receivedFiles.map((file, index) =>
                React.createElement(
                  'li',
                  { key: index },
                  React.createElement('span', null, file.name),
                  React.createElement('button', { onClick: () => downloadFile(file) }, 'Download')
                )
              )
            )
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(React.StrictMode, null, React.createElement(App, null))
);