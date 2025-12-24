import { useEffect, useState } from "react"
import { calculateDailyCapacity, isImpossibleDay, getBareMinimumTasks, prioritizeTasks } from "../lib/capacity"
import { pickNextTask } from "../lib/taskPicker"
import { getCelebrationForTask } from "../lib/celebrations"
import { getAIInsight, isAIConfigured, getAIStatus } from "../lib/ai"
import DailyCheckIn from "./DailyCheckIn"

const CYCLE_KEY = "femwork_cycle"
const CLIENTS_KEY = "femwork_clients"
const CHECK_IN_KEY = "femwork_daily_checkins"
const COMPLETED_TODAY_KEY = "femwork_completed_today"
const GROUNDING_KEY = "femwork_grounding"

function getPhaseInfo(cycleDay) {
  if (cycleDay >= 1 && cycleDay <= 5) {
    return {
      phase: "Menstrual",
      message: "Start your day with intention and presence.",
      strengths: ["Gentle planning", "Intuitive flow", "Presence"],
      tasks: ["Morning pages", "Light admin", "Inbox clearing"]
    }
  } else if (cycleDay >= 6 && cycleDay <= 13) {
    return {
      phase: "Follicular",
      message: "Channel your creative energy into new beginnings.",
      strengths: ["Creative thinking", "Planning", "Learning"],
      tasks: ["Brainstorm session", "New project setup", "Strategic planning"]
    }
  } else if (cycleDay >= 6 && cycleDay <= 13) {
    return {
      phase: "Ovulatory",
      message: "Your energy is high—connect and communicate.",
      strengths: ["Communication", "Connection", "Leadership"],
      tasks: ["Client meetings", "Presentations", "Networking"]
    }
  } else {
    return {
      phase: "Luteal",
      message: "Focus on completion and attention to detail.",
      strengths: ["Detail work", "Editing", "Organizing"],
      tasks: ["Finish projects", "Admin tasks", "Quality checks"]
    }
  }
}

function getCurrentPhase(cycleData) {
  if (!cycleData || !cycleData.start_date) return null
  
  const start = new Date(cycleData.start_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  const cycleDay = (diff % cycleData.cycle_length) + 1
  
  const phaseInfo = getPhaseInfo(cycleDay)
  
  return { phase: phaseInfo.phase, cycleDay, phaseInfo }
}

export default function Dashboard() {
  const [cycle, setCycle] = useState(null)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [todayData, setTodayData] = useState(null)
  const [allTasks, setAllTasks] = useState([])
  const [priorityTasks, setPriorityTasks] = useState([])
  const [selectedTask, setSelectedTask] = useState(null)
  const [completedToday, setCompletedToday] = useState([])
  const [celebration, setCelebration] = useState(null)
  const [grounding, setGrounding] = useState({
    breathwork: false,
    meditation: false,
    journal: false,
    stretch: false,
    intention: false,
    voiceNote: false
  })
  
  // AI Insight
  const [aiInsight, setAiInsight] = useState(null)
  const [loadingInsight, setLoadingInsight] = useState(false)
  const [aiStatus, setAiStatus] = useState({ configured: false })

  useEffect(() => {
    loadData()
    checkIfNeedsCheckIn()
    setAiStatus(getAIStatus())
  }, [])

  function loadData() {
    // Load cycle
    const cycleData = localStorage.getItem(CYCLE_KEY)
    if (cycleData) {
      const parsed = JSON.parse(cycleData)
      const phaseData = getCurrentPhase(parsed)
      if (phaseData) {
        setCycle({ ...parsed, ...phaseData })
      }
    }

    // Load grounding
    const groundingData = localStorage.getItem(GROUNDING_KEY)
    if (groundingData) {
      try {
        setGrounding(JSON.parse(groundingData))
      } catch (e) {
        console.error("Error loading grounding:", e)
      }
    }

    // Load tasks
    const clientsData = localStorage.getItem(CLIENTS_KEY)
    console.log("📦 Raw clients data:", clientsData)
    
    if (clientsData) {
      const clients = JSON.parse(clientsData)
      console.log("👥 Parsed clients:", clients)
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const tasks = []
      clients.forEach(client => {
        console.log(`\n🔍 Checking client: ${client.name}`)
        console.log(`   Tasks in client:`, client.tasks)
        
        if (client.tasks) {
          client.tasks.forEach(task => {
            console.log(`\n   📋 Task: ${task.name}`)
            console.log(`      Completed: ${task.completed}`)
            console.log(`      Deadline: ${task.deadline}`)
            
            if (!task.completed && task.deadline) {
              const deadline = new Date(task.deadline)
              deadline.setHours(0, 0, 0, 0)
              const daysUntilDue = Math.floor((deadline - today) / (1000 * 60 * 60 * 24))
              
              console.log(`      Days until due: ${daysUntilDue}`)
              console.log(`      Should show: ${daysUntilDue >= 0 && daysUntilDue <= 7}`)
              
              if (daysUntilDue >= 0 && daysUntilDue <= 7) {
                const taskWithDetails = {
                  ...task,
                  clientName: client.name,
                  clientId: client.id,
                  daysUntilDue
                }
                tasks.push(taskWithDetails)
                console.log(`      ✅ ADDED TO LIST`)
              } else {
                console.log(`      ❌ NOT in 7-day window`)
              }
            } else {
              if (task.completed) console.log(`      ⏭️  SKIPPED - already completed`)
              if (!task.deadline) console.log(`      ⏭️  SKIPPED - no deadline`)
            }
          })
        }
      })
      
      console.log(`\n📊 TOTAL TASKS LOADED: ${tasks.length}`)
      console.log("Tasks:", tasks)
      
      setAllTasks(tasks)
      
      // Prioritize tasks if we have check-in data
      if (todayData && tasks.length > 0) {
        console.log("\n🎯 PRIORITIZING TASKS...")
        const prioritized = prioritizeTasks(tasks, {
          phase: cycle?.phase || 'Follicular',
          energy: todayData.checkIn.energy,
          brainState: todayData.checkIn.brainState,
          capacity: todayData.capacity
        })
        console.log("✨ Prioritized result:", prioritized)
        setPriorityTasks(prioritized)
      } else {
        console.log("\n⚠️ NOT PRIORITIZING:")
        console.log("   Has check-in data:", !!todayData)
        console.log("   Has tasks:", tasks.length > 0)
      }
    }

    // Load completed today
    const completedData = localStorage.getItem(COMPLETED_TODAY_KEY)
    if (completedData) {
      const parsed = JSON.parse(completedData)
      const today = new Date().toDateString()
      if (parsed.date === today) {
        setCompletedToday(parsed.tasks)
      }
    }
  }

  function checkIfNeedsCheckIn() {
    const checkIns = JSON.parse(localStorage.getItem(CHECK_IN_KEY) || '[]')
    const today = new Date().toDateString()
    const todayCheckIn = checkIns.find(ci => new Date(ci.date).toDateString() === today)
    
    if (!todayCheckIn) {
      setTimeout(() => setShowCheckIn(true), 500)
    } else {
      const cycleData = getCurrentPhase(JSON.parse(localStorage.getItem(CYCLE_KEY) || '{}'))
      if (cycleData) {
        const capacity = calculateDailyCapacity({
          phase: cycleData.phase,
          energy: todayCheckIn.energy,
          brainState: todayCheckIn.brainState
        })
        const impossible = isImpossibleDay({
          phase: cycleData.phase,
          energy: todayCheckIn.energy,
          brainState: todayCheckIn.brainState
        })
        
        setTodayData({ checkIn: todayCheckIn, capacity, impossible })
      }
    }
  }

  function handleCheckInComplete({ checkIn, capacity, impossible }) {
    setTodayData({ checkIn, capacity, impossible })
    setShowCheckIn(false)
    
    // Prioritize tasks after check-in
    if (!impossible) {
      loadData() // Reload tasks first
      
      // Then prioritize them
      setTimeout(() => {
        const clientsData = localStorage.getItem(CLIENTS_KEY)
        if (clientsData) {
          const clients = JSON.parse(clientsData)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          
          const tasks = []
          clients.forEach(client => {
            if (client.tasks) {
              client.tasks.forEach(task => {
                if (!task.completed && task.deadline) {
                  const deadline = new Date(task.deadline)
                  deadline.setHours(0, 0, 0, 0)
                  const daysUntilDue = Math.floor((deadline - today) / (1000 * 60 * 60 * 24))
                  
                  if (daysUntilDue >= 0 && daysUntilDue <= 7) {
                    tasks.push({
                      ...task,
                      clientName: client.name,
                      clientId: client.id,
                      daysUntilDue
                    })
                  }
                }
              })
            }
          })
          
          setAllTasks(tasks)
          
          // Now prioritize
          const prioritized = prioritizeTasks(tasks, {
            phase: cycle?.phase,
            energy: checkIn.energy,
            brainState: checkIn.brainState,
            capacity
          })
          setPriorityTasks(prioritized)
        }
      }, 100)
    }
  }

  function handleWhatShouldIDoNow() {
    if (!todayData) {
      alert("Please check in first!")
      setShowCheckIn(true)
      return
    }

    const result = pickNextTask(priorityTasks, {
      phase: cycle?.phase,
      energy: todayData.checkIn.energy,
      brainState: todayData.checkIn.brainState,
      timeOfDay: new Date().getHours(),
      completedToday
    })

    if (result.task) {
      setSelectedTask(result)
    } else {
      alert(result.reason)
    }
  }

  function toggleGrounding(key) {
    const updated = { ...grounding, [key]: !grounding[key] }
    setGrounding(updated)
    localStorage.setItem(GROUNDING_KEY, JSON.stringify(updated))
  }

  function markTaskComplete(taskId) {
    const task = priorityTasks.find(t => t.id === taskId)
    if (!task) return

    const today = new Date().toDateString()
    const updated = [...completedToday, task]
    setCompletedToday(updated)
    localStorage.setItem(COMPLETED_TODAY_KEY, JSON.stringify({
      date: today,
      tasks: updated
    }))

    const celebrationMsg = getCelebrationForTask(task, updated.length)
    setCelebration(celebrationMsg)
    setTimeout(() => setCelebration(null), 3000)

    loadData()
    setSelectedTask(null)
  }

  async function fetchAIInsight() {
    if (!cycle || !todayData) {
      alert("Please check in first!")
      return
    }
    
    setLoadingInsight(true)
    
    const result = await getAIInsight({
      cycleDay: cycle.cycleDay,
      phase: cycle.phase,
      energy: todayData.checkIn.energy,
      tasks: priorityTasks,
      grounding: grounding
    })
    
    if (result.success) {
      setAiInsight(result.insight)
    } else {
      setAiInsight(result.fallback || "AI insight unavailable")
    }
    
    setLoadingInsight(false)
  }

  // Show check-in modal
  if (showCheckIn) {
    return (
      <DailyCheckIn
        cycle={cycle}
        onComplete={handleCheckInComplete}
        onSkip={() => setShowCheckIn(false)}
      />
    )
  }

  // Impossible day view
  if (todayData?.impossible) {
    return (
      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", paddingBottom: "100px" }}>
        <div style={{
          background: "linear-gradient(135deg, #fff0f5 0%, #f0f0ff 100%)",
          borderRadius: "16px",
          padding: "32px",
          textAlign: "center",
          marginBottom: "24px"
        }}>
          <h2 style={{ fontSize: "28px", marginBottom: "16px" }}>Today is a rest day 🌙</h2>
          <p style={{ fontSize: "16px", color: "#666", lineHeight: "1.6" }}>
            Your body needs gentleness today. That's not failure, that's wisdom.
          </p>
        </div>

        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          marginBottom: "20px"
        }}>
          <h3 style={{ marginBottom: "16px" }}>Bare Minimum (if you want):</h3>
          {getBareMinimumTasks().map((task, i) => (
            <div key={i} style={{
              padding: "12px",
              background: "#f8f9fa",
              borderRadius: "8px",
              marginBottom: "8px",
              fontSize: "14px"
            }}>
              {task.text}
            </div>
          ))}
          <p style={{ fontSize: "13px", color: "#999", marginTop: "16px", fontStyle: "italic" }}>
            Or do nothing at all. Both are perfect.
          </p>
        </div>

        {/* Option to continue anyway */}
        <button
          onClick={() => setTodayData({ ...todayData, impossible: false })}
          style={{
            width: "100%",
            padding: "14px",
            background: "white",
            border: "2px solid #c9a87c",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "15px",
            color: "#c9a87c",
            fontWeight: 500
          }}
        >
          I want to see my tasks anyway →
        </button>
      </div>
    )
  }

  // Main dashboard
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
      {/* Celebration Toast */}
      {celebration && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
          color: "white",
          padding: "16px 24px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          zIndex: 3000,
          fontSize: "16px",
          fontWeight: 600,
          animation: "slideDown 0.3s ease"
        }}>
          {celebration}
        </div>
      )}

      {/* Header */}
      <h1 style={{ textAlign: "center", marginBottom: "8px", fontSize: "24px" }}>
        FemWork
      </h1>

      {cycle?.phaseInfo && (
        <p style={{ 
          textAlign: "center", 
          color: "#666", 
          fontSize: "14px",
          marginBottom: "24px",
          fontStyle: "italic"
        }}>
          {cycle.phaseInfo.message}
        </p>
      )}

      {/* Capacity Display */}
      {todayData?.capacity && (
        <div style={{
          background: "linear-gradient(135deg, #f0f0ff 0%, #fff9f0 100%)",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          border: "2px solid #c9a87c"
        }}>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px", fontWeight: 600 }}>
              TODAY'S CAPACITY
            </div>
            <div style={{ display: "flex", gap: "4px", marginBottom: "12px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: "8px",
                    borderRadius: "4px",
                    background: i < todayData.capacity.taskCount ? "#c9a87c" : "#e0e0e0"
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: "13px", color: "#666" }}>
              ~{todayData.capacity.focusHours} focus hours • {todayData.capacity.taskCount} tasks realistic today
            </div>
          </div>
          <p style={{ fontSize: "14px", color: "#666", margin: 0, fontStyle: "italic" }}>
            {todayData.capacity.recommendation}
          </p>
        </div>
      )}

      {/* What Should I Do Now Button */}
      <button
        onClick={handleWhatShouldIDoNow}
        style={{
          width: "100%",
          padding: "20px",
          background: "linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)",
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontSize: "18px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(201, 168, 124, 0.3)"
        }}
      >
        🎯 What should I do now?
      </button>

      {/* Rhythmic Work Insight */}
      {cycle?.phaseInfo && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0, color: "#c9a87c", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "20px" }}>●</span>
              Today's Rhythmic Work Insight
            </h3>
            <button 
              onClick={fetchAIInsight}
              disabled={loadingInsight}
              style={{
                background: aiStatus.configured ? "#c9a87c" : "#999",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "6px",
                fontSize: "14px",
                cursor: loadingInsight ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              {loadingInsight ? "Thinking..." : aiStatus.message}
            </button>
          </div>

          {aiInsight && (
            <div style={{
              background: "linear-gradient(135deg, #f0f0ff 0%, #fff0f5 100%)",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "16px",
              border: "2px solid #c9a87c"
            }}>
              <div style={{ fontSize: "13px", color: "#c9a87c", marginBottom: "8px", fontWeight: 600 }}>
                🤖 AI INSIGHT
              </div>
              <div style={{ fontSize: "14px", lineHeight: "1.6", color: "#333" }}>
                {aiInsight}
              </div>
            </div>
          )}

          <div style={{
            background: "#f8f9fa",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
            fontSize: "14px"
          }}>
            <strong>Day {cycle?.cycleDay}</strong> • {cycle?.phase} Phase • Energy: {todayData?.checkIn?.energy || 'Medium'}
          </div>

          <div style={{ marginBottom: "16px" }}>
            <strong style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
              WORK STRENGTHS TODAY
            </strong>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {cycle.phaseInfo.strengths.map((strength, i) => (
                <span key={i} style={{
                  background: "#f5f5f5",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px"
                }}>
                  {strength}
                </span>
              ))}
            </div>
          </div>

          <div>
            <strong style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
              ACTIVATION TASKS
            </strong>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {cycle.phaseInfo.tasks.map((task, i) => (
                <span key={i} style={{
                  background: "#fff9f0",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  border: "1px solid #c9a87c"
                }}>
                  {task}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grounding Rituals */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ marginBottom: "16px", color: "#c9a87c" }}>Grounding Rituals</h3>
        <div style={{ display: "grid", gap: "12px" }}>
          {[
            { key: "breathwork", label: "3-minute breathwork" },
            { key: "meditation", label: "10-minute meditation" },
            { key: "journal", label: "Morning pages" },
            { key: "stretch", label: "Gentle stretch" },
            { key: "intention", label: "Set intention" },
            { key: "voiceNote", label: "Voice note to self" }
          ].map(ritual => (
            <label key={ritual.key} style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "12px",
              background: grounding[ritual.key] ? "#f0fff0" : "#f8f9fa",
              borderRadius: "8px",
              cursor: "pointer",
              border: grounding[ritual.key] ? "2px solid #90EE90" : "1px solid #e0e0e0",
              transition: "all 0.2s"
            }}>
              <input
                type="checkbox"
                checked={grounding[ritual.key]}
                onChange={() => toggleGrounding(ritual.key)}
                style={{ width: "20px", height: "20px", cursor: "pointer" }}
              />
              <span style={{ fontSize: "15px" }}>{ritual.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Today's Tasks */}
      {priorityTasks.length > 0 && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ margin: 0 }}>Priority Tasks This Week</h3>
            <button
              onClick={() => {
                loadData()
                if (todayData) {
                  const prioritized = prioritizeTasks(allTasks, {
                    phase: cycle?.phase,
                    energy: todayData.checkIn.energy,
                    brainState: todayData.checkIn.brainState,
                    capacity: todayData.capacity
                  })
                  setPriorityTasks(prioritized)
                }
              }}
              style={{
                padding: "6px 12px",
                background: "#f8f9fa",
                border: "1px solid #ddd",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px"
              }}
            >
              🔄 Refresh
            </button>
          </div>
          {priorityTasks.map(task => (
            <div key={task.id} style={{
              padding: "16px",
              background: "#f8f9fa",
              borderRadius: "8px",
              marginBottom: "12px",
              border: task.daysUntilDue === 0 ? "2px solid #ff6b6b" : "1px solid #e0e0e0"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                    {task.name}
                  </div>
                  <div style={{ fontSize: "13px", color: "#666" }}>
                    {task.clientName} • {task.priority} • {
                      task.daysUntilDue === 0 ? "Due today!" :
                      task.daysUntilDue === 1 ? "Due tomorrow" :
                      `Due in ${task.daysUntilDue} days`
                    }
                  </div>
                </div>
              </div>
              {task.microTasks && (
                <div style={{ fontSize: "13px", color: "#999" }}>
                  {task.microTasks.filter(mt => mt.completed).length}/{task.microTasks.length} steps complete
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* No tasks message */}
      {priorityTasks.length === 0 && todayData && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "40px 20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          textAlign: "center"
        }}>
          <p style={{ fontSize: "15px", color: "#666", marginBottom: "16px" }}>
            No tasks due this week
          </p>
          <button
            onClick={loadData}
            style={{
              padding: "10px 20px",
              background: "#c9a87c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            🔄 Check for Tasks
          </button>
        </div>
      )}

      {/* Today's Progress */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ marginBottom: "16px" }}>Today's Progress</h3>
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div>
            <div style={{ fontSize: "32px", fontWeight: 700, color: "#c9a87c" }}>
              {completedToday.length}
            </div>
            <div style={{ fontSize: "14px", color: "#666" }}>
              {completedToday.length === 1 ? "task" : "tasks"} done ✨
            </div>
          </div>
          {todayData?.capacity && (
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "14px", color: "#666" }}>
                Goal: {todayData.capacity.taskCount}
              </div>
              <div style={{ fontSize: "12px", color: "#999" }}>
                {completedToday.length >= todayData.capacity.taskCount 
                  ? "You did it! 🎉" 
                  : `${todayData.capacity.taskCount - completedToday.length} to go`
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selected Task Modal */}
      {selectedTask && (
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
          zIndex: 2000,
          padding: "20px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "16px",
            padding: "24px",
            maxWidth: "500px",
            width: "100%"
          }}>
            <h3 style={{ marginBottom: "16px" }}>Right now, do this:</h3>
            <div style={{
              background: "#f8f9fa",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "16px"
            }}>
              <div style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
                {selectedTask.task.name}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                {selectedTask.reason}
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setSelectedTask(null)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "white",
                  border: "1px solid #ddd",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
              >
                Not this one
              </button>
              <button
                onClick={() => markTaskComplete(selectedTask.task.id)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#c9a87c",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: 600
                }}
              >
                Mark Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning! ☀️"
  if (hour < 18) return "Good afternoon! 🌤️"
  return "Good evening! 🌙"
}