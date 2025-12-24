import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Auth from './pages/Auth'
import Dashboard from './components/Dashboard'
import Clients from './pages/Clients'
import PersonalTasks from './pages/PersonalTasks'
import Schedule from './pages/Schedule'
import Ideas from './pages/Ideas'
import Connection from './pages/Connection'
import Me from './pages/Me'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('Today')
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f0f0ff 0%, #fff9f0 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '32px', 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            FemWork
          </h1>
          <p style={{ color: '#666' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Auth />
  }

  return (
    <div className="app">
      <main className="main-content">
        {activeTab === 'Today' && <Dashboard />}
        {activeTab === 'Personal' && <PersonalTasks />}
        {activeTab === 'Clients' && <Clients />}
        {activeTab === 'Schedule' && <Schedule />}
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
          className={activeTab === 'Personal' ? 'active' : ''}
          onClick={() => setActiveTab('Personal')}
        >
          <span className="nav-icon">✅</span>
          <span className="nav-label">Personal</span>
        </button>
        <button
          className={activeTab === 'Clients' ? 'active' : ''}
          onClick={() => setActiveTab('Clients')}
        >
          <span className="nav-icon">💼</span>
          <span className="nav-label">Clients</span>
        </button>
        <button
          className={activeTab === 'Schedule' ? 'active' : ''}
          onClick={() => setActiveTab('Schedule')}
        >
          <span className="nav-icon">📅</span>
          <span className="nav-label">Schedule</span>
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