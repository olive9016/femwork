import { useEffect, useState } from "react"
import { getAITaskBreakdown } from "../lib/ai"

const PERSONAL_TASKS_KEY = "femwork_personal_tasks"
const CYCLE_KEY = "femwork_cycle"

function getCurrentPhase(cycleData) {
  if (!cycleData || !cycleData.start_date) return { phase: "Follicular", cycleDay: 1 }
  
  const start = new Date(cycleData.start_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  const cycleDay = (diff % cycleData.cycle_length) + 1
  
  let phase = "Follicular"
  if (cycleDay >= 1 && cycleDay <= 5) phase = "Menstrual"
  else if (cycleDay >= 6 && cycleDay <= 13) phase = "Follicular"
  else if (cycleDay >= 14 && cycleDay <= 16) phase = "Ovulatory"
  else phase = "Luteal"
  
  return { phase, cycleDay }
}

export default function PersonalTasks() {
  const [tasks, setTasks] = useState([])
  const [showAddTask, setShowAddTask] = useState(false)
  const [currentPhase, setCurrentPhase] = useState("Follicular")
  const [cycleDay, setCycleDay] = useState(1)
  
  // Form states
  const [taskName, setTaskName] = useState("")
  const [taskCategory, setTaskCategory] = useState("Life Admin")
  const [taskPriority, setTaskPriority] = useState("Medium")
  const [taskDeadline, setTaskDeadline] = useState("")
  const [taskReminder, setTaskReminder] = useState("")
  const [taskNotes, setTaskNotes] = useState("")
  const [generatingTasks, setGeneratingTasks] = useState(false)
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [showCompleted, setShowCompleted] = useState(false)

  const categories = [
    "Life Admin",
    "Home & Living",
    "Health & Wellness",
    "Personal Growth",
    "Relationships",
    "Finance",
    "Career",
    "Creative Projects",
    "Self Care"
  ]

  useEffect(() => {
    loadTasks()
    loadCyclePhase()
  }, [])

  function loadTasks() {
    const saved = localStorage.getItem(PERSONAL_TASKS_KEY)
    if (saved) {
      try {
        setTasks(JSON.parse(saved))
      } catch (e) {
        console.error("Error loading personal tasks:", e)
      }
    }
  }

  function loadCyclePhase() {
    const cycleData = localStorage.getItem(CYCLE_KEY)
    if (cycleData) {
      try {
        const parsed = JSON.parse(cycleData)
        const phaseInfo = getCurrentPhase(parsed)
        setCurrentPhase(phaseInfo.phase)
        setCycleDay(phaseInfo.cycleDay)
      } catch (e) {
        console.error("Error loading cycle:", e)
      }
    }
  }

  function saveTasks(updatedTasks) {
    setTasks(updatedTasks)
    localStorage.setItem(PERSONAL_TASKS_KEY, JSON.stringify(updatedTasks))
  }

  function getMicroTaskCount(phase, priority) {
    let baseCount = 3
    
    if (phase === "Menstrual") baseCount = 2
    else if (phase === "Follicular" || phase === "Ovulatory") baseCount = 4
    else if (phase === "Luteal") baseCount = 3
    
    if (priority === "High") baseCount += 1
    if (priority === "Low") baseCount = Math.max(2, baseCount - 1)
    
    return Math.min(baseCount, 5)
  }

  function breakdownTaskWithAI(taskName, microTaskCount, phase, priority, category) {
    const lower = taskName.toLowerCase()
    
    // Specific pattern detection
    if (/book|schedule|appointment|reservation/i.test(lower)) {
      return generateBookingSteps(taskName, microTaskCount)
    }
    if (/call|phone.*to/i.test(lower)) {
      return generatePhoneCallSteps(taskName, microTaskCount)
    }
    if (/form|application|paperwork|document/i.test(lower)) {
      return generateFormSteps(taskName, microTaskCount)
    }
    if (/clean|tidy|organize|declutter/i.test(lower)) {
      return generateOrganizingSteps(taskName, microTaskCount)
    }
    if (/meal prep|cook|recipe/i.test(lower)) {
      return generateMealPrepSteps(taskName, microTaskCount)
    }
    
    // Category-based breakdown
    if (category === "Health & Wellness") {
      return generateHealthSteps(taskName, microTaskCount)
    }
    if (category === "Finance") {
      return generateFinanceSteps(taskName, microTaskCount)
    }
    if (category === "Relationships") {
      return generateRelationshipSteps(taskName, microTaskCount)
    }
    
    // Generic breakdown
    return generateGenericSteps(taskName, microTaskCount)
  }

  function generateBookingSteps(taskName, count) {
    const steps = [
      "Find contact info and check availability",
      "Decide on preferred date and time",
      "Gather any required information or documents",
      "Make the booking or call to schedule",
      "Get confirmation number or email",
      "Add to calendar with reminder"
    ]
    return steps.slice(0, count)
  }

  function generatePhoneCallSteps(taskName, count) {
    const steps = [
      "Find phone number and opening hours",
      "Write down questions or points to discuss",
      "Gather any reference numbers or account details",
      "Make the call during opening hours",
      "Take notes during conversation",
      "Get confirmation or reference number"
    ]
    return steps.slice(0, count)
  }

  function generateFormSteps(taskName, count) {
    const steps = [
      "Gather all required documents and information",
      "Read through the form completely",
      "Fill in all sections carefully",
      "Double-check all details are correct",
      "Submit or send the form",
      "Keep copy of confirmation"
    ]
    return steps.slice(0, count)
  }

  function generateOrganizingSteps(taskName, count) {
    const steps = [
      "Set a timer for focused work",
      "Sort items into keep/donate/bin piles",
      "Put items in their proper places",
      "Wipe down surfaces",
      "Take out rubbish or donations",
      "Enjoy the clean space"
    ]
    return steps.slice(0, count)
  }

  function generateMealPrepSteps(taskName, count) {
    const steps = [
      "Choose recipes and write shopping list",
      "Buy ingredients",
      "Prep vegetables and ingredients",
      "Cook meals in batches",
      "Portion into containers",
      "Label and store in fridge/freezer"
    ]
    return steps.slice(0, count)
  }

  function generateHealthSteps(taskName, count) {
    const steps = [
      "Check what you need (equipment, info, etc)",
      "Schedule time in your calendar",
      "Prepare what's needed",
      "Do the health activity",
      "Track or log completion",
      "Plan next time"
    ]
    return steps.slice(0, count)
  }

  function generateFinanceSteps(taskName, count) {
    const steps = [
      "Gather relevant financial documents",
      "Review current situation or statements",
      "Make a plan or decision",
      "Take action (transfer, pay, invest, etc)",
      "Get confirmation",
      "File or save records"
    ]
    return steps.slice(0, count)
  }

  function generateRelationshipSteps(taskName, count) {
    const steps = [
      "Think about what you want to say or do",
      "Choose a good time to connect",
      "Reach out or start the conversation",
      "Listen actively and be present",
      "Follow through on any commitments",
      "Show appreciation"
    ]
    return steps.slice(0, count)
  }

  function generateGenericSteps(taskName, count) {
    const steps = [
      "Research or gather information needed",
      "Make a plan for the task",
      "Gather materials or resources",
      "Start the main work",
      "Complete and check quality",
      "Clean up and finish properly"
    ]
    return steps.slice(0, count)
  }

  async function addTaskWithBreakdown() {
    if (!taskName.trim() || !taskDeadline) return

    setGeneratingTasks(true)

    // Use AI to break down the task
    const microTaskCount = getMicroTaskCount(currentPhase, taskPriority)
    const aiResult = await getAITaskBreakdown({
      taskName: taskName.trim(),
      phase: currentPhase,
      priority: taskPriority,
      deadline: taskDeadline
    })

    let microTasks = []
    
    if (aiResult.success && aiResult.steps && aiResult.steps.length > 0) {
      microTasks = aiResult.steps.slice(0, microTaskCount)
    } else {
      microTasks = breakdownTaskWithAI(taskName, microTaskCount, currentPhase, taskPriority, taskCategory)
    }

    const newTask = {
      id: Date.now(),
      name: taskName.trim(),
      category: taskCategory,
      priority: taskPriority,
      deadline: taskDeadline,
      reminder: taskReminder,
      notes: taskNotes,
      microTasks: microTasks.map((task, index) => ({
        id: `${Date.now()}-${index}`,
        text: task,
        completed: false,
        order: index
      })),
      completed: false,
      createdAt: new Date().toISOString(),
      createdInPhase: currentPhase,
      generatedBy: aiResult.success ? 'ai' : 'pattern'
    }

    saveTasks([...tasks, newTask])
    
    // Reset form
    setTaskName("")
    setTaskCategory("Life Admin")
    setTaskPriority("Medium")
    setTaskDeadline("")
    setTaskReminder("")
    setTaskNotes("")
    setGeneratingTasks(false)
    setShowAddTask(false)

    // Set up reminder if specified
    if (taskReminder) {
      scheduleReminder(newTask)
    }
  }

  function scheduleReminder(task) {
    // Browser notification setup
    if ("Notification" in window && Notification.permission === "granted") {
      const reminderDate = new Date(task.reminder)
      const now = new Date()
      const timeUntilReminder = reminderDate - now

      if (timeUntilReminder > 0) {
        setTimeout(() => {
          new Notification("FemWork Reminder", {
            body: `${task.name} - ${task.category}`,
            icon: "/vite.svg"
          })
        }, timeUntilReminder)
      }
    } else if ("Notification" in window && Notification.permission !== "denied") {
      Notification.requestPermission()
    }
  }

  function toggleMicroTask(taskId, microTaskId) {
    const updatedTasks = tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            microTasks: task.microTasks.map(mt =>
              mt.id === microTaskId ? { ...mt, completed: !mt.completed } : mt
            )
          }
        : task
    )

    saveTasks(updatedTasks)
  }

  function toggleTaskComplete(taskId) {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    )
    saveTasks(updatedTasks)
  }

  function deleteTask(taskId) {
    saveTasks(tasks.filter(t => t.id !== taskId))
  }

  function editTask(task) {
    setTaskName(task.name)
    setTaskCategory(task.category)
    setTaskPriority(task.priority)
    setTaskDeadline(task.deadline)
    setTaskReminder(task.reminder || "")
    setTaskNotes(task.notes || "")
    deleteTask(task.id)
    setShowAddTask(true)
  }

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (!showCompleted && task.completed) return false
    if (selectedCategory !== "All" && task.category !== selectedCategory) return false
    return true
  })

  // Sort by deadline
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (!a.deadline) return 1
    if (!b.deadline) return -1
    return new Date(a.deadline) - new Date(b.deadline)
  })

  const incompleteTasks = sortedTasks.filter(t => !t.completed)
  const completedTasks = sortedTasks.filter(t => t.completed)

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
      {/* Header */}
      <h1 style={{ textAlign: "center", marginBottom: "8px" }}>Personal Tasks</h1>
      <p style={{ textAlign: "center", color: "#666", fontSize: "14px", marginBottom: "24px" }}>
        Day {cycleDay} • {currentPhase} Phase
      </p>

      {/* Filters */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "16px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
          <button
            onClick={() => setSelectedCategory("All")}
            style={{
              padding: "8px 16px",
              borderRadius: "20px",
              border: selectedCategory === "All" ? "2px solid #c9a87c" : "1px solid #ddd",
              background: selectedCategory === "All" ? "#fff9f0" : "white",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: selectedCategory === "All" ? 600 : 400
            }}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: selectedCategory === cat ? "2px solid #c9a87c" : "1px solid #ddd",
                background: selectedCategory === cat ? "#fff9f0" : "white",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: selectedCategory === cat ? 600 : 400
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={showCompleted}
            onChange={(e) => setShowCompleted(e.target.checked)}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          Show completed tasks
        </label>
      </div>

      {/* Add Task Button */}
      <button
        onClick={() => setShowAddTask(true)}
        style={{
          width: "100%",
          padding: "16px",
          background: "linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)",
          color: "white",
          border: "none",
          borderRadius: "12px",
          fontSize: "16px",
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: "24px",
          boxShadow: "0 4px 12px rgba(201, 168, 124, 0.3)"
        }}
      >
        + Add Personal Task
      </button>

      {/* Add Task Modal */}
      {showAddTask && (
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
            <h3 style={{ marginBottom: "20px" }}>Add Personal Task</h3>

            {/* Task Name */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                What do you need to do?
              </label>
              <input
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="E.g., Book dentist appointment"
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "15px"
                }}
              />
            </div>

            {/* Category */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                Category
              </label>
              <select
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "15px"
                }}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Priority & Deadline */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "15px"
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                  Deadline
                </label>
                <input
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "15px"
                  }}
                />
              </div>
            </div>

            {/* Reminder */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                Reminder (optional)
              </label>
              <input
                type="datetime-local"
                value={taskReminder}
                onChange={(e) => setTaskReminder(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "15px"
                }}
              />
            </div>

            {/* Notes */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                Notes (optional)
              </label>
              <textarea
                value={taskNotes}
                onChange={(e) => setTaskNotes(e.target.value)}
                placeholder="Any additional details..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "14px",
                  resize: "vertical",
                  fontFamily: "inherit"
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => {
                  setShowAddTask(false)
                  setTaskName("")
                  setTaskCategory("Life Admin")
                  setTaskPriority("Medium")
                  setTaskDeadline("")
                  setTaskReminder("")
                  setTaskNotes("")
                }}
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
                onClick={addTaskWithBreakdown}
                disabled={!taskName.trim() || !taskDeadline || generatingTasks}
                style={{
                  flex: 2,
                  padding: "12px",
                  background: (!taskName.trim() || !taskDeadline || generatingTasks) ? "#ccc" : "#c9a87c",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: (!taskName.trim() || !taskDeadline || generatingTasks) ? "not-allowed" : "pointer",
                  fontSize: "15px",
                  fontWeight: 600
                }}
              >
                {generatingTasks ? "Generating..." : "🤖 Generate Breakdown"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks List */}
      {incompleteTasks.length === 0 ? (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "60px 20px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <p style={{ color: "#999", fontSize: "15px" }}>
            No personal tasks yet. Add your first task to get AI-powered micro-steps!
          </p>
        </div>
      ) : (
        <>
          {incompleteTasks.map((task) => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const deadline = new Date(task.deadline)
            deadline.setHours(0, 0, 0, 0)
            const daysUntilDue = Math.floor((deadline - today) / (1000 * 60 * 60 * 24))
            const isOverdue = daysUntilDue < 0
            const isDueToday = daysUntilDue === 0

            return (
              <div
                key={task.id}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  border: isDueToday ? "2px solid #ff6b6b" : isOverdue ? "2px solid #ff4444" : "none"
                }}
              >
                {/* Task Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskComplete(task.id)}
                        style={{
                          width: "20px",
                          height: "20px",
                          cursor: "pointer"
                        }}
                      />
                      <h3 style={{
                        margin: 0,
                        fontSize: "18px",
                        textDecoration: task.completed ? "line-through" : "none"
                      }}>
                        {task.name}
                      </h3>
                    </div>

                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", fontSize: "13px" }}>
                      <span style={{
                        background: "#f0f0f0",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontWeight: 500
                      }}>
                        {task.category}
                      </span>
                      <span style={{
                        background: task.priority === "High" ? "#ffe6e6" : task.priority === "Low" ? "#e6f7ff" : "#fff4e6",
                        color: task.priority === "High" ? "#cc0000" : task.priority === "Low" ? "#0066cc" : "#cc8800",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontWeight: 500
                      }}>
                        {task.priority}
                      </span>
                      <span style={{ color: isOverdue ? "#ff0000" : isDueToday ? "#ff6b6b" : "#666" }}>
                        {isOverdue ? `Overdue by ${Math.abs(daysUntilDue)} days` : 
                         isDueToday ? "Due today!" :
                         daysUntilDue === 1 ? "Due tomorrow" :
                         `Due in ${daysUntilDue} days`}
                      </span>
                      {task.reminder && (
                        <span style={{ color: "#9b59b6" }}>
                          🔔 Reminder set
                        </span>
                      )}
                    </div>

                    {task.notes && (
                      <p style={{
                        fontSize: "13px",
                        color: "#666",
                        marginTop: "8px",
                        fontStyle: "italic"
                      }}>
                        Note: {task.notes}
                      </p>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => editTask(task)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#666",
                        cursor: "pointer",
                        fontSize: "18px",
                        padding: "4px 8px"
                      }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
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

                {/* Micro Tasks */}
                <div style={{
                  borderTop: "1px solid #f0f0f0",
                  paddingTop: "12px",
                  marginTop: "12px"
                }}>
                  <div style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    marginBottom: "12px",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    {task.generatedBy === 'ai' ? '🤖 AI Generated' : 'Smart Breakdown'} ({task.createdInPhase} optimised)
                  </div>
                  {task.microTasks.map((microTask) => (
                    <div
                      key={microTask.id}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "8px 0",
                        borderBottom: "1px solid #f8f8f8"
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={microTask.completed}
                        onChange={() => toggleMicroTask(task.id, microTask.id)}
                        style={{
                          marginTop: "4px",
                          width: "18px",
                          height: "18px",
                          cursor: "pointer"
                        }}
                      />
                      <span style={{
                        flex: 1,
                        fontSize: "14px",
                        textDecoration: microTask.completed ? "line-through" : "none",
                        color: microTask.completed ? "#999" : "#333"
                      }}>
                        {microTask.text}
                      </span>
                    </div>
                  ))}
                  <div style={{
                    fontSize: "12px",
                    color: "#999",
                    marginTop: "8px"
                  }}>
                    {task.microTasks.filter(mt => mt.completed).length}/{task.microTasks.length} steps complete
                  </div>
                </div>
              </div>
            )
          })}
        </>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && showCompleted && (
        <details style={{ marginTop: "24px" }}>
          <summary style={{
            cursor: "pointer",
            color: "#666",
            fontSize: "14px",
            marginBottom: "12px",
            fontWeight: 600
          }}>
            ✅ Completed Tasks ({completedTasks.length})
          </summary>
          {completedTasks.map((task) => (
            <div
              key={task.id}
              style={{
                background: "#f8f9fa",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "8px",
                opacity: 0.7
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ textDecoration: "line-through", fontSize: "15px", marginBottom: "4px" }}>
                    {task.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {task.category} • Completed
                  </div>
                </div>
                <button
                  onClick={() => deleteTask(task.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#999",
                    cursor: "pointer",
                    fontSize: "18px"
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </details>
      )}
    </div>
  )
}