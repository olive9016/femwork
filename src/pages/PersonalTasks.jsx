import { useState, useEffect } from 'react'
import { getAITaskBreakdown } from '../lib/ai'

const PERSONAL_TASKS_KEY = 'femwork_personal_tasks'
const SCHEDULE_KEY = 'femwork_daily_schedule'
const CYCLE_KEY = 'femwork_cycle'

const categories = {
  'Health & Wellness': { emoji: '🌸', color: '#E91E63' },
  'Home & Family': { emoji: '🏠', color: '#FF9800' },
  'Personal Growth': { emoji: '✨', color: '#9C27B0' },
  'Relationships': { emoji: '💕', color: '#F06292' },
  'Self-Care': { emoji: '🛀', color: '#BA68C8' },
  'Hobbies & Interests': { emoji: '🎨', color: '#26A69A' },
  'Finances': { emoji: '💰', color: '#66BB6A' },
  'Career Development': { emoji: '📚', color: '#42A5F5' },
  'Community & Social': { emoji: '🤝', color: '#FFA726' }
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

function getMicroTaskCount(phase, priority) {
  const baseCount = { Menstrual: 3, Follicular: 5, Ovulatory: 6, Luteal: 4 }
  const count = baseCount[phase] || 4
  if (priority === "High") return Math.min(count + 1, 7)
  if (priority === "Low") return Math.max(count - 1, 2)
  return count
}

export default function PersonalTasks() {
  const [tasks, setTasks] = useState({})
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [showAddTask, setShowAddTask] = useState(false)
  
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState('Medium')
  const [taskDeadline, setTaskDeadline] = useState('')
  const [taskDuration, setTaskDuration] = useState(60)
  const [taskRepeat, setTaskRepeat] = useState('none')
  const [generatingBreakdown, setGeneratingBreakdown] = useState(false)
  
  const [showScheduleModal, setShowScheduleModal] = useState(null)
  const [scheduleTime, setScheduleTime] = useState('09:00')
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0])
  
  const [currentPhase, setCurrentPhase] = useState('Follicular')

  useEffect(() => {
    loadTasks()
    loadPhase()
  }, [])

  function loadPhase() {
    const cycleData = localStorage.getItem(CYCLE_KEY)
    if (cycleData) {
      try {
        setCurrentPhase(getCurrentPhase(JSON.parse(cycleData)))
      } catch (e) {
        console.error('Error loading phase:', e)
      }
    }
  }

  function loadTasks() {
    const saved = localStorage.getItem(PERSONAL_TASKS_KEY)
    if (saved) {
      setTasks(JSON.parse(saved))
    }
  }

  function saveTasks(newTasks) {
    localStorage.setItem(PERSONAL_TASKS_KEY, JSON.stringify(newTasks))
    setTasks(newTasks)
    window.dispatchEvent(new CustomEvent('femwork-personal-tasks-updated'))
  }

  async function addTask() {
    if (!taskTitle.trim() || !selectedCategory) return

    setGeneratingBreakdown(true)

    const microTaskCount = getMicroTaskCount(currentPhase, taskPriority)
    
    // Try AI breakdown first
    const aiResult = await getAITaskBreakdown({
      taskName: taskTitle.trim(),
      phase: currentPhase,
      priority: taskPriority,
      deadline: taskDeadline,
      context: `This is a personal task in the ${selectedCategory} category.`
    })

    let microTasks = []
    if (aiResult.success && aiResult.steps && aiResult.steps.length > 0) {
      microTasks = aiResult.steps.slice(0, microTaskCount)
    } else {
      // Fallback: Smart breakdown based on task type
      microTasks = generateSmartBreakdown(taskTitle, selectedCategory, microTaskCount)
    }

    const newTask = {
      id: Date.now(),
      title: taskTitle.trim(),
      priority: taskPriority,
      deadline: taskDeadline || null,
      estimatedDuration: taskDuration,
      repeat: taskRepeat,
      microTasks: microTasks.map((text, idx) => ({
        id: `${Date.now()}-${idx}`,
        text,
        completed: false
      })),
      completed: false,
      createdAt: new Date().toISOString(),
      generatedBy: aiResult.success ? 'ai' : 'smart'
    }

    const categoryTasks = tasks[selectedCategory] || []
    const updated = {
      ...tasks,
      [selectedCategory]: [...categoryTasks, newTask]
    }

    saveTasks(updated)
    resetForm()
    setGeneratingBreakdown(false)
  }

  function generateSmartBreakdown(title, category, count) {
    const lower = title.toLowerCase()
    
    // Health & Wellness
    if (category === 'Health & Wellness') {
      if (lower.includes('exercise') || lower.includes('workout')) {
        return [
          'Choose the type of exercise',
          'Set realistic duration/intensity',
          'Prepare what you need (clothes, water)',
          'Do the workout',
          'Cool down and stretch',
          'Log your progress'
        ].slice(0, count)
      }
      if (lower.includes('doctor') || lower.includes('appointment')) {
        return [
          'Find and note appointment details',
          'Prepare questions/concerns to discuss',
          'Gather relevant medical info',
          'Attend appointment',
          'Note down advice/prescriptions',
          'Schedule follow-up if needed'
        ].slice(0, count)
      }
    }
    
    // Home & Family
    if (category === 'Home & Family') {
      if (lower.includes('clean') || lower.includes('tidy')) {
        return [
          'Gather cleaning supplies',
          'Start with one area',
          'Declutter first',
          'Clean surfaces',
          'Put everything in place',
          'Do a final check'
        ].slice(0, count)
      }
      if (lower.includes('meal') || lower.includes('cook')) {
        return [
          'Decide what to make',
          'Check ingredients needed',
          'Shop for missing items',
          'Prep ingredients',
          'Cook the meal',
          'Clean up after'
        ].slice(0, count)
      }
    }
    
    // Generic breakdown
    return [
      `Break down what "${title}" means`,
      'Identify what you need to start',
      'Do the first step',
      'Continue with next steps',
      'Review and complete',
      'Reflect on what worked'
    ].slice(0, count)
  }

  function toggleTaskCompletion(category, taskId) {
    const updated = {
      ...tasks,
      [category]: tasks[category].map(t =>
        t.id === taskId ? { ...t, completed: !t.completed } : t
      )
    }
    saveTasks(updated)
  }

  function toggleMicroTask(category, taskId, microTaskId) {
    const updated = {
      ...tasks,
      [category]: tasks[category].map(t =>
        t.id === taskId
          ? {
              ...t,
              microTasks: t.microTasks.map(mt =>
                mt.id === microTaskId ? { ...mt, completed: !mt.completed } : mt
              )
            }
          : t
      )
    }
    saveTasks(updated)
  }

  function addToSchedule(task, category) {
    // Open modal to let user choose time
    const now = new Date()
    let suggestedHour = now.getHours() + 1
    if (suggestedHour >= 20) suggestedHour = 9
    
    setScheduleTime(`${suggestedHour.toString().padStart(2, '0')}:00`)
    setScheduleDate(new Date().toISOString().split('T')[0])
    setShowScheduleModal({ task, category })
  }

  function confirmAddToSchedule() {
    if (!showScheduleModal) return
    
    const { task, category } = showScheduleModal
    const schedule = JSON.parse(localStorage.getItem(SCHEDULE_KEY) || '[]')
    
    const newBlock = {
      id: Date.now(),
      date: scheduleDate,
      time: scheduleTime,
      duration: task.estimatedDuration || 60,
      title: task.title,
      type: 'personal',
      energy: 'medium',
      completed: false,
      repeat: task.repeat || 'none',
      taskId: task.id,
      taskSource: 'personal',
      taskCategory: category
    }
    
    schedule.push(newBlock)
    localStorage.setItem(SCHEDULE_KEY, JSON.stringify(schedule))
    window.dispatchEvent(new CustomEvent('femwork-schedule-updated'))
    
    setShowScheduleModal(null)
    alert(`✅ Added "${task.title}" to schedule!`)
  }

  function deleteTask(category, taskId) {
    if (confirm('Delete this task?')) {
      const updated = {
        ...tasks,
        [category]: tasks[category].filter(t => t.id !== taskId)
      }
      saveTasks(updated)
    }
  }

  function resetForm() {
    setTaskTitle('')
    setTaskPriority('Medium')
    setTaskDeadline('')
    setTaskDuration(60)
    setTaskRepeat('none')
    setShowAddTask(false)
  }

  // If viewing a category
  if (selectedCategory) {
    const categoryTasks = tasks[selectedCategory] || []
    const incompleteTasks = categoryTasks.filter(t => !t.completed)
    const completedTasks = categoryTasks.filter(t => t.completed)

    return (
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
        <button
          onClick={() => setSelectedCategory(null)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#c9a87c',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          ← Back to Categories
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>
            {categories[selectedCategory]?.emoji} {selectedCategory}
          </h2>
          <button
            onClick={() => setShowAddTask(true)}
            style={{
              background: '#c9a87c',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600
            }}
          >
            + Add Task
          </button>
        </div>

        {showAddTask && (
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
              <h3 style={{ marginBottom: '20px' }}>Add Task</h3>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Task Title
                </label>
                <input
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="What do you need to do?"
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
                  Priority
                </label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '15px'
                  }}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={taskDuration}
                  onChange={(e) => setTaskDuration(parseInt(e.target.value))}
                  min={15}
                  step={15}
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
                  Repeat
                </label>
                <select
                  value={taskRepeat}
                  onChange={(e) => setTaskRepeat(e.target.value)}
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
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Every 2 weeks</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div style={{
                background: '#f8f9fa',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '13px',
                color: '#666'
              }}>
                💡 AI will generate {getMicroTaskCount(currentPhase, taskPriority)} micro-tasks for your {currentPhase} phase
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={resetForm}
                  disabled={generatingBreakdown}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    cursor: generatingBreakdown ? 'not-allowed' : 'pointer',
                    fontSize: '15px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={addTask}
                  disabled={!taskTitle.trim() || generatingBreakdown}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: taskTitle.trim() && !generatingBreakdown ? '#c9a87c' : '#ddd',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: taskTitle.trim() && !generatingBreakdown ? 'pointer' : 'not-allowed',
                    fontSize: '15px',
                    fontWeight: 600
                  }}
                >
                  {generatingBreakdown ? 'Generating...' : 'Create Task'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tasks List */}
        {incompleteTasks.map(task => (
          <div
            key={task.id}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskCompletion(selectedCategory, task.id)}
                    style={{
                      width: '20px',
                      height: '20px',
                      cursor: 'pointer'
                    }}
                  />
                  <h3 style={{ margin: 0, fontSize: '18px' }}>{task.title}</h3>
                </div>
                
                <div style={{ fontSize: '13px', color: '#666', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <span style={{
                    background: task.priority === 'High' ? '#ffe6e6' : task.priority === 'Low' ? '#e6f7ff' : '#fff4e6',
                    color: task.priority === 'High' ? '#cc0000' : task.priority === 'Low' ? '#0066cc' : '#cc8800',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 500
                  }}>
                    {task.priority}
                  </span>
                  {task.repeat !== 'none' && (
                    <span style={{
                      background: '#E8F5E9',
                      color: '#27AE60',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 500
                    }}>
                      🔄 {task.repeat}
                    </span>
                  )}
                  {task.deadline && <span>Due: {new Date(task.deadline).toLocaleDateString('en-GB')}</span>}
                  <span>{task.estimatedDuration} min</span>
                </div>
              </div>
              
              <button
                onClick={() => deleteTask(selectedCategory, task.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#999',
                  cursor: 'pointer',
                  fontSize: '20px'
                }}
              >
                ×
              </button>
            </div>

            {/* Micro-tasks */}
            {task.microTasks && task.microTasks.length > 0 && (
              <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '12px', marginTop: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#666' }}>
                  {task.generatedBy === 'ai' ? '🤖 AI Generated' : '🧠 Smart'} Breakdown:
                </div>
                {task.microTasks.map(mt => (
                  <div key={mt.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px',
                    padding: '8px 0'
                  }}>
                    <input
                      type="checkbox"
                      checked={mt.completed}
                      onChange={() => toggleMicroTask(selectedCategory, task.id, mt.id)}
                      style={{
                        marginTop: '4px',
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{
                      flex: 1,
                      fontSize: '14px',
                      textDecoration: mt.completed ? 'line-through' : 'none',
                      color: mt.completed ? '#999' : '#333'
                    }}>
                      {mt.text}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Add to Schedule Button */}
            <button
              onClick={() => addToSchedule(task, selectedCategory)}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '12px',
                background: '#3498DB',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              📅 Add to Schedule
            </button>
          </div>
        ))}

        {completedTasks.length > 0 && (
          <details style={{ marginTop: '24px' }}>
            <summary style={{ cursor: 'pointer', color: '#666', fontSize: '14px', marginBottom: '12px' }}>
              Completed Tasks ({completedTasks.length})
            </summary>
            {completedTasks.map(task => (
              <div key={task.id} style={{
                background: '#f8f8f8',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '8px',
                opacity: 0.7,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    checked={true}
                    onChange={() => toggleTaskCompletion(selectedCategory, task.id)}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer'
                    }}
                  />
                  <span style={{ fontSize: '16px', textDecoration: 'line-through' }}>
                    {task.title}
                  </span>
                </div>
              </div>
            ))}
          </details>
        )}
      </div>
    )
  }

  // Categories view
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', paddingBottom: '100px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '32px' }}>Personal Tasks</h1>

      <div style={{ display: 'grid', gap: '16px' }}>
        {Object.entries(categories).map(([name, data]) => {
          const categoryTasks = tasks[name] || []
          const taskCount = categoryTasks.length
          const completedCount = categoryTasks.filter(t => t.completed).length

          return (
            <div
              key={name}
              onClick={() => setSelectedCategory(name)}
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                borderLeft: `4px solid ${data.color}`,
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ marginBottom: '8px', fontSize: '18px' }}>
                    {data.emoji} {name}
                  </h3>
                  <div style={{ fontSize: '13px', color: '#999' }}>
                    {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                    {taskCount > 0 && ` • ${completedCount} completed`}
                  </div>
                </div>
                <div style={{ fontSize: '24px', opacity: 0.3 }}>→</div>
              </div>
            </div>
          )
        })}
      </div>

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
                {showScheduleModal.task.title}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {showScheduleModal.task.estimatedDuration || 60} minutes • {categories[showScheduleModal.category]?.emoji} {showScheduleModal.category}
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