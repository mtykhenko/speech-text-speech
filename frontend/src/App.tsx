import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Speech-to-Text & Text-to-Speech Platform</h1>
      <p>Welcome to the STT/TTS experiment platform!</p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Status</h2>
        <p>✅ Frontend is running</p>
        <p>🔄 Backend connection: <a href="http://localhost:8000/health" target="_blank">Check health</a></p>
        <p>📚 API Documentation: <a href="http://localhost:8000/docs" target="_blank">View docs</a></p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Coming Soon</h2>
        <ul>
          <li>Speech-to-Text Module</li>
          <li>Text-to-Speech Module</li>
          <li>Voice Cloning Module</li>
          <li>Model Configuration</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '8px' }}>
        <p>Counter demo: {count}</p>
        <button onClick={() => setCount(count + 1)} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Increment
        </button>
      </div>
    </div>
  )
}

export default App
