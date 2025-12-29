import { useState, useEffect } from 'react'
import DailyCheckIn from './DailyCheckIn'
import GroundingRituals from './GroundingRituals'

const CYCLE_KEY = 'femwork_cycle'
const CHECKINS_KEY = 'femwork_daily_checkins'
const CLIENTS_KEY = 'femwork_clients'
const PERSONAL_TASKS_KEY = 'femwork_personal_tasks'
const SCHEDULE_KEY = 'femwork_daily_schedule'

function getCurrentPhase(cycleData) {
  if (!cycleData || !cycleData.start_date) return 'Follicular'
  
  const start = new Date(cycleData.start_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  const cycleLength = cycleData.cycle_length || 28
  const cycleDay = (diff % cycleLength) + 1
  
  if (cycleDay >= 1 && cycleDay <= 5) return 'Menstrual'
  if (cycleDay >= 6 && cycleDay <= 13) return 'Follicular'
  if (cycleDay >= 14 && cycleDay <= 16) return 'Ovulatory'
  return 'Luteal'
}

export default function Dashboard() {
  const [checkInDone, setCheckInDone] = useState(false)
  const [todayCheckIn, setTodayCheckIn] = useState(null)
  const [phase, setPhase] = useState('Follicular')
  const [allTasks, setAllTasks] = useState([])
  const [selectedTasks, setSelectedTasks] = useState([])
  const [capacity, setCapacity] = useState(3)

  useEffect(() => {
    loadTodayCheckIn()
    loadPhase()
    loadAllTasks()
  }, [])

  function loadPhase() {
    const cycleData = localStorage.getItem(CYCLE_KEY)
    if (cycleData) {
      try {
        const parsed = JSON.parse(cycleData)
        const currentPhase = getCurrentPhase(parsed)
        setPhase(currentPhase)
      } catch (e) {
        console.error('Error loading phase:', e)
      }
    }
  }

  function loadTodayCheckIn() {
    const checkIns = JSON.parse(localStorage.getItem(CHECKINS_KEY) || '[]')
    const today = new Date().toDateString()
    const todayEntry = checkIns.find(c => 
      new Date(c.date).toDateString() === today
    )
    
    if (todayEntry) {
      setTodayCheckIn(todayEntry)
      setCheckInDone(true)
      setCapacity(todayEntry.capacity || 3)
    }
  }

  function loadAllTasks() {
    // Load client tasks
    const clientData = JSON.parse(localStorage.getItem(CLIENTS_KEY) || '[]')
    const clientTasks = clientData.flatMap(client => 
      (client.tasks || []).filter(task => !task.completed).map(task => ({
        ...task,
        source: 'client',
        clientName: client.name,
        type: 'client'
      }))
    )

    // Load personal tasks
    const personalData = JSON.parse(localStorage.getItem(PERSONAL_TASKS_KEY) || '{}')
    const personalTasks = []
    
    Object.entries(personalData).forEach(([category, tasks]) => {
      if (Array.isArray(tasks)) {
        tasks.forEach(task => {
          if (!task.completed) {
            personalTasks.push({
              ...task,
              source: 'personal',
              category: category,
              type: 'personal'
            })
          }
        })
      }
    })

    const combined = [...clientTasks, ...personalTasks]
    setAllTasks(combined)
  }

  function handleCheckInComplete(checkInData) {
    setTodayCheckIn(checkInData)
    setCheckInDone(true)
    setCapacity(checkInData.capacity || 3)
    loadAllTasks() // Reload tasks after check-in
  }

  function handleTaskSelect(task) {
    if (selectedTasks.find(t => t.id === task.id)) {
      setSelectedTasks(selectedTasks.filter(t => t.id !== task.id))
    } else {
      if (selectedTasks.length < capacity) {
        setSelectedTasks([...selectedTasks, task])
      } else {
        alert(`You've reached your capacity of ${capacity} tasks for today!`)
      }
    }
  }

  function handleAddToSchedule(task) {
    const schedule = JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]')
    
    const now = new Date()
    const currentHour = now.getHours()
    let suggestedHour = currentHour + 1
    
    if (suggestedHour >= 20) {
      suggestedHour = 9
    }
    
    const newBlock = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      time: `${suggestedHour.toString().padStart(2, '0')}:00`,
      duration: task.estimatedDuration || 30,
      title: task.title || task.name,
      type: task.type === 'personal' ? 'personal' : 'work',
      energy: 'medium',
      completed: false,
      taskId: task.id,
      taskSource: task.source
    }
    
    schedule.push(newBlock)
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule))
    window.dispatchEvent(new CustomEvent('femwork-schedule-updated'))
    
    alert(`✅ Added "${task.title || task.name}" to your schedule at ${suggestedHour}:00!`)
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", paddingBottom: "100px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "24px" }}>Today</h1>

      {/* Daily Check-in */}
      {!checkInDone ? (
        <DailyCheckIn onComplete={handleCheckInComplete} />
      ) : (
        <>
          {/* Capacity Display */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              Your Capacity Today
            </h3>
            <div style={{ fontSize: '48px', fontWeight: 700, color: '#c9a87c', marginBottom: '8px' }}>
              {capacity}
            </div>
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              tasks • {phase} phase • {todayCheckIn.energy} energy
            </p>
          </div>

          {/* Task Picker */}
          {allTasks.length > 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: 700 }}>
                Pick Your Tasks
              </h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '16px' }}>
                Select up to {capacity} tasks for today ({selectedTasks.length}/{capacity} selected)
              </p>

              {allTasks.slice(0, 10).map(task => (
                <div
                  key={`${task.source}-${task.id}`}
                  style={{
                    padding: '16px',
                    background: selectedTasks.some(t => t.id === task.id) ? '#E8F5E9' : 'white',
                    border: selectedTasks.some(t => t.id === task.id) ? '2px solid #4CAF50' : '2px solid #e0e0e0',
                    borderRadius: '12px',
                    marginBottom: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => handleTaskSelect(task)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <input
                      type="checkbox"
                      checked={selectedTasks.some(t => t.id === task.id)}
                      onChange={() => handleTaskSelect(task)}
                      style={{
                        marginTop: '2px',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        accentColor: '#4CAF50'
                      }}
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
                        {task.title || task.name}
                      </div>
                      
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>
                        {task.source === 'client' && (
                          <span style={{
                            padding: '2px 8px',
                            background: '#FFF9E6',
                            borderRadius: '4px',
                            marginRight: '6px'
                          }}>
                            💼 {task.clientName}
                          </span>
                        )}
                        {task.source === 'personal' && (
                          <span style={{
                            padding: '2px 8px',
                            background: '#E3F2FD',
                            borderRadius: '4px',
                            marginRight: '6px'
                          }}>
                            ✅ {task.category}
                          </span>
                        )}
                        {task.estimatedDuration && (
                          <span>~{task.estimatedDuration} min</span>
                        )}
                      </div>

                      {task.description && (
                        <div style={{ fontSize: '13px', color: '#666', lineHeight: '1.4' }}>
                          {task.description}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleAddToSchedule(task)
                    }}
                    style={{
                      marginTop: '12px',
                      width: '100%',
                      padding: '8px',
                      background: '#3498DB',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    📅 Add to Schedule
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '40px',
              textAlign: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <p style={{ fontSize: '14px', color: '#999' }}>
                No tasks available. Add some in Clients or Personal tabs!
              </p>
            </div>
          )}

          {/* Grounding Rituals - At Bottom */}
          <GroundingRituals />
        </>
      )}
    </div>
  )
}