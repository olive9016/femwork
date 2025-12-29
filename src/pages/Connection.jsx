import { useState, useEffect } from 'react'

const CONNECTION_KEY = 'femwork_connection_history'
const CYCLE_KEY = 'femwork_cycle'

export default function Connection() {
  const [reflections, setReflections] = useState([])
  const [showReflect, setShowReflect] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [response, setResponse] = useState('')
  const [currentPhase, setCurrentPhase] = useState('Follicular')

  useEffect(() => {
    loadReflections()
    loadPhase()
  }, [])

  function loadPhase() {
    const cycleData = localStorage.getItem(CYCLE_KEY)
    if (cycleData) {
      try {
        const parsed = JSON.parse(cycleData)
        const phase = getCurrentPhase(parsed)
        setCurrentPhase(phase)
      } catch (e) {
        console.error('Error loading phase:', e)
      }
    }
  }

  function getCurrentPhase(cycleData) {
    if (!cycleData || !cycleData.start_date) return 'Follicular'
    
    const start = new Date(cycleData.start_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
    const cycleDay = (diff % (cycleData.cycle_length || 28)) + 1
    
    if (cycleDay >= 1 && cycleDay <= 5) return 'Menstrual'
    if (cycleDay >= 6 && cycleDay <= 13) return 'Follicular'
    if (cycleDay >= 14 && cycleDay <= 16) return 'Ovulatory'
    return 'Luteal'
  }

  function loadReflections() {
    const saved = localStorage.getItem(CONNECTION_KEY)
    if (saved) {
      setReflections(JSON.parse(saved))
    }
  }

  function saveReflection() {
    if (!response.trim()) return

    const newReflection = {
      id: Date.now(),
      prompt: selectedPrompt.text,
      category: selectedPrompt.category,
      response: response.trim(),
      phase: currentPhase,
      date: new Date().toISOString()
    }

    const updated = [newReflection, ...reflections]
    localStorage.setItem(CONNECTION_KEY, JSON.stringify(updated))
    setReflections(updated)
    
    setResponse('')
    setShowReflect(false)
    setSelectedPrompt(null)
  }

  function deleteReflection(id) {
    if (confirm('Delete this reflection?')) {
      const updated = reflections.filter(r => r.id !== id)
      localStorage.setItem(CONNECTION_KEY, JSON.stringify(updated))
      setReflections(updated)
    }
  }

  const promptCategories = {
    'Self-Reflection': {
      emoji: '🪞',
      color: '#9B59B6',
      prompts: [
        'What am I grateful for today?',
        'What energy am I bringing into today?',
        'What do I need to release or let go of?',
        'What would make today feel successful?',
        'How am I feeling in my body right now?'
      ]
    },
    'Cycle Awareness': {
      emoji: '🌙',
      color: '#E91E63',
      prompts: [
        'What does my cycle phase need from me today?',
        'How is my body feeling in this phase?',
        'What activities feel aligned with my energy right now?',
        'What patterns am I noticing in this phase?',
        'How can I honour where I am in my cycle?'
      ]
    },
    'Emotional Check-in': {
      emoji: '💗',
      color: '#F06292',
      prompts: [
        'What emotion is present for me right now?',
        'What do I need to feel supported today?',
        'What would self-compassion look like today?',
        'What boundary do I need to set?',
        'What am I proud of myself for recently?'
      ]
    },
    'Future Self': {
      emoji: '✨',
      color: '#FFB74D',
      prompts: [
        'What does my future self want me to know?',
        'What small step can I take toward my goals?',
        'What do I want to remember about this moment?',
        'How do I want to grow this month?',
        'What would my wisest self tell me right now?'
      ]
    },
    'Relationship': {
      emoji: '🤝',
      color: '#66BB6A',
      prompts: [
        'How can I show up better in my relationships?',
        'What do I need to communicate to someone?',
        'How can I support my partner today?',
        'What relationship pattern am I noticing?',
        'How can I be more present with loved ones?'
      ]
    }
  }

  function openPrompt(category, prompt) {
    setSelectedPrompt({ category, text: prompt })
    setShowReflect(true)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '12px' }}>Connection</h1>
      <p style={{ textAlign: 'center', color: '#666', fontSize: '14px', marginBottom: '32px' }}>
        Reflect, reconnect, and check in with yourself
      </p>

      {/* Reflection Prompts by Category */}
      {Object.entries(promptCategories).map(([category, data]) => (
        <div
          key={category}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            borderLeft: `4px solid ${data.color}`
          }}
        >
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            marginBottom: '16px',
            color: data.color 
          }}>
            {data.emoji} {category}
          </h3>

          <div style={{ display: 'grid', gap: '12px' }}>
            {data.prompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => openPrompt(category, prompt)}
                style={{
                  padding: '16px',
                  background: '#f9f9f9',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '14px',
                  color: '#2C3E50',
                  transition: 'all 0.2s',
                  fontWeight: 500,
                  lineHeight: '1.5'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = `${data.color}15`
                  e.currentTarget.style.borderColor = data.color
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#f9f9f9'
                  e.currentTarget.style.borderColor = '#e0e0e0'
                }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* Past Reflections */}
      {reflections.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            📖 Past Reflections
          </h3>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            {reflections.slice(0, 20).map(reflection => {
              const category = promptCategories[reflection.category]
              const date = new Date(reflection.date)
              
              return (
                <div
                  key={reflection.id}
                  style={{
                    padding: '16px',
                    background: '#f9f9f9',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    borderLeft: `4px solid ${category?.color || '#999'}`
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '13px', 
                        color: category?.color || '#666',
                        fontWeight: 600,
                        marginBottom: '4px'
                      }}>
                        {category?.emoji} {reflection.category}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        fontWeight: 600,
                        color: '#2C3E50',
                        marginBottom: '8px',
                        lineHeight: '1.4'
                      }}>
                        "{reflection.prompt}"
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#555',
                        lineHeight: '1.6',
                        marginBottom: '8px'
                      }}>
                        {reflection.response}
                      </div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        {date.toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })} • {reflection.phase} phase
                      </div>
                    </div>
                    <button
                      onClick={() => deleteReflection(reflection.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#E74C3C',
                        fontSize: '16px',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        marginLeft: '12px'
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reflection Modal */}
      {showReflect && selectedPrompt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: `3px solid ${promptCategories[selectedPrompt.category]?.color}`
            }}>
              <div style={{ 
                fontSize: '13px', 
                color: promptCategories[selectedPrompt.category]?.color,
                fontWeight: 600,
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {promptCategories[selectedPrompt.category]?.emoji} {selectedPrompt.category}
              </div>
              <h3 style={{ 
                fontSize: '22px', 
                fontWeight: 700, 
                lineHeight: '1.4',
                color: '#2C3E50',
                margin: 0
              }}>
                {selectedPrompt.text}
              </h3>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Take your time... write whatever comes to you"
                rows={8}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  lineHeight: '1.6'
                }}
                autoFocus
              />
              <div style={{ 
                fontSize: '12px', 
                color: '#999', 
                marginTop: '8px',
                textAlign: 'right'
              }}>
                {response.length} characters
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={saveReflection}
                disabled={!response.trim()}
                style={{
                  flex: 1,
                  padding: '16px',
                  background: response.trim() 
                    ? promptCategories[selectedPrompt.category]?.color 
                    : '#ddd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: response.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                ✓ Save Reflection
              </button>
              <button
                onClick={() => {
                  setShowReflect(false)
                  setSelectedPrompt(null)
                  setResponse('')
                }}
                style={{
                  padding: '16px 32px',
                  background: 'white',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {reflections.length === 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💭</div>
          <p style={{ color: '#666', fontSize: '15px', lineHeight: '1.6' }}>
            No reflections yet. Choose a prompt above to start connecting with yourself.
          </p>
        </div>
      )}
    </div>
  )
}