import { useState, useEffect } from 'react'

const IDEAS_KEY = 'femwork_ideas'

export default function Ideas() {
  const [ideas, setIdeas] = useState([])
  const [showAddIdea, setShowAddIdea] = useState(false)
  const [editingIdea, setEditingIdea] = useState(null)
  
  const [ideaText, setIdeaText] = useState('')
  const [ideaCategory, setIdeaCategory] = useState('general')
  const [ideaPriority, setIdeaPriority] = useState('medium')
  const [ideaReminder, setIdeaReminder] = useState('')
  
  const [filter, setFilter] = useState('all')

  const categories = [
    { id: 'general', emoji: '💡', label: 'General' },
    { id: 'work', emoji: '💼', label: 'Work' },
    { id: 'personal', emoji: '✨', label: 'Personal' },
    { id: 'creative', emoji: '🎨', label: 'Creative' },
    { id: 'learning', emoji: '📚', label: 'Learning' },
    { id: 'health', emoji: '🌸', label: 'Health' },
    { id: 'business', emoji: '🚀', label: 'Business' }
  ]

  const priorities = {
    low: { emoji: '⚪', color: '#95A5A6', label: 'Low' },
    medium: { emoji: '🔵', color: '#3498DB', label: 'Medium' },
    high: { emoji: '🟡', color: '#F39C12', label: 'High' },
    urgent: { emoji: '🔴', color: '#E74C3C', label: 'Urgent' }
  }

  useEffect(() => {
    loadIdeas()
    
    // Check reminders every minute
    const interval = setInterval(checkReminders, 60000)
    return () => clearInterval(interval)
  }, [])

  // Check reminders on load
  useEffect(() => {
    checkReminders()
  }, [ideas])

  function loadIdeas() {
    const saved = localStorage.getItem(IDEAS_KEY)
    if (saved) {
      setIdeas(JSON.parse(saved))
    }
  }

  function saveIdeas(newIdeas) {
    localStorage.setItem(IDEAS_KEY, JSON.stringify(newIdeas))
    setIdeas(newIdeas)
  }

  function checkReminders() {
    const now = new Date()
    const updated = ideas.map(idea => {
      if (idea.reminder && !idea.reminderSent) {
        const reminderTime = new Date(idea.reminder)
        
        if (now >= reminderTime) {
          // Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('💡 Idea Reminder', {
              body: idea.text,
              icon: '💡',
              tag: `idea-${idea.id}`
            })
          }
          
          return { ...idea, reminderSent: true }
        }
      }
      return idea
    })
    
    // Only save if reminders were sent
    if (updated.some((idea, idx) => idea.reminderSent !== ideas[idx]?.reminderSent)) {
      saveIdeas(updated)
    }
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  function addIdea() {
    if (!ideaText.trim()) return

    const newIdea = {
      id: Date.now(),
      text: ideaText.trim(),
      category: ideaCategory,
      priority: ideaPriority,
      reminder: ideaReminder || null,
      reminderSent: false,
      created: new Date().toISOString()
    }

    saveIdeas([...ideas, newIdea])
    resetForm()
    setShowAddIdea(false)

    // Request notification permission if reminder is set
    if (ideaReminder) {
      requestNotificationPermission()
    }
  }

  function updateIdea() {
    if (!editingIdea || !ideaText.trim()) return

    const updated = ideas.map(i =>
      i.id === editingIdea.id
        ? {
            ...i,
            text: ideaText.trim(),
            category: ideaCategory,
            priority: ideaPriority,
            reminder: ideaReminder || null,
            reminderSent: ideaReminder !== i.reminder ? false : i.reminderSent
          }
        : i
    )

    saveIdeas(updated)
    resetForm()
    setEditingIdea(null)

    if (ideaReminder) {
      requestNotificationPermission()
    }
  }

  function deleteIdea(id) {
    if (confirm('Delete this idea?')) {
      saveIdeas(ideas.filter(i => i.id !== id))
    }
  }

  function openEditModal(idea) {
    setEditingIdea(idea)
    setIdeaText(idea.text)
    setIdeaCategory(idea.category)
    setIdeaPriority(idea.priority)
    setIdeaReminder(idea.reminder || '')
  }

  function resetForm() {
    setIdeaText('')
    setIdeaCategory('general')
    setIdeaPriority('medium')
    setIdeaReminder('')
  }

  // Filter ideas
  const filteredIdeas = ideas.filter(idea => {
    if (filter === 'all') return true
    if (filter === 'priority') return idea.priority === 'high' || idea.priority === 'urgent'
    if (filter === 'reminders') return idea.reminder && !idea.reminderSent
    return idea.category === filter
  })

  // Sort by priority
  const sortedIdeas = [...filteredIdeas].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>Ideas</h1>

      {/* Filter & Add Button */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '20px',
        overflowX: 'auto',
        paddingBottom: '8px'
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            background: filter === 'all' ? '#c9a87c' : 'white',
            color: filter === 'all' ? 'white' : '#666',
            border: filter === 'all' ? 'none' : '2px solid #e0e0e0',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          All ({ideas.length})
        </button>

        <button
          onClick={() => setFilter('priority')}
          style={{
            padding: '8px 16px',
            background: filter === 'priority' ? '#E74C3C' : 'white',
            color: filter === 'priority' ? 'white' : '#666',
            border: filter === 'priority' ? 'none' : '2px solid #e0e0e0',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          🔥 Priority
        </button>

        <button
          onClick={() => setFilter('reminders')}
          style={{
            padding: '8px 16px',
            background: filter === 'reminders' ? '#9B59B6' : 'white',
            color: filter === 'reminders' ? 'white' : '#666',
            border: filter === 'reminders' ? 'none' : '2px solid #e0e0e0',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          🔔 Reminders
        </button>

        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            style={{
              padding: '8px 16px',
              background: filter === cat.id ? '#c9a87c' : 'white',
              color: filter === cat.id ? 'white' : '#666',
              border: filter === cat.id ? 'none' : '2px solid #e0e0e0',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Add Button */}
      <button
        onClick={() => setShowAddIdea(true)}
        style={{
          width: '100%',
          padding: '16px',
          background: 'linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(201, 168, 124, 0.3)'
        }}
      >
        💡 Add New Idea
      </button>

      {/* Ideas List */}
      {sortedIdeas.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '60px 20px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💡</div>
          <p style={{ color: '#999', fontSize: '15px' }}>
            {filter === 'all' 
              ? 'No ideas yet. Capture your thoughts!' 
              : 'No ideas in this category'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {sortedIdeas.map(idea => {
            const category = categories.find(c => c.id === idea.category)
            const priority = priorities[idea.priority]
            
            return (
              <div
                key={idea.id}
                style={{
                  background: 'white',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: `4px solid ${priority.color}`
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        padding: '4px 10px',
                        background: priority.color,
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {priority.emoji} {priority.label}
                      </span>
                      
                      <span style={{
                        padding: '4px 10px',
                        background: '#f0f0f0',
                        color: '#666',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        {category?.emoji} {category?.label}
                      </span>

                      {idea.reminder && !idea.reminderSent && (
                        <span style={{
                          padding: '4px 10px',
                          background: '#E8F5E9',
                          color: '#27AE60',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 600
                        }}>
                          🔔 {new Date(idea.reminder).toLocaleDateString('en-GB', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>

                    <p style={{ 
                      fontSize: '15px', 
                      lineHeight: '1.5',
                      color: '#2C3E50',
                      margin: 0
                    }}>
                      {idea.text}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                    <button
                      onClick={() => openEditModal(idea)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#3498DB',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '4px 8px'
                      }}
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteIdea(idea.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#E74C3C',
                        fontSize: '18px',
                        cursor: 'pointer',
                        padding: '4px 8px'
                      }}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddIdea || editingIdea) && (
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
            padding: '24px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px' }}>
              {editingIdea ? 'Edit Idea' : 'New Idea'}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Your Idea
              </label>
              <textarea
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="What's your idea?"
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '15px',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Category
              </label>
              <select
                value={ideaCategory}
                onChange={(e) => setIdeaCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '15px'
                }}
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Priority
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {Object.entries(priorities).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => setIdeaPriority(key)}
                    style={{
                      padding: '12px',
                      background: ideaPriority === key ? p.color : 'white',
                      color: ideaPriority === key ? 'white' : '#666',
                      border: ideaPriority === key ? 'none' : '2px solid #e0e0e0',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      textTransform: 'capitalize'
                    }}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Reminder (Optional)
              </label>
              <input
                type="datetime-local"
                value={ideaReminder}
                onChange={(e) => setIdeaReminder(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '15px'
                }}
              />
              <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                💡 Get a notification to revisit this idea
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={editingIdea ? updateIdea : addIdea}
                disabled={!ideaText.trim()}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: ideaText.trim() ? '#c9a87c' : '#ddd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: ideaText.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                {editingIdea ? '✓ Save Changes' : '+ Add Idea'}
              </button>
              <button
                onClick={() => {
                  setShowAddIdea(false)
                  setEditingIdea(null)
                  resetForm()
                }}
                style={{
                  padding: '14px 24px',
                  background: 'white',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '15px',
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
    </div>
  )
}