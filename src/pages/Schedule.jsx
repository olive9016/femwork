import { useState, useEffect } from 'react'

const SCHEDULE_KEY = 'femwork_daily_schedule'

// EXPANDED TYPE OPTIONS - 12 types total
const blockTypes = {
  // Original types
  work: { emoji: '💼', label: 'Work', color: '#F39C12' },
  break: { emoji: '☕', label: 'Break', color: '#27AE60' },
  'self-care': { emoji: '🌸', label: 'Self Care', color: '#E91E63' },
  meeting: { emoji: '👥', label: 'Meeting', color: '#3498DB' },
  focus: { emoji: '🎯', label: 'Deep Focus', color: '#9B59B6' },
  creative: { emoji: '🎨', label: 'Creative', color: '#F1C40F' },
  admin: { emoji: '📋', label: 'Admin', color: '#95A5A6' },
  
  // NEW TYPES
  personal: { emoji: '✅', label: 'Personal Task', color: '#16A085' },
  wellness: { emoji: '🧘', label: 'Wellness', color: '#8E44AD' },
  exercise: { emoji: '💪', label: 'Exercise', color: '#E74C3C' },
  meal: { emoji: '🍽️', label: 'Meal Time', color: '#D35400' },
  social: { emoji: '🤝', label: 'Social', color: '#2ECC71' }
}

export default function Schedule() {
  const [schedule, setSchedule] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [editingBlock, setEditingBlock] = useState(null)
  const [draggedBlock, setDraggedBlock] = useState(null)
  
  // Form state
  const [blockTitle, setBlockTitle] = useState('')
  const [blockTime, setBlockTime] = useState('09:00')
  const [blockDuration, setBlockDuration] = useState(60)
  const [customDuration, setCustomDuration] = useState('')
  const [blockType, setBlockType] = useState('work')
  const [blockEnergy, setBlockEnergy] = useState('medium')
  const [blockRepeat, setBlockRepeat] = useState('none')

  useEffect(() => {
    loadSchedule()
  }, [])

  // Listen for updates from other components
  useEffect(() => {
    const handleUpdate = () => loadSchedule()
    window.addEventListener('femwork-schedule-updated', handleUpdate)
    return () => window.removeEventListener('femwork-schedule-updated', handleUpdate)
  }, [])

  function loadSchedule() {
    const saved = localStorage.getItem(SCHEDULE_KEY)
    if (saved) {
      setSchedule(JSON.parse(saved))
    }
  }

  function saveSchedule(newSchedule) {
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(newSchedule))
    setSchedule(newSchedule)
  }

  function addBlock() {
    if (!blockTitle.trim()) return

    const duration = customDuration ? parseInt(customDuration) : blockDuration

    const newBlock = {
      id: Date.now(),
      date: selectedDate,
      time: blockTime,
      duration: duration,
      title: blockTitle.trim(),
      type: blockType,
      energy: blockEnergy,
      repeat: blockRepeat,
      completed: false
    }

    saveSchedule([...schedule, newBlock])
    resetForm()
    setShowAddBlock(false)
  }

  function editBlock() {
    if (!editingBlock || !blockTitle.trim()) return

    const duration = customDuration ? parseInt(customDuration) : blockDuration

    const updated = schedule.map(b =>
      b.id === editingBlock.id
        ? {
            ...b,
            date: selectedDate,
            title: blockTitle.trim(),
            time: blockTime,
            duration: duration,
            type: blockType,
            energy: blockEnergy,
            repeat: blockRepeat
          }
        : b
    )

    saveSchedule(updated)
    resetForm()
    setEditingBlock(null)
  }

  function deleteBlock(id) {
    if (confirm('Delete this time block?')) {
      saveSchedule(schedule.filter(b => b.id !== id))
    }
  }

  function openEditModal(block) {
    setEditingBlock(block)
    setBlockTitle(block.title)
    setBlockTime(block.time)
    setBlockDuration(block.duration)
    setCustomDuration('')
    setBlockType(block.type)
    setBlockEnergy(block.energy)
    setBlockRepeat(block.repeat || 'none')
    setSelectedDate(block.date)
  }

  function resetForm() {
    setBlockTitle('')
    setBlockTime('09:00')
    setBlockDuration(60)
    setCustomDuration('')
    setBlockType('work')
    setBlockEnergy('medium')
    setBlockRepeat('none')
  }

  // DRAG AND DROP
  function handleDragStart(block, e) {
    setDraggedBlock(block)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  function handleDrop(targetHour, e) {
    e.preventDefault()
    if (!draggedBlock) return

    const newTime = `${targetHour.toString().padStart(2, '0')}:00`

    const updated = schedule.map(b =>
      b.id === draggedBlock.id ? { ...b, time: newTime, date: selectedDate } : b
    )

    saveSchedule(updated)
    setDraggedBlock(null)
  }

  // OVERLAP DETECTION
  function detectOverlaps(scheduleBlocks) {
    const overlaps = []
    const dateBlocks = scheduleBlocks.filter(b => b.date === selectedDate)

    dateBlocks.forEach((block, index) => {
      const blockStart = parseTime(block.time)
      const blockEnd = blockStart + block.duration

      dateBlocks.forEach((otherBlock, otherIndex) => {
        if (index >= otherIndex) return

        const otherStart = parseTime(otherBlock.time)
        const otherEnd = otherStart + otherBlock.duration

        if (blockStart < otherEnd && blockEnd > otherStart) {
          overlaps.push({
            block1: block,
            block2: otherBlock,
            overlapMinutes: Math.min(blockEnd, otherEnd) - Math.max(blockStart, otherStart)
          })
        }
      })
    })

    return overlaps
  }

  function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  function isOverlapping(block, overlaps) {
    return overlaps.some(o => o.block1.id === block.id || o.block2.id === block.id)
  }

  // Filter schedule for selected date
  const todayBlocks = schedule.filter(b => b.date === selectedDate).sort((a, b) => {
    return parseTime(a.time) - parseTime(b.time)
  })

  const overlaps = detectOverlaps(schedule)

  // Generate hours 6am-11pm
  const hours = Array.from({ length: 18 }, (_, i) => i + 6)

  // Calculate NOW line position
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinute = now.getMinutes()
  const isToday = selectedDate === new Date().toISOString().split('T')[0]

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>Schedule</h1>

      {/* Date Selector */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{
            flex: 1,
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '15px'
          }}
        />
        <button
          onClick={() => setShowAddBlock(true)}
          style={{
            padding: '12px 24px',
            background: '#c9a87c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          + Add Block
        </button>
      </div>

      {/* Overlap Warning */}
      {overlaps.length > 0 && (
        <div style={{
          background: '#FFF3CD',
          border: '2px solid #FFE69C',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#856404' }}>
            ⚠️ Schedule Conflicts Detected
          </div>
          {overlaps.map((overlap, idx) => (
            <div key={idx} style={{ fontSize: '13px', color: '#856404', marginBottom: '4px' }}>
              • "{overlap.block1.title}" overlaps with "{overlap.block2.title}" ({overlap.overlapMinutes} min)
            </div>
          ))}
        </div>
      )}

      {/* Timeline View */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        position: 'relative'
      }}>
        {hours.map(hour => {
          const showNowLine = isToday && currentHour === hour
          const nowLineOffset = showNowLine ? (currentMinute / 60) * 60 : 0

          return (
            <div
              key={hour}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(hour, e)}
              style={{
                minHeight: '60px',
                borderBottom: '1px solid #f0f0f0',
                padding: '8px 0',
                position: 'relative',
                background: draggedBlock ? 'rgba(201, 168, 124, 0.05)' : 'transparent',
                transition: 'background 0.2s'
              }}
            >
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '8px' }}>
                {hour.toString().padStart(2, '0')}:00
              </div>

              {todayBlocks
                .filter(b => {
                  const blockHour = parseInt(b.time.split(':')[0])
                  return blockHour === hour
                })
                .map(block => (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => handleDragStart(block, e)}
                    onClick={() => openEditModal(block)}
                    style={{
                      padding: '12px',
                      background: blockTypes[block.type]?.color || '#999',
                      color: 'white',
                      borderRadius: '8px',
                      marginBottom: '8px',
                      cursor: 'move',
                      opacity: draggedBlock?.id === block.id ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                      border: isOverlapping(block, overlaps) ? '3px solid #E74C3C' : 'none',
                      boxShadow: isOverlapping(block, overlaps)
                        ? '0 0 0 3px rgba(231, 76, 60, 0.2)'
                        : '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                          {blockTypes[block.type]?.emoji} {block.title}
                          {block.repeat && block.repeat !== 'none' && (
                            <span style={{
                              marginLeft: '8px',
                              fontSize: '11px',
                              background: 'rgba(255,255,255,0.3)',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 600
                            }}>
                              🔄 {block.repeat}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.9 }}>
                          {block.time} • {block.duration} min • {block.energy} energy
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteBlock(block.id)
                        }}
                        style={{
                          background: 'rgba(255,255,255,0.3)',
                          border: 'none',
                          color: 'white',
                          fontSize: '18px',
                          cursor: 'pointer',
                          borderRadius: '4px',
                          padding: '4px 8px'
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}

              {/* NOW LINE */}
              {showNowLine && (
                <div style={{
                  position: 'absolute',
                  left: '60px',
                  right: '20px',
                  top: `${30 + nowLineOffset}px`,
                  height: '2px',
                  background: '#E74C3C',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <div style={{
                    position: 'absolute',
                    left: '-60px',
                    background: '#E74C3C',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    whiteSpace: 'nowrap'
                  }}>
                    NOW {currentHour.toString().padStart(2, '0')}:{currentMinute.toString().padStart(2, '0')}
                  </div>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: '#E74C3C',
                    borderRadius: '50%',
                    marginLeft: '-4px'
                  }} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add/Edit Block Modal */}
      {(showAddBlock || editingBlock) && (
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
              {editingBlock ? 'Edit Time Block' : 'Add Time Block'}
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Title
              </label>
              <input
                type="text"
                value={blockTitle}
                onChange={(e) => setBlockTitle(e.target.value)}
                placeholder="What are you doing?"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '15px'
                }}
                autoFocus
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Time
              </label>
              <input
                type="time"
                value={blockTime}
                onChange={(e) => setBlockTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '15px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Duration
              </label>
              <select
                value={blockDuration}
                onChange={(e) => {
                  setBlockDuration(parseInt(e.target.value))
                  setCustomDuration('')
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '15px',
                  marginBottom: '8px'
                }}
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
                <option value={150}>2.5 hours</option>
                <option value={180}>3 hours</option>
                <option value={210}>3.5 hours</option>
                <option value={240}>4 hours</option>
                <option value={270}>4.5 hours</option>
                <option value={300}>5 hours</option>
                <option value={330}>5.5 hours</option>
                <option value={360}>6 hours</option>
              </select>

              <input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="Or enter custom minutes (e.g., 105 for 1h 45m)"
                min={5}
                max={480}
                step={5}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '14px'
                }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Type
              </label>
              <select
                value={blockType}
                onChange={(e) => setBlockType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '15px'
                }}
              >
                {Object.entries(blockTypes).map(([key, type]) => (
                  <option key={key} value={key}>
                    {type.emoji} {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Energy Required
              </label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['low', 'medium', 'high'].map(level => (
                  <button
                    key={level}
                    onClick={() => setBlockEnergy(level)}
                    style={{
                      flex: 1,
                      padding: '10px',
                      background: blockEnergy === level ? '#c9a87c' : 'white',
                      color: blockEnergy === level ? 'white' : '#666',
                      border: blockEnergy === level ? 'none' : '1px solid #ddd',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                      fontWeight: 600
                    }}
                  >
                    {level === 'low' && '🟢'}
                    {level === 'medium' && '🟡'}
                    {level === 'high' && '🔴'} {level}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                Repeat
              </label>
              <select
                value={blockRepeat}
                onChange={(e) => setBlockRepeat(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '15px'
                }}
              >
                <option value="none">No repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (same day)</option>
                <option value="biweekly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </select>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
                💡 Repeating blocks help you build routines
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={editingBlock ? editBlock : addBlock}
                disabled={!blockTitle.trim()}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: blockTitle.trim() ? '#c9a87c' : '#ddd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: blockTitle.trim() ? 'pointer' : 'not-allowed'
                }}
              >
                {editingBlock ? '✓ Save Changes' : '+ Add Block'}
              </button>
              <button
                onClick={() => {
                  setShowAddBlock(false)
                  setEditingBlock(null)
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