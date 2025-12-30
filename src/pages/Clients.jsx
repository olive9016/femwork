import { useEffect, useState } from "react"
import { getAITaskBreakdown } from "../lib/ai"

const CLIENTS_KEY = "femwork_clients"
const CYCLE_KEY = "femwork_cycle"
const SCHEDULE_KEY = "femwork_daily_schedule"

function getCurrentPhase(cycleData) {
  if (!cycleData || !cycleData.start_date) return "Follicular"
  
  const start = new Date(cycleData.start_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  const cycleDay = (diff % cycleData.cycle_length) + 1
  
  if (cycleDay >= 1 && cycleDay <= 5) return "Menstrual"
  if (cycleDay >= 6 && cycleDay <= 13) return "Follicular"
  if (cycleDay >= 14 && cycleDay <= 16) return "Ovulatory"
  return "Luteal"
}

function getMicroTaskCount(phase, priority) {
  const baseCount = {
    "Menstrual": 3,
    "Follicular": 5,
    "Ovulatory": 6,
    "Luteal": 4
  }
  
  const count = baseCount[phase] || 4
  
  if (priority === "High") return Math.min(count + 1, 7)
  if (priority === "Low") return Math.max(count - 1, 2)
  return count
}

// MUCH SMARTER AI - Actually reads and understands the task
function breakdownTaskWithAI(taskName, count, phase, priority) {
  const task = taskName.toLowerCase().trim()
  
  // SPECIFIC TASK PATTERNS - Check these first (most specific)
  
  // Phone calls / communications
  if (/call|phone|ring|contact.*to (confirm|check|ask|arrange|book)/i.test(taskName)) {
    return generatePhoneCallSteps(taskName, phase, count)
  }
  
  // Booking / reservation tasks
  if (/book|reserve|schedule.*appointment|arrange.*meeting/i.test(task)) {
    return generateBookingSteps(taskName, phase, count)
  }
  
  // Admin / paperwork tasks
  if (/fill|complete|submit.*form|paperwork|application|invoice|expense/i.test(task)) {
    return generateAdminSteps(taskName, phase, count)
  }
  
  // Email tasks
  if (/email|send.*to|reply.*to|draft.*email/i.test(task)) {
    return generateEmailSteps(taskName, phase, count)
  }
  
  // BROADER CATEGORIES - Check these second (more general)
  
  const isWriting = /write|draft|create.*content|compose|blog|article|copy|proposal|report/i.test(task)
  const isDesign = /design|mockup|wireframe|prototype|ui|ux|layout|visual|graphic/i.test(task)
  const isMeeting = /meeting|presentation|pitch|demo|workshop|session/i.test(task)
  const isResearch = /research|analyse|review|investigate|study|explore|gather.*info/i.test(task)
  const isDevelopment = /build|develop|code|implement|program|setup.*system/i.test(task)
  const isReview = /review|edit|proofread|check|audit|assess|evaluate/i.test(task)
  const isPlanning = /plan|strategy|roadmap|schedule.*project|organise/i.test(task)
  
  if (isWriting) return generateWritingSteps(taskName, phase, count)
  if (isDesign) return generateDesignSteps(taskName, phase, count)
  if (isMeeting) return generateMeetingSteps(taskName, phase, count)
  if (isResearch) return generateResearchSteps(taskName, phase, count)
  if (isDevelopment) return generateDevelopmentSteps(taskName, phase, count)
  if (isReview) return generateReviewSteps(taskName, phase, count)
  if (isPlanning) return generatePlanningSteps(taskName, phase, count)
  
  // Fallback - intelligent generic breakdown
  return generateGenericSteps(taskName, phase, count)
}

// All the helper functions for generating steps
function generatePhoneCallSteps(task, phase, count) {
  const isConfirming = /confirm/i.test(task)
  const isBooking = /book/i.test(task)
  const isAsking = /ask|question|enquire/i.test(task)
  const isComplaint = /complain|issue|problem/i.test(task)
  
  let steps = []
  
  if (isConfirming) {
    steps = [
      "Find the company's phone number and hours",
      "Gather your booking reference or account details",
      "Write down the specific questions you need answered",
      "Call during their opening hours",
      "Confirm all details and take notes of what they say",
      "Send follow-up email to confirm in writing if needed"
    ]
  } else if (isBooking) {
    steps = [
      "Find the phone number and opening hours",
      "Decide on your preferred date/time options",
      "Have payment details ready if needed",
      "Call and make the booking",
      "Get confirmation number and details",
      "Add to calendar with confirmation details"
    ]
  } else if (isAsking) {
    steps = [
      "Write down all your questions clearly",
      "Find the right phone number or extension",
      "Call and politely explain what you need",
      "Take detailed notes of the answers",
      "Clarify anything unclear before hanging up"
    ]
  } else if (isComplaint) {
    steps = [
      "Write down the facts of what happened",
      "Gather any reference numbers or proof",
      "Find the complaints line number",
      "Call and calmly explain the issue",
      "Ask for resolution and get reference number",
      "Follow up in writing via email"
    ]
  } else {
    steps = [
      "Find the right contact number",
      "Prepare what you need to say or ask",
      "Call at an appropriate time",
      "Have a pen and paper ready for notes",
      "Complete the call and note any follow-up needed"
    ]
  }
  
  return adjustStepsForPhase(steps, phase, count)
}

function generateBookingSteps(task, phase, count) {
  const steps = [
    "Decide on the dates/times you want",
    "Check availability online if possible",
    "Gather any details needed (ID, payment, etc.)",
    "Make the booking via website or phone",
    "Receive and save confirmation details",
    "Add booking to calendar with all details"
  ]
  
  return adjustStepsForPhase(steps, phase, count)
}

function generateAdminSteps(task, phase, count) {
  const steps = [
    "Gather all required documents and information",
    "Read through the form/requirements carefully",
    "Fill in your details accurately",
    "Double-check all information",
    "Submit or send as required",
    "Keep a copy for your records"
  ]
  
  return adjustStepsForPhase(steps, phase, count)
}

function generateEmailSteps(task, phase, count) {
  const isReply = /reply/i.test(task)
  
  const steps = isReply ? [
    "Read the original email carefully",
    "Note down the key points to address",
    "Draft your response",
    "Check you've answered everything",
    "Proofread and send"
  ] : [
    "Clarify exactly what needs to be said",
    "Draft the email with clear subject line",
    "Review tone and clarity",
    "Check for typos and errors",
    "Send to recipients",
    "Follow up if no response after reasonable time"
  ]
  
  return adjustStepsForPhase(steps, phase, count)
}

function adjustStepsForPhase(steps, phase, targetCount) {
  if (phase === "Menstrual") {
    return steps.slice(0, Math.min(3, targetCount)).map(step => {
      return step
        .replace("Gather all", "Collect what you need")
        .replace("Call and", "When ready, call and")
        .replace("Complete", "Do")
    })
  } else if (phase === "Ovulatory") {
    return steps.slice(0, targetCount)
  } else {
    return steps.slice(0, targetCount)
  }
}

function generateWritingSteps(task, phase, count) {
  const steps = {
    "Menstrual": [
      "Jot down your main thoughts about this",
      "Create a simple outline",
      "Write a rough first draft - don't edit yet",
      "Rest and come back to polish later"
    ],
    "Follicular": [
      "Research and gather inspiration",
      "Create an outline with main points",
      "Write the introduction",
      "Develop the main content",
      "Write a conclusion",
      "Edit once through"
    ],
    "Ovulatory": [
      "Research thoroughly and gather references",
      "Create detailed structure",
      "Write complete first draft",
      "Edit for clarity and impact",
      "Refine tone and flow",
      "Final polish and proofread",
      "Format ready for delivery"
    ],
    "Luteal": [
      "Review requirements carefully",
      "Research and gather all needed info",
      "Create detailed structure",
      "Write section by section",
      "Edit meticulously",
      "Final quality check"
    ]
  }
  
  return steps[phase].slice(0, count)
}

function generateDesignSteps(task, phase, count) {
  const steps = {
    "Menstrual": [
      "Look at references for inspiration",
      "Sketch rough ideas",
      "Pick one simple direction",
      "Create basic version"
    ],
    "Follicular": [
      "Research design trends and inspiration",
      "Create mood board",
      "Sketch initial concepts",
      "Develop chosen concept digitally",
      "Create first mockup",
      "Get feedback"
    ],
    "Ovulatory": [
      "Conduct thorough visual research",
      "Create comprehensive mood board",
      "Sketch multiple concepts",
      "Develop top concepts digitally",
      "Refine chosen direction",
      "Add final details and polish",
      "Prepare presentation"
    ],
    "Luteal": [
      "Review design requirements",
      "Gather all needed assets",
      "Create detailed wireframes",
      "Build design with precision",
      "Check all details carefully",
      "Prepare final files"
    ]
  }
  
  return steps[phase].slice(0, count)
}

function generateMeetingSteps(task, phase, count) {
  const steps = {
    "Menstrual": [
      "Review meeting purpose",
      "Prepare key points to share",
      "Set your intention",
      "Follow up afterwards"
    ],
    "Follicular": [
      "Define meeting objectives",
      "Research background info",
      "Prepare talking points",
      "Create simple agenda",
      "Gather materials needed",
      "Send calendar invite"
    ],
    "Ovulatory": [
      "Define clear goals and outcomes",
      "Research attendees and context",
      "Create comprehensive agenda",
      "Prepare presentation materials",
      "Rehearse key points",
      "Send pre-read materials",
      "Facilitate meeting confidently"
    ],
    "Luteal": [
      "Review objectives carefully",
      "Prepare detailed agenda",
      "Create supporting materials",
      "Anticipate questions",
      "Send agenda in advance",
      "Document action items after"
    ]
  }
  
  return steps[phase].slice(0, count)
}

function generateResearchSteps(task, phase, count) {
  const steps = {
    "Menstrual": [
      "Define what you need to find out",
      "Do a quick overview search",
      "Note initial observations",
      "Rest and process"
    ],
    "Follicular": [
      "Define research questions",
      "Identify key sources",
      "Read and take notes systematically",
      "Organise findings into themes",
      "Draft initial insights",
      "Note any gaps"
    ],
    "Ovulatory": [
      "Define comprehensive research scope",
      "Identify all relevant sources",
      "Conduct thorough investigation",
      "Analyse and synthesise findings",
      "Create detailed summary",
      "Present insights clearly",
      "Recommend next actions"
    ],
    "Luteal": [
      "Define precise questions",
      "Review sources systematically",
      "Document findings meticulously",
      "Analyse data carefully",
      "Verify all information",
      "Create detailed report"
    ]
  }
  
  return steps[phase].slice(0, count)
}

function generateDevelopmentSteps(task, phase, count) {
  const steps = {
    "Menstrual": [
      "Review what needs to be built",
      "Set up environment",
      "Build simplest version",
      "Basic functionality only"
    ],
    "Follicular": [
      "Break down technical requirements",
      "Plan architecture",
      "Set up dev environment",
      "Build core functionality",
      "Test basic features",
      "Document code"
    ],
    "Ovulatory": [
      "Analyse full requirements",
      "Design system architecture",
      "Set up complete environment",
      "Develop all features",
      "Implement error handling",
      "Write comprehensive tests",
      "Document and deploy"
    ],
    "Luteal": [
      "Review technical specs",
      "Plan implementation details",
      "Write clean, documented code",
      "Test thoroughly",
      "Debug and refine",
      "Final QA"
    ]
  }
  
  return steps[phase].slice(0, count)
}

function generateReviewSteps(task, phase, count) {
  const steps = {
    "Menstrual": [
      "Read through once",
      "Note obvious issues",
      "Make essential changes only"
    ],
    "Follicular": [
      "Read through completely",
      "Check against criteria",
      "Note areas for improvement",
      "Make necessary edits",
      "Quick final check"
    ],
    "Ovulatory": [
      "Review against all requirements",
      "Check structure and flow",
      "Verify all details",
      "Make comprehensive edits",
      "Quality assurance",
      "Get second opinion if needed",
      "Final approval"
    ],
    "Luteal": [
      "Read systematically",
      "Check each section",
      "Verify all facts",
      "Edit for precision",
      "Final meticulous review",
      "Sign off"
    ]
  }
  
  return steps[phase].slice(0, count)
}

function generatePlanningSteps(task, phase, count) {
  const steps = {
    "Menstrual": [
      "Clarify the end goal",
      "Note down initial thoughts",
      "Identify 2-3 priorities"
    ],
    "Follicular": [
      "Define goals and objectives",
      "Brainstorm possibilities",
      "Organise into themes",
      "Create initial timeline",
      "Identify resources needed",
      "Draft plan outline"
    ],
    "Ovulatory": [
      "Define comprehensive objectives",
      "Research best practices",
      "Brainstorm all options",
      "Evaluate and prioritise",
      "Create detailed plan with timeline",
      "Identify stakeholders",
      "Present for feedback"
    ],
    "Luteal": [
      "Review all requirements",
      "Break into detailed steps",
      "Create precise timeline",
      "Identify risks",
      "Document clearly",
      "Final review"
    ]
  }
  
  return steps[phase].slice(0, count)
}

function generateGenericSteps(task, phase, count) {
  const steps = {
    "Menstrual": [
      `Work out exactly what "${task}" means`,
      "Identify the smallest first step",
      "Do just that one thing",
      "Rest and continue when ready"
    ],
    "Follicular": [
      `Clarify what success looks like for "${task}"`,
      "Gather any info or resources needed",
      "Break it into logical steps",
      "Complete first step",
      "Review progress",
      "Continue with next steps"
    ],
    "Ovulatory": [
      `Define the full scope of "${task}"`,
      "Research and gather everything needed",
      "Create clear action plan",
      "Execute main deliverables",
      "Handle related communications",
      "Polish and finalise",
      "Complete and deliver"
    ],
    "Luteal": [
      `Review exactly what "${task}" requires`,
      "Plan the detailed steps",
      "Work through systematically",
      "Check quality at each stage",
      "Make final refinements",
      "Complete and close"
    ]
  }
  
  return steps[phase].slice(0, count)
}

export default function Clients() {
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [showAddClient, setShowAddClient] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  
  const [newClientName, setNewClientName] = useState("")
  const [newClientSummary, setNewClientSummary] = useState("")
  
  const [taskName, setTaskName] = useState("")
  const [taskPriority, setTaskPriority] = useState("Medium")
  const [taskDeadline, setTaskDeadline] = useState("")
  const [taskDuration, setTaskDuration] = useState(60)
  const [taskRepeat, setTaskRepeat] = useState('none')
  const [generatingTasks, setGeneratingTasks] = useState(false)
  
  const [showScheduleModal, setShowScheduleModal] = useState(null)
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0])
  
  const [currentPhase, setCurrentPhase] = useState("Follicular")

  useEffect(() => {
    loadClients()
    
    const cycleData = localStorage.getItem(CYCLE_KEY)
    if (cycleData) {
      try {
        const phase = getCurrentPhase(JSON.parse(cycleData))
        setCurrentPhase(phase)
      } catch (e) {
        console.error("Error loading cycle:", e)
      }
    }
  }, [])

  // FIX: Listen for storage changes to update in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      loadClients()
    }
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('femwork-clients-updated', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('femwork-clients-updated', handleStorageChange)
    }
  }, [])

  function loadClients() {
    try {
      const stored = localStorage.getItem(CLIENTS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setClients(parsed)
      }
    } catch (e) {
      console.error("Error loading clients:", e)
      setClients([])
    }
  }

  function saveClients(clientsData) {
    try {
      localStorage.setItem(CLIENTS_KEY, JSON.stringify(clientsData))
      setClients(clientsData)
      
      // FIX: Dispatch custom event for cross-component updates
      window.dispatchEvent(new CustomEvent('femwork-clients-updated'))
    } catch (e) {
      console.error("Error saving clients:", e)
      alert("Error saving data. Please try again.")
    }
  }

  function addClient() {
    if (!newClientName.trim()) return

    const newClient = {
      id: Date.now(),
      name: newClientName.trim(),
      summary: newClientSummary.trim(),
      tasks: [],
      createdAt: new Date().toISOString()
    }

    const updated = [...clients, newClient]
    saveClients(updated)
    setSelectedClient(newClient)
    setNewClientName("")
    setNewClientSummary("")
    setShowAddClient(false)
  }

  async function addTaskWithBreakdown() {
    if (!taskName.trim() || !taskDeadline || !selectedClient) return

    setGeneratingTasks(true)

    // Use Ollama AI to break down the task
    const microTaskCount = getMicroTaskCount(currentPhase, taskPriority)
    const aiResult = await getAITaskBreakdown({
      taskName: taskName.trim(),
      phase: currentPhase,
      priority: taskPriority,
      deadline: taskDeadline
    })

    let microTasks = []
    
    if (aiResult.success && aiResult.steps && aiResult.steps.length > 0) {
      // AI successfully generated tasks
      microTasks = aiResult.steps.slice(0, microTaskCount)
    } else {
      // Fallback to pattern matching if AI fails
      microTasks = breakdownTaskWithAI(taskName, microTaskCount, currentPhase, taskPriority)
    }

    const newTask = {
      id: Date.now(),
      name: taskName.trim(),
      priority: taskPriority,
      deadline: taskDeadline,
      estimatedDuration: taskDuration,
      repeat: taskRepeat,
      microTasks: microTasks.map((task, index) => ({
        id: `${Date.now()}-${index}`,
        text: task,
        completed: false,
        order: index
      })),
      completed: false,
      createdAt: new Date().toISOString(),
      createdInPhase: currentPhase,
      generatedBy: aiResult.success ? 'ollama' : 'pattern'
    }

    const updatedClients = clients.map(client =>
      client.id === selectedClient.id
        ? { ...client, tasks: [...client.tasks, newTask] }
        : client
    )

    saveClients(updatedClients)
    setSelectedClient(updatedClients.find(c => c.id === selectedClient.id))
    
    setTaskName("")
    setTaskPriority("Medium")
    setTaskDeadline("")
    setTaskDuration(60)
    setTaskRepeat('none')
    setGeneratingTasks(false)
    setShowAddTask(false)
  }

  function toggleMicroTask(taskId, microTaskId) {
    const updatedClients = clients.map(client =>
      client.id === selectedClient.id
        ? {
            ...client,
            tasks: client.tasks.map(task =>
              task.id === taskId
                ? {
                    ...task,
                    microTasks: task.microTasks.map(mt =>
                      mt.id === microTaskId ? { ...mt, completed: !mt.completed } : mt
                    )
                  }
                : task
            )
          }
        : client
    )

    saveClients(updatedClients)
    setSelectedClient(updatedClients.find(c => c.id === selectedClient.id))
  }

  function deleteTask(taskId) {
    const updatedClients = clients.map(client =>
      client.id === selectedClient.id
        ? { ...client, tasks: client.tasks.filter(t => t.id !== taskId) }
        : client
    )

    saveClients(updatedClients)
    setSelectedClient(updatedClients.find(c => c.id === selectedClient.id))
  }

  function toggleTaskCompletion(taskId) {
    const updatedClients = clients.map(client =>
      client.id === selectedClient.id
        ? {
            ...client,
            tasks: client.tasks.map(t =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            )
          }
        : client
    )
    saveClients(updatedClients)
    setSelectedClient(updatedClients.find(c => c.id === selectedClient.id))
  }

  function addToSchedule(task) {
    // Open modal to let user choose time
    const now = new Date()
    let suggestedHour = now.getHours() + 1
    if (suggestedHour >= 20) suggestedHour = 9
    
    setScheduleTime(`${suggestedHour.toString().padStart(2, '0')}:00`)
    setScheduleDate(new Date().toISOString().split('T')[0])
    setShowScheduleModal(task)
  }

  function confirmAddToSchedule() {
    if (!showScheduleModal) return
    
    const task = showScheduleModal
    const schedule = JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]')
    
    const newBlock = {
      id: Date.now(),
      date: scheduleDate,
      time: scheduleTime,
      duration: task.estimatedDuration || 60,
      title: task.name,
      type: 'work',
      energy: 'medium',
      completed: false,
      repeat: task.repeat || 'none',
      taskId: task.id,
      taskSource: 'client',
      clientId: selectedClient.id
    }
    
    schedule.push(newBlock)
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule))
    window.dispatchEvent(new CustomEvent('femwork-schedule-updated'))
    
    setShowScheduleModal(null)
    alert(`✅ Added "${task.name}" to schedule!`)
  }

  // CLIENT WORKSPACE VIEW
  if (selectedClient) {
    const incompleteTasks = selectedClient.tasks.filter(t => !t.completed)
    const completedTasks = selectedClient.tasks.filter(t => t.completed)

    return (
      <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
        <button
          onClick={() => {
            loadClients()
            setSelectedClient(null)
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "#c9a87c",
            fontSize: "16px",
            cursor: "pointer",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          ← Back to Clients
        </button>

        <div style={{ marginBottom: "24px" }}>
          <h2 style={{ marginBottom: "8px" }}>{selectedClient.name}</h2>
          {selectedClient.summary && (
            <p style={{ color: "#666", fontSize: "14px" }}>
              {selectedClient.summary}
            </p>
          )}
        </div>

        <div style={{
          background: "#f0f0ff",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "14px"
        }}>
          <strong>Current Phase:</strong> {currentPhase} • AI will break down tasks optimally for your energy level
        </div>

        <button
          onClick={() => setShowAddTask(true)}
          style={{
            background: "#c9a87c",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "15px",
            marginBottom: "24px"
          }}
        >
          + Add Task
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
              <h3 style={{ marginBottom: "20px" }}>Add New Task</h3>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                  Task Name
                </label>
                <input
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="E.g., Call Enterprise to confirm car booking, Write blog post"
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "15px"
                  }}
                />
                <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
                  Be specific - AI will understand what you actually need to do
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
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

              <div style={{ marginBottom: "16px" }}>
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

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={taskDuration}
                  onChange={(e) => setTaskDuration(parseInt(e.target.value))}
                  min={15}
                  step={15}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "15px"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                  Repeat
                </label>
                <select
                  value={taskRepeat}
                  onChange={(e) => setTaskRepeat(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "15px"
                  }}
                >
                  <option value="none">No repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div style={{
                background: "#f8f9fa",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#666"
              }}>
                💡 AI will generate {getMicroTaskCount(currentPhase, taskPriority)} contextual micro-tasks 
                optimised for your {currentPhase} phase
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowAddTask(false)
                    setTaskName("")
                    setTaskPriority("Medium")
                    setTaskDeadline("")
                    setTaskDuration(60)
                    setTaskRepeat('none')
                  }}
                  disabled={generatingTasks}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "white",
                    border: "1px solid #ddd",
                    borderRadius: "8px",
                    cursor: generatingTasks ? "not-allowed" : "pointer",
                    fontSize: "15px"
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addTaskWithBreakdown}
                  disabled={!taskName.trim() || !taskDeadline || generatingTasks}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: taskName.trim() && taskDeadline ? "#c9a87c" : "#ddd",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: taskName.trim() && taskDeadline && !generatingTasks ? "pointer" : "not-allowed",
                    fontSize: "15px"
                  }}
                >
                  {generatingTasks ? "AI Generating..." : "Generate Breakdown"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        {incompleteTasks.length === 0 && completedTasks.length === 0 ? (
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
          }}>
            <p style={{ color: "#999", fontSize: "15px" }}>
              No tasks yet. Add your first task to see AI break it down into manageable steps.
            </p>
          </div>
        ) : (
          <>
            {incompleteTasks.map((task) => (
              <div
                key={task.id}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleTaskCompletion(task.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: "20px",
                          height: "20px",
                          cursor: "pointer",
                          accentColor: "#4CAF50"
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
                    <div style={{ display: "flex", gap: "12px", fontSize: "13px", color: "#666", flexWrap: "wrap" }}>
                      <span style={{
                        background: task.priority === "High" ? "#ffe6e6" : task.priority === "Low" ? "#e6f7ff" : "#fff4e6",
                        color: task.priority === "High" ? "#cc0000" : task.priority === "Low" ? "#0066cc" : "#cc8800",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontWeight: 500
                      }}>
                        {task.priority}
                      </span>
                      {task.repeat && task.repeat !== 'none' && (
                        <span style={{
                          background: "#E8F5E9",
                          color: "#27AE60",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          fontWeight: 500
                        }}>
                          🔄 {task.repeat}
                        </span>
                      )}
                      <span>Due: {new Date(task.deadline).toLocaleDateString('en-GB')}</span>
                      <span>{task.microTasks.filter(mt => mt.completed).length}/{task.microTasks.length} complete</span>
                    </div>
                  </div>
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

                <div style={{ 
                  borderTop: "1px solid #f0f0f0", 
                  paddingTop: "12px",
                  marginTop: "12px"
                }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "12px", color: "#666", display: "flex", alignItems: "center", gap: "8px" }}>
                    {task.generatedBy === 'ollama' ? '🤖 AI Generated' : '🧠 Smart Breakdown'} ({task.createdInPhase} optimised)
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
                </div>

                <button
                  onClick={() => addToSchedule(task)}
                  style={{
                    width: "100%",
                    marginTop: "16px",
                    padding: "12px",
                    background: "#3498DB",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  📅 Add to Schedule
                </button>
              </div>
            ))}

            {completedTasks.length > 0 && (
              <details style={{ marginTop: "24px" }}>
                <summary style={{ cursor: "pointer", color: "#666", fontSize: "14px", marginBottom: "12px" }}>
                  Completed Tasks ({completedTasks.length})
                </summary>
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      background: "#f8f8f8",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "8px",
                      opacity: 0.7,
                      display: "flex",
                      alignItems: "center",
                      gap: "12px"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => toggleTaskCompletion(task.id)}
                      style={{
                        width: "18px",
                        height: "18px",
                        cursor: "pointer"
                      }}
                    />
                    <h4 style={{ fontSize: "16px", textDecoration: "line-through", margin: 0 }}>{task.name}</h4>
                  </div>
                ))}
              </details>
            )}
          </>
        )}

        {/* Schedule Time Picker Modal */}
        {showScheduleModal && (
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
              maxWidth: '400px',
              width: '100%'
            }}>
              <h3 style={{ marginBottom: '16px' }}>Add to Schedule</h3>
              
              <div style={{
                background: '#f8f9fa',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px' }}>
                  {showScheduleModal.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {showScheduleModal.estimatedDuration || 60} minutes • {selectedClient.name}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Date
                </label>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Time
                </label>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
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

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={confirmAddToSchedule}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: '#3498DB',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  ✓ Add to Schedule
                </button>
                <button
                  onClick={() => setShowScheduleModal(null)}
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

  // CLIENTS LIST VIEW
  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h2 style={{ margin: 0 }}>Clients</h2>
        <button
          onClick={() => setShowAddClient(true)}
          style={{
            background: "#c9a87c",
            color: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "15px"
          }}
        >
          + Add Client
        </button>
      </div>

      {showAddClient && (
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
            width: "100%"
          }}>
            <h3 style={{ marginBottom: "20px" }}>Add New Client</h3>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
                Client Name
              </label>
              <input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Enter client name..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "15px"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px" }}>
                Summary / Context
              </label>
              <textarea
                value={newClientSummary}
                onChange={(e) => setNewClientSummary(e.target.value)}
                placeholder="Brief description of client and project..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "15px",
                  resize: "vertical"
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowAddClient(false)}
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
                onClick={addClient}
                disabled={!newClientName.trim()}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: newClientName.trim() ? "#c9a87c" : "#ddd",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: newClientName.trim() ? "pointer" : "not-allowed",
                  fontSize: "15px"
                }}
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}

      {clients.length === 0 ? (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "60px 20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          textAlign: "center"
        }}>
          <p style={{ color: "#999", fontSize: "15px" }}>
            No clients yet. Add your first client to get started.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {clients.map((client) => {
            const taskCount = client.tasks?.length || 0
            const completedCount = client.tasks?.filter(t => t.completed).length || 0

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  cursor: "pointer",
                  transition: "transform 0.2s"
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <h3 style={{ marginBottom: "8px" }}>{client.name}</h3>
                {client.summary && (
                  <p style={{ color: "#666", fontSize: "14px", marginBottom: "12px" }}>
                    {client.summary}
                  </p>
                )}
                <div style={{ fontSize: "13px", color: "#999" }}>
                  {taskCount} {taskCount === 1 ? "task" : "tasks"}
                  {taskCount > 0 && ` • ${completedCount} completed`}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}