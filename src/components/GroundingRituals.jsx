import { useState, useEffect } from 'react'

const GROUNDING_KEY = 'femwork_grounding_history'

export default function GroundingRituals() {
  const [expanded, setExpanded] = useState(false)
  const [todayCompleted, setTodayCompleted] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    loadHistory()
    checkTodayCompleted()
  }, [])

  function loadHistory() {
    const saved = localStorage.getItem(GROUNDING_KEY)
    if (saved) {
      setHistory(JSON.parse(saved))
    }
  }

  function checkTodayCompleted() {
    const saved = localStorage.getItem(GROUNDING_KEY)
    if (saved) {
      const all = JSON.parse(saved)
      const today = new Date().toDateString()
      const todayEntry = all.find(e => 
        new Date(e.date).toDateString() === today
      )
      if (todayEntry) {
        setTodayCompleted(todayEntry.rituals)
      }
    }
  }

  function toggleRitual(ritual) {
    const updated = todayCompleted.includes(ritual)
      ? todayCompleted.filter(r => r !== ritual)
      : [...todayCompleted, ritual]
    
    setTodayCompleted(updated)
    saveToday(updated)
  }

  function saveToday(rituals) {
    const today = new Date().toISOString().split('T')[0]
    
    // Remove today's old entry
    const filtered = history.filter(e => 
      e.date !== today
    )
    
    // Add new entry
    const newEntry = {
      date: today,
      rituals: rituals,
      timestamp: new Date().toISOString()
    }
    
    const updated = [...filtered, newEntry].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )
    
    localStorage.setItem(GROUNDING_KEY, JSON.stringify(updated))
    setHistory(updated)
  }

  const rituals = [
    { id: 'breathe', emoji: '🫁', label: '5-4-3-2-1 Breathing' },
    { id: 'walk', emoji: '🚶', label: '5-min Walk' },
    { id: 'water', emoji: '💧', label: 'Drink Water' },
    { id: 'stretch', emoji: '🤸', label: 'Body Stretch' },
    { id: 'journal', emoji: '📝', label: 'Quick Journal' },
    { id: 'music', emoji: '🎵', label: 'Calming Music' }
  ]

  // Calculate stats
  const last7Days = history.filter(e => {
    const entryDate = new Date(e.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return entryDate >= weekAgo
  })

  const totalRitualsThisWeek = last7Days.reduce((sum, e) => 
    sum + e.rituals.length, 0
  )

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: expanded ? '20px' : '16px',
      marginBottom: '20px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      cursor: 'pointer'
    }}>
      {/* Collapsed view - minimal */}
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px', margin: 0 }}>
            🧘 Grounding Rituals
          </h3>
          <p style={{ fontSize: '12px', color: '#666', margin: 0, marginTop: '4px' }}>
            {todayCompleted.length} today • {totalRitualsThisWeek} this week
          </p>
        </div>
        <div style={{ 
          fontSize: '20px',
          color: '#999',
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)'
        }}>
          ▼
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div style={{ marginTop: '16px' }} onClick={(e) => e.stopPropagation()}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            marginBottom: '20px'
          }}>
            {rituals.map(ritual => (
              <button
                key={ritual.id}
                onClick={() => toggleRitual(ritual.id)}
                style={{
                  padding: '12px',
                  background: todayCompleted.includes(ritual.id) 
                    ? '#E8F5E9' 
                    : 'white',
                  border: `2px solid ${todayCompleted.includes(ritual.id) 
                    ? '#4CAF50' 
                    : '#ddd'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                  {ritual.emoji}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>
                  {ritual.label}
                </div>
              </button>
            ))}
          </div>

          {/* History */}
          {last7Days.length > 0 && (
            <details style={{ marginTop: '16px' }}>
              <summary style={{
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#666',
                padding: '8px 0'
              }}>
                View history (last 7 days)
              </summary>
              <div style={{ marginTop: '12px' }}>
                {last7Days.map(entry => (
                  <div
                    key={entry.date}
                    style={{
                      padding: '8px 12px',
                      background: '#f9f9f9',
                      borderRadius: '6px',
                      marginBottom: '6px',
                      fontSize: '12px'
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                      {new Date(entry.date).toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </div>
                    <div style={{ color: '#666' }}>
                      {entry.rituals.map(id => 
                        rituals.find(r => r.id === id)?.emoji
                      ).join(' ')} ({entry.rituals.length} ritual{entry.rituals.length !== 1 ? 's' : ''})
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Encouragement */}
          {todayCompleted.length > 0 && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#E8F5E9',
              border: '1px solid #4CAF50',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#2E7D32',
              textAlign: 'center'
            }}>
              💚 {todayCompleted.length === 1 
                ? 'Great start! Every ritual counts.' 
                : `${todayCompleted.length} rituals today - you're taking care of yourself!`}
            </div>
          )}
        </div>
      )}
    </div>
  )
}