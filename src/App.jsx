import { useState } from 'react'
import './App.css'
import Dashboard from './components/Dashboard'
import Clients from './pages/Clients'
import Ideas from './pages/Ideas'
import Connection from './pages/Connection'
import Me from './pages/Me'

function App() {
  const [activeTab, setActiveTab] = useState('Today')

  return (
    <div className="app">
      <main className="main-content">
        {activeTab === 'Today' && <Dashboard />}
        {activeTab === 'Clients' && <Clients />}
        {activeTab === 'Ideas' && <Ideas />}
        {activeTab === 'Connection' && <Connection />}
        {activeTab === 'Me' && <Me />}
      </main>

      <nav className="bottom-nav">
        <button
          className={activeTab === 'Today' ? 'active' : ''}
          onClick={() => setActiveTab('Today')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Today</span>
        </button>
        <button
          className={activeTab === 'Clients' ? 'active' : ''}
          onClick={() => setActiveTab('Clients')}
        >
          <span className="nav-icon">👥</span>
          <span className="nav-label">Clients</span>
        </button>
        <button
          className={activeTab === 'Ideas' ? 'active' : ''}
          onClick={() => setActiveTab('Ideas')}
        >
          <span className="nav-icon">💡</span>
          <span className="nav-label">Ideas</span>
        </button>
        <button
          className={activeTab === 'Connection' ? 'active' : ''}
          onClick={() => setActiveTab('Connection')}
        >
          <span className="nav-icon">🤝</span>
          <span className="nav-label">Connection</span>
        </button>
        <button
          className={activeTab === 'Me' ? 'active' : ''}
          onClick={() => setActiveTab('Me')}
        >
          <span className="nav-icon">🌸</span>
          <span className="nav-label">Me</span>
        </button>
      </nav>
    </div>
  )
}

export default App