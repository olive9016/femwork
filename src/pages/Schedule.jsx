import { useState, useEffect } from 'react'
import { getCurrentPhase } from '../lib/cycles'

const SCHEDULE_KEY = 'femwork_daily_schedule'
const CYCLE_KEY = 'femwork_cycle'
const CHECKINS_KEY = 'femwork_daily_checkins'

export default function Schedule() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [schedule, setSchedule] = useState([])
  const [showAddBlock, setShowAddBlock] = useState(false)
  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [rescheduleBlock, setRescheduleBlock] = useState(null)
  const [viewMode, setViewMode] = useState('timeline') // timeline, list, simple
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  
  // Form states
  const [blockTitle, setBlockTitle] = useState('')
  const [blockTime, setBlockTime] = useState('')
  const [blockDuration, setBlockDuration] = useState(30)
  const [blockType, setBlockType] = useState('work') // work, break, self-care, meeting, focus, creative, admin
  const [blockEnergy, setBlockEnergy] = useState('medium') // low, medium, high
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0])
  
  // Context
  const [currentPhase, setCurrentPhase] = useState('Follicular')
  const [todayEnergy, setTodayEnergy] = useState('medium')
  const [currentBlock, setCurrentBlock] = useState(null)

  const blockTypes = {
    work: { emoji: '💼', color: '#c9a87c', label: 'Work' },
    break: { emoji: '☕', color: '#84d4a6', label: 'Break' },
    'self-care': { emoji: '🌸', color: '#ffb6c1', label: 'Self Care' },
    meeting: { emoji: '👥', color: '#87ceeb', label: 'Meeting' },
    focus: { emoji: '🎯', color: '#9b87eb', label: 'Deep Focus' },
    creative: { emoji: '🎨', color: '#ffd700', label: 'Creative' },
    admin: { emoji: '📋', color: '#dda15e', label: 'Admin' }
  }

  useEffect(() => {
    loadSchedule()
    loadContext()
    
    // Update current time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      updateCurrentBlock()
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    updateCurrentBlock()
  }, [schedule, currentTime])

  function loadContext() {
    // Load cycle phase
    const cycleData = localStorage.getItem(CYCLE_KEY)
    if (cycleData) {
      const parsed = JSON.parse(cycleData)
      const phaseInfo = getCurrentPhase(parsed)
      setCurrentPhase(phaseInfo.phase)
    }
    
    // Load today's energy from check-in
    const checkInsData = localStorage.getItem(CHECKINS_KEY)
    if (checkInsData) {
      const checkIns = JSON.parse(checkInsData)
      const today = new Date().toDateString()
      const todayCheckIn = checkIns.find(c => new Date(c.date).toDateString() === today)
      if (todayCheckIn) {
        setTodayEnergy(todayCheckIn.energy.toLowerCase())
      }
    }
  }

  function loadSchedule() {
    const saved = localStorage.getItem(SCHEDULE_KEY)
    if (saved) {
      const data = JSON.parse(saved)
      const selectedSchedule = data.filter(block => 
        new Date(block.date).toISOString().split('T')[0] === selectedDate
      )
      setSchedule(selectedSchedule.sort((a, b) => 
        new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`)
      ))
    }
  }

  // Reload when date changes
  useEffect(() => {
    loadSchedule()
  }, [selectedDate])

  function saveSchedule(newSchedule) {
    const saved = localStorage.getItem(SCHEDULE_KEY)
    let allSchedule = saved ? JSON.parse(saved) : []
    
    // Remove old schedule for selected date
    allSchedule = allSchedule.filter(block => 
      new Date(block.date).toISOString().split('T')[0] !== selectedDate
    )
    
    // Add new schedule
    allSchedule = [...allSchedule, ...newSchedule]
    
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(allSchedule))
    setSchedule(newSchedule.sort((a, b) => 
      new Date(`1970/01/01 ${a.time}`) - new Date(`1970/01/01 ${b.time}`)
    ))
  }

  function addBlock() {
    if (!blockTitle || !blockTime) {
      alert('Please enter a title and time')
      return
    }

    const newBlock = {
      id: Date.now(),
      date: blockDate,
      time: blockTime,
      duration: blockDuration,
      title: blockTitle,
      type: blockType,
      energy: blockEnergy,
      completed: false,
      createdAt: new Date().toISOString()
    }

    // Load all schedule
    const saved = localStorage.getItem(SCHEDULE_KEY)
    let allSchedule = saved ? JSON.parse(saved) : []
    
    // Add new block
    allSchedule.push(newBlock)
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(allSchedule))
    
    // Reload if this block is for selected date
    if (blockDate === selectedDate) {
      loadSchedule()
    }
    
    // Reset form
    setBlockTitle('')
    setBlockTime('')
    setBlockDuration(30)
    setBlockType('work')
    setBlockEnergy('medium')
    setBlockDate(new Date().toISOString().split('T')[0])
    setShowAddBlock(false)
  }

  function toggleComplete(blockId) {
    const updated = schedule.map(block =>
      block.id === blockId ? { ...block, completed: !block.completed } : block
    )
    saveSchedule(updated)
  }

  function deleteBlock(blockId) {
    if (confirm('Delete this time block?')) {
      saveSchedule(schedule.filter(b => b.id !== blockId))
    }
  }

  function openReschedule(block) {
    setRescheduleBlock(block)
    setShowRescheduleModal(true)
  }

  function rescheduleBlockFunc(newTime, newDate) {
    const updated = schedule.map(block =>
      block.id === rescheduleBlock.id 
        ? { 
            ...block, 
            time: newTime,
            date: newDate || block.date
          } 
        : block
    )
    saveSchedule(updated)
    setShowRescheduleModal(false)
    setRescheduleBlock(null)
  }

  function updateCurrentBlock() {
    const now = currentTime
    const currentHour = now.getHours()
    const currentMin = now.getMinutes()
    const currentTimeStr = `${currentHour}:${currentMin}`
    
    const current = schedule.find(block => {
      const [blockHour, blockMin] = block.time.split(':').map(Number)
      const blockEndMin = blockMin + block.duration
      const blockEndHour = blockHour + Math.floor(blockEndMin / 60)
      const adjustedEndMin = blockEndMin % 60
      
      const isAfterStart = currentHour > blockHour || 
        (currentHour === blockHour && currentMin >= blockMin)
      const isBeforeEnd = currentHour < blockEndHour || 
        (currentHour === blockEndHour && currentMin < adjustedEndMin)
      
      return isAfterStart && isBeforeEnd
    })
    
    setCurrentBlock(current)
  }

  function getSmartSuggestions() {
    const suggestions = []
    const now = new Date()
    const hour = now.getHours()
    
    // Morning suggestions (before 10am)
    if (hour < 10 && !schedule.find(b => b.time.startsWith('09'))) {
      suggestions.push({
        time: '09:00',
        duration: 15,
        title: 'Morning grounding ritual',
        type: 'self-care',
        energy: 'low',
        reason: 'Start your day calm'
      })
    }
    
    // Focus block suggestions based on phase
    if (currentPhase === 'Follicular' || currentPhase === 'Ovulatory') {
      if (hour < 12 && !schedule.find(b => b.type === 'focus')) {
        suggestions.push({
          time: '10:00',
          duration: 90,
          title: 'Deep focus work',
          type: 'focus',
          energy: 'high',
          reason: `${currentPhase} phase = great for focused work`
        })
      }
    }
    
    // Break suggestions (every 2 hours)
    const lastBreak = schedule.filter(b => b.type === 'break').pop()
    if (!lastBreak || hour - parseInt(lastBreak.time.split(':')[0]) > 2) {
      const nextHour = hour + 1
      if (nextHour < 18) {
        suggestions.push({
          time: `${nextHour}:00`,
          duration: 15,
          title: 'Movement break',
          type: 'break',
          energy: 'low',
          reason: 'Prevent burnout'
        })
      }
    }
    
    // Low energy afternoon (luteal/menstrual)
    if ((currentPhase === 'Luteal' || currentPhase === 'Menstrual') && 
        hour >= 14 && hour < 16 && 
        !schedule.find(b => b.time.startsWith('15'))) {
      suggestions.push({
        time: '15:00',
        duration: 30,
        title: 'Light admin tasks',
        type: 'admin',
        energy: 'low',
        reason: 'Afternoon dip in your phase'
      })
    }
    
    return suggestions.slice(0, 3)
  }

  function addSuggestion(suggestion) {
    const newBlock = {
      id: Date.now(),
      date: new Date().toISOString(),
      time: suggestion.time,
      duration: suggestion.duration,
      title: suggestion.title,
      type: suggestion.type,
      energy: suggestion.energy,
      completed: false,
      createdAt: new Date().toISOString()
    }
    saveSchedule([...schedule, newBlock])
  }

  function getTimeProgress() {
    const now = currentTime
    const startOfDay = new Date(now)
    startOfDay.setHours(6, 0, 0, 0)
    const endOfDay = new Date(now)
    endOfDay.setHours(22, 0, 0, 0)
    
    const total = endOfDay - startOfDay
    const elapsed = now - startOfDay
    const percent = Math.max(0, Math.min(100, (elapsed / total) * 100))
    
    return percent
  }

  const suggestions = getSmartSuggestions()
  const completedCount = schedule.filter(b => b.completed).length
  const totalBlocks = schedule.length
  const timeProgress = getTimeProgress()

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
      {/* Header with time */}
      <div style={{ textAlign: "center", marginBottom: "24px" }}>
        <h1 style={{ marginBottom: "8px" }}>Daily Schedule</h1>
        <div style={{ fontSize: "32px", fontWeight: 600, color: "#c9a87c", marginBottom: "8px" }}>
          {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div style={{ fontSize: "14px", color: "#666" }}>
          {currentTime.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>

      {/* Current block indicator */}
      {currentBlock && (
        <div style={{
          background: "linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)",
          color: "white",
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(201, 168, 124, 0.3)"
        }}>
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "4px" }}>
            ⏰ Happening now:
          </div>
          <div style={{ fontSize: "20px", fontWeight: 600 }}>
            {blockTypes[currentBlock.type].emoji} {currentBlock.title}
          </div>
          <div style={{ fontSize: "13px", opacity: 0.9, marginTop: "4px" }}>
            Until {currentBlock.time.split(':').map((n, i) => i === 0 ? parseInt(n) + Math.floor(currentBlock.duration/60) : (parseInt(n) + currentBlock.duration%60).toString().padStart(2, '0')).join(':')}
          </div>
        </div>
      )}

      {/* Date Navigation */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => {
              const newDate = new Date(selectedDate)
              newDate.setDate(newDate.getDate() - 1)
              setSelectedDate(newDate.toISOString().split('T')[0])
            }}
            style={{
              padding: "8px 12px",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "18px"
            }}
          >
            ←
          </button>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "15px",
              fontWeight: 600,
              textAlign: "center"
            }}
          />
          
          <button
            onClick={() => {
              const newDate = new Date(selectedDate)
              newDate.setDate(newDate.getDate() + 1)
              setSelectedDate(newDate.toISOString().split('T')[0])
            }}
            style={{
              padding: "8px 12px",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "18px"
            }}
          >
            →
          </button>
          
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            style={{
              padding: "8px 16px",
              background: "#c9a87c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600
            }}
          >
            Today
          </button>
        </div>
        
        <div style={{ 
          textAlign: "center", 
          marginTop: "8px", 
          fontSize: "13px", 
          color: "#666" 
        }}>
          {new Date(selectedDate).toLocaleDateString('en-GB', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
          })}
        </div>
      </div>

      {/* Progress */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>
            Today's Progress
          </span>
          <span style={{ fontSize: "14px", color: "#666" }}>
            {completedCount}/{totalBlocks} blocks
          </span>
        </div>
        <div style={{
          background: "#f0f0f0",
          borderRadius: "8px",
          height: "8px",
          overflow: "hidden"
        }}>
          <div style={{
            background: "linear-gradient(90deg, #c9a87c, #d4a574)",
            height: "100%",
            width: `${totalBlocks > 0 ? (completedCount / totalBlocks) * 100 : 0}%`,
            transition: "width 0.3s"
          }} />
        </div>
        
        {/* Day progress bar */}
        <div style={{ marginTop: "12px" }}>
          <div style={{ fontSize: "12px", color: "#999", marginBottom: "4px" }}>
            Day timeline (6am - 10pm)
          </div>
          <div style={{
            background: "#f0f0f0",
            borderRadius: "8px",
            height: "6px",
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{
              background: "#c9a87c",
              height: "100%",
              width: `${timeProgress}%`,
              transition: "width 60s linear"
            }} />
            <div style={{
              position: "absolute",
              top: "-4px",
              left: `${timeProgress}%`,
              width: "2px",
              height: "14px",
              background: "#c9a87c",
              borderRadius: "2px"
            }} />
          </div>
        </div>
      </div>

      {/* View mode toggle */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "16px",
        background: "#f5f5f5",
        padding: "4px",
        borderRadius: "8px"
      }}>
        {['timeline', 'list', 'simple'].map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            style={{
              flex: 1,
              padding: "8px",
              background: viewMode === mode ? "white" : "transparent",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: viewMode === mode ? 600 : 400,
              cursor: "pointer",
              boxShadow: viewMode === mode ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
            }}
          >
            {mode === 'timeline' ? '📊 Timeline' : 
             mode === 'list' ? '📝 List' : 
             '✨ Simple'}
          </button>
        ))}
      </div>

      {/* Smart suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          background: "#fff9f0",
          border: "2px dashed #c9a87c",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "20px"
        }}>
          <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "12px" }}>
            💡 Smart Suggestions:
          </div>
          {suggestions.map((sug, idx) => (
            <div key={idx} style={{
              background: "white",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                  {blockTypes[sug.type].emoji} {sug.title}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {sug.time} • {sug.duration} min • {sug.reason}
                </div>
              </div>
              <button
                onClick={() => addSuggestion(sug)}
                style={{
                  padding: "6px 12px",
                  background: "#c9a87c",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "12px",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add block button */}
      <button
        onClick={() => setShowAddBlock(true)}
        style={{
          width: "100%",
          padding: "14px",
          background: "linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)",
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(201, 168, 124, 0.3)"
        }}
      >
        + Add Time Block
      </button>

      {/* Schedule display */}
      {schedule.length === 0 ? (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "60px 20px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>📅</div>
          <p style={{ color: "#666", fontSize: "15px", marginBottom: "8px" }}>
            No schedule yet today
          </p>
          <p style={{ color: "#999", fontSize: "13px" }}>
            Add time blocks to structure your day without overwhelm
          </p>
        </div>
      ) : viewMode === 'timeline' ? (
        <TimelineView 
          schedule={schedule}
          blockTypes={blockTypes}
          toggleComplete={toggleComplete}
          deleteBlock={deleteBlock}
          openReschedule={openReschedule}
          currentTime={currentTime}
        />
      ) : viewMode === 'list' ? (
        <ListView 
          schedule={schedule}
          blockTypes={blockTypes}
          toggleComplete={toggleComplete}
          deleteBlock={deleteBlock}
          openReschedule={openReschedule}
        />
      ) : (
        <SimpleView 
          schedule={schedule}
          blockTypes={blockTypes}
          toggleComplete={toggleComplete}
        />
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && rescheduleBlock && (
        <RescheduleModal 
          block={rescheduleBlock}
          onReschedule={rescheduleBlockFunc}
          onCancel={() => {
            setShowRescheduleModal(false)
            setRescheduleBlock(null)
          }}
        />
      )}

      {/* Add block modal */}
      {showAddBlock && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "24px",
            maxWidth: "500px",
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto"
          }}>
            <h3 style={{ marginBottom: "20px" }}>Add Time Block</h3>

            {/* Date */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                Date
              </label>
              <input
                type="date"
                value={blockDate}
                onChange={(e) => setBlockDate(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "15px"
                }}
              />
            </div>

            {/* Title */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                What will you do?
              </label>
              <input
                type="text"
                value={blockTitle}
                onChange={(e) => setBlockTitle(e.target.value)}
                placeholder="E.g., Write blog post, Take a walk..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "15px"
                }}
              />
            </div>

            {/* Time and duration */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                  Start time
                </label>
                <input
                  type="time"
                  value={blockTime}
                  onChange={(e) => setBlockTime(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "15px"
                  }}
                />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                  Duration (min)
                </label>
                <select
                  value={blockDuration}
                  onChange={(e) => setBlockDuration(parseInt(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "15px"
                  }}
                >
                  <option value={15}>15 min</option>
                  <option value={30}>30 min</option>
                  <option value={45}>45 min</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
            </div>

            {/* Type */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                Type
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {Object.entries(blockTypes).map(([key, { emoji, label, color }]) => (
                  <button
                    key={key}
                    onClick={() => setBlockType(key)}
                    style={{
                      padding: "10px",
                      borderRadius: "8px",
                      border: blockType === key ? `2px solid ${color}` : "1px solid #ddd",
                      background: blockType === key ? `${color}15` : "white",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: blockType === key ? 600 : 400,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <span style={{ fontSize: "20px" }}>{emoji}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Energy */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                Energy needed
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                {['low', 'medium', 'high'].map(level => (
                  <button
                    key={level}
                    onClick={() => setBlockEnergy(level)}
                    style={{
                      flex: 1,
                      padding: "10px",
                      borderRadius: "8px",
                      border: blockEnergy === level ? "2px solid #c9a87c" : "1px solid #ddd",
                      background: blockEnergy === level ? "#fff9f0" : "white",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: blockEnergy === level ? 600 : 400
                    }}
                  >
                    {level === 'low' ? '🟢 Low' : level === 'medium' ? '🟡 Medium' : '🔴 High'}
                  </button>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowAddBlock(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "15px"
                }}
              >
                Cancel
              </button>
              <button
                onClick={addBlock}
                disabled={!blockTitle || !blockTime}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: (!blockTitle || !blockTime) ? "#ccc" : "#c9a87c",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: (!blockTitle || !blockTime) ? "not-allowed" : "pointer",
                  fontSize: "15px",
                  fontWeight: 600
                }}
              >
                Add Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Timeline View Component
function TimelineView({ schedule, blockTypes, toggleComplete, deleteBlock, openReschedule, currentTime }) {
  const hours = Array.from({ length: 16 }, (_, i) => i + 6) // 6am to 10pm
  const currentHour = currentTime.getHours()
  const currentMin = currentTime.getMinutes()
  
  // Only show timeline if viewing today
  const isToday = new Date().toDateString() === new Date(schedule[0]?.date || new Date()).toDateString()
  
  return (
    <div style={{
      background: "white",
      borderRadius: "12px",
      padding: "20px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      position: "relative"
    }}>
      {hours.map((hour, index) => {
        const hourBlocks = schedule.filter(b => 
          parseInt(b.time.split(':')[0]) === hour
        )
        const isCurrentHour = currentHour === hour && isToday
        const isPastHour = currentHour > hour && isToday
        
        return (
          <div key={hour}>
            <div style={{
              display: "flex",
              gap: "16px",
              marginBottom: "12px",
              paddingBottom: "12px",
              borderBottom: "1px solid #f0f0f0",
              opacity: isPastHour ? 0.5 : 1
            }}>
              <div style={{
                width: "60px",
                fontSize: "14px",
                fontWeight: isCurrentHour ? 600 : 400,
                color: isCurrentHour ? "#c9a87c" : "#999",
                paddingTop: "4px"
              }}>
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div style={{ flex: 1 }}>
                {hourBlocks.length === 0 ? (
                  <div style={{ 
                    color: "#ddd", 
                    fontSize: "13px",
                    fontStyle: "italic",
                    paddingTop: "4px"
                  }}>
                    —
                  </div>
                ) : (
                  hourBlocks.map(block => {
                    const blockTime = new Date(`1970/01/01 ${block.time}`)
                    const blockEndTime = new Date(blockTime.getTime() + block.duration * 60000)
                    const currentTimeObj = new Date(`1970/01/01 ${currentHour}:${currentMin}`)
                    const isPast = currentTimeObj > blockEndTime && isToday
                    const isCurrent = currentTimeObj >= blockTime && currentTimeObj < blockEndTime && isToday
                    
                    return (
                      <div
                        key={block.id}
                        style={{
                          background: block.completed ? "#f0f0f0" : 
                                      isCurrent ? `${blockTypes[block.type].color}40` :
                                      `${blockTypes[block.type].color}15`,
                          border: block.completed ? "2px solid #ddd" : 
                                  isCurrent ? `3px solid ${blockTypes[block.type].color}` :
                                  `2px solid ${blockTypes[block.type].color}`,
                          borderRadius: "8px",
                          padding: "12px",
                          marginBottom: "8px",
                          position: "relative"
                        }}
                      >
                        {isCurrent && !block.completed && (
                          <div style={{
                            position: "absolute",
                            top: "-2px",
                            right: "-2px",
                            background: "#c9a87c",
                            color: "white",
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 600
                          }}>
                            NOW
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                              <input
                                type="checkbox"
                                checked={block.completed}
                                onChange={() => toggleComplete(block.id)}
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  cursor: "pointer"
                                }}
                              />
                              <span style={{ fontSize: "20px" }}>
                                {blockTypes[block.type].emoji}
                              </span>
                              <span style={{
                                fontSize: "15px",
                                fontWeight: 600,
                                textDecoration: block.completed ? "line-through" : "none"
                              }}>
                                {block.title}
                              </span>
                            </div>
                            <div style={{ fontSize: "12px", color: "#666", marginLeft: "26px" }}>
                              {block.time} • {block.duration} min • {block.energy} energy
                            </div>
                            
                            {/* Reschedule button for incomplete past blocks */}
                            {isPast && !block.completed && (
                              <button
                                onClick={() => openReschedule(block)}
                                style={{
                                  marginTop: "8px",
                                  marginLeft: "26px",
                                  padding: "4px 12px",
                                  background: "#fff9f0",
                                  border: "1px solid #c9a87c",
                                  borderRadius: "6px",
                                  fontSize: "12px",
                                  color: "#c9a87c",
                                  cursor: "pointer",
                                  fontWeight: 600
                                }}
                              >
                                🔄 Reschedule
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => deleteBlock(block.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#999",
                              cursor: "pointer",
                              fontSize: "20px",
                              padding: "0 8px"
                            }}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            
            {/* NOW line - show AFTER the hour if we're past the top of that hour */}
            {isCurrentHour && isToday && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                margin: "8px 0 16px 0"
              }}>
                <div style={{ width: "60px", fontSize: "12px", fontWeight: 600, color: "#c9a87c" }}>
                  {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div style={{
                  flex: 1,
                  height: "3px",
                  background: "linear-gradient(90deg, #c9a87c, transparent)",
                  borderRadius: "2px",
                  position: "relative"
                }}>
                  <div style={{
                    position: "absolute",
                    left: "0",
                    top: "-5px",
                    width: "12px",
                    height: "12px",
                    background: "#c9a87c",
                    borderRadius: "50%",
                    boxShadow: "0 0 8px rgba(201, 168, 124, 0.5)",
                    animation: "pulse 2s infinite"
                  }} />
                </div>
              </div>
            )}
          </div>
        )
      })}
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

// List View Component
function ListView({ schedule, blockTypes, toggleComplete, deleteBlock, openReschedule }) {
  const now = new Date()
  
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      {schedule.map(block => {
        const blockTime = new Date(`1970/01/01 ${block.time}`)
        const blockEndTime = new Date(blockTime.getTime() + block.duration * 60000)
        const currentTimeObj = new Date(`1970/01/01 ${now.getHours()}:${now.getMinutes()}`)
        const isPast = currentTimeObj > blockEndTime
        
        return (
          <div
            key={block.id}
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "16px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              border: `2px solid ${block.completed ? "#ddd" : blockTypes[block.type].color}`,
              opacity: isPast && !block.completed ? 0.6 : 1
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <input
                    type="checkbox"
                    checked={block.completed}
                    onChange={() => toggleComplete(block.id)}
                    style={{
                      width: "20px",
                      height: "20px",
                      cursor: "pointer"
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "4px" }}>
                      {blockTypes[block.type].emoji} {block.title}
                    </div>
                    <div style={{ fontSize: "13px", color: "#666" }}>
                      {block.time} • {block.duration} min • {blockTypes[block.type].label} • {block.energy} energy
                    </div>
                    
                    {/* Reschedule for incomplete past blocks */}
                    {isPast && !block.completed && (
                      <button
                        onClick={() => openReschedule(block)}
                        style={{
                          marginTop: "8px",
                          padding: "6px 12px",
                          background: "#fff9f0",
                          border: "1px solid #c9a87c",
                          borderRadius: "6px",
                          fontSize: "12px",
                          color: "#c9a87c",
                          cursor: "pointer",
                          fontWeight: 600
                        }}
                      >
                        🔄 Reschedule
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => deleteBlock(block.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#999",
                  cursor: "pointer",
                  fontSize: "24px",
                  padding: "0 8px"
                }}
              >
                ×
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Simple View Component (minimal, ADHD-friendly)
function SimpleView({ schedule, blockTypes, toggleComplete }) {
  const nextUp = schedule.find(b => !b.completed)
  const remaining = schedule.filter(b => !b.completed)
  
  return (
    <div>
      {/* Next up - BIG and clear */}
      {nextUp && (
        <div style={{
          background: "linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)",
          color: "white",
          borderRadius: "16px",
          padding: "32px",
          textAlign: "center",
          marginBottom: "20px",
          boxShadow: "0 4px 20px rgba(201, 168, 124, 0.3)"
        }}>
          <div style={{ fontSize: "14px", opacity: 0.9, marginBottom: "8px" }}>
            NEXT UP:
          </div>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>
            {blockTypes[nextUp.type].emoji}
          </div>
          <div style={{ fontSize: "28px", fontWeight: 600, marginBottom: "8px" }}>
            {nextUp.title}
          </div>
          <div style={{ fontSize: "18px", opacity: 0.9, marginBottom: "24px" }}>
            {nextUp.time} • {nextUp.duration} minutes
          </div>
          <button
            onClick={() => toggleComplete(nextUp.id)}
            style={{
              padding: "16px 48px",
              background: "white",
              color: "#c9a87c",
              border: "none",
              borderRadius: "12px",
              fontSize: "18px",
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
            }}
          >
            ✓ Done
          </button>
        </div>
      )}
      
      {/* Remaining blocks - simple list */}
      {remaining.length > 1 && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{ fontSize: "14px", color: "#999", marginBottom: "12px" }}>
            COMING UP:
          </div>
          {remaining.slice(1).map(block => (
            <div
              key={block.id}
              style={{
                padding: "12px",
                marginBottom: "8px",
                borderLeft: `4px solid ${blockTypes[block.type].color}`,
                paddingLeft: "12px"
              }}
            >
              <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                {blockTypes[block.type].emoji} {block.title}
              </div>
              <div style={{ fontSize: "13px", color: "#666" }}>
                {block.time} • {block.duration} min
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* All done! */}
      {remaining.length === 0 && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "60px 20px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🎉</div>
          <div style={{ fontSize: "24px", fontWeight: 600, color: "#c9a87c", marginBottom: "8px" }}>
            All done!
          </div>
          <div style={{ fontSize: "15px", color: "#666" }}>
            You completed your schedule for today
          </div>
        </div>
      )}
    </div>
  )
}

// Reschedule Modal Component
function RescheduleModal({ block, onReschedule, onCancel }) {
  const [newTime, setNewTime] = useState(block.time)
  const [rescheduleToTomorrow, setRescheduleToTomorrow] = useState(false)
  
  function handleReschedule() {
    const newDate = rescheduleToTomorrow 
      ? new Date(new Date().setDate(new Date().getDate() + 1)).toISOString()
      : block.date
    onReschedule(newTime, newDate)
  }
  
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "20px"
    }}>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        maxWidth: "400px",
        width: "100%"
      }}>
        <h3 style={{ marginBottom: "8px" }}>Reschedule Task</h3>
        <p style={{ fontSize: "16px", fontWeight: 600, color: "#666", marginBottom: "20px" }}>
          {block.title}
        </p>
        
        {/* New time */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
            New time
          </label>
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "15px"
            }}
          />
        </div>
        
        {/* Tomorrow option */}
        <label style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "20px",
          cursor: "pointer"
        }}>
          <input
            type="checkbox"
            checked={rescheduleToTomorrow}
            onChange={(e) => setRescheduleToTomorrow(e.target.checked)}
            style={{
              width: "18px",
              height: "18px",
              cursor: "pointer"
            }}
          />
          <span style={{ fontSize: "14px" }}>
            Move to tomorrow
          </span>
        </label>
        
        {/* Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "12px",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleReschedule}
            style={{
              flex: 1,
              padding: "12px",
              background: "#c9a87c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 600
            }}
          >
            Reschedule
          </button>
        </div>
      </div>
    </div>
  )
}