// src/lib/taskPicker.js
// Smart Task Picker - Decides what to do next

/**
 * Calculate task score for prioritization
 */
function calculateTaskScore(task, { phase, energy, brainState }) {
  let score = 0
  
  // Urgency score (0-40 points)
  const daysUntilDue = task.daysUntilDue || 999
  if (daysUntilDue === 0) score += 40
  else if (daysUntilDue === 1) score += 30
  else if (daysUntilDue <= 3) score += 20
  else if (daysUntilDue <= 7) score += 10
  
  // Priority score (0-30 points)
  if (task.priority === 'High') score += 30
  else if (task.priority === 'Medium') score += 15
  else score += 5
  
  // Energy match (0-20 points)
  const taskType = detectTaskType(task.name)
  const energyMatch = {
    'communication': energy === 'High' ? 20 : 10,
    'creative': phase === 'Follicular' || phase === 'Ovulatory' ? 20 : 10,
    'detail': phase === 'Luteal' ? 20 : 10,
    'admin': brainState === 'Calm' || brainState === 'Focused' ? 15 : 5
  }
  
  score += energyMatch[taskType] || 10
  
  // Brain state match (0-10 points)
  if (brainState === 'Foggy' && task.microTasks?.length <= 3) score += 10
  if (brainState === 'Wired' && taskType === 'physical') score += 10
  if (brainState === 'Calm' && taskType === 'detail') score += 10
  
  return score
}

/**
 * Pick the best task to do right now
 * Based on time, energy, brain state, and context
 */
export function pickNextTask(tasks, { phase, energy, brainState, timeOfDay, completedToday = [] }) {
  if (!tasks || tasks.length === 0) {
    return {
      task: null,
      reason: "No tasks available. Time to rest or explore ideas!"
    }
  }
  
  // Filter out completed tasks
  const availableTasks = tasks.filter(task => !task.completed)
  
  if (availableTasks.length === 0) {
    return {
      task: null,
      reason: "All tasks done! You're amazing! 🎉"
    }
  }
  
  // Score each task
  const scoredTasks = availableTasks.map(task => {
    const baseScore = calculateTaskScore(task, { phase, energy, brainState })
    const timeScore = getTimeOfDayScore(task, timeOfDay, phase)
    const freshneScore = getFreshnessScore(task, completedToday)
    
    return {
      task,
      score: baseScore + timeScore + freshneScore,
      reasons: getReasons(task, { phase, energy, brainState, timeOfDay })
    }
  })
  
  // Sort by score
  scoredTasks.sort((a, b) => b.score - a.score)
  
  const best = scoredTasks[0]
  
  return {
    task: best.task,
    reason: best.reasons,
    alternatives: scoredTasks.slice(1, 3).map(st => ({
      task: st.task,
      reason: st.reasons
    }))
  }
}

/**
 * Score based on time of day
 */
function getTimeOfDayScore(task, timeOfDay, phase) {
  const hour = new Date().getHours()
  
  // Morning (6am-12pm)
  if (hour >= 6 && hour < 12) {
    // Follicular/Ovulatory = morning people
    if (phase === 'Follicular' || phase === 'Ovulatory') {
      if (task.priority === 'High') return 20
      return 10
    }
  }
  
  // Afternoon (12pm-6pm)
  if (hour >= 12 && hour < 18) {
    return 5 // Neutral
  }
  
  // Evening (6pm+)
  if (hour >= 18) {
    // Only low-effort tasks
    const microTaskCount = task.microTasks?.length || 0
    if (microTaskCount <= 2) return 10
    return -20 // Avoid complex tasks
  }
  
  return 0
}

/**
 * Score based on task freshness (avoid repeating similar tasks)
 */
function getFreshnessScore(task, completedToday) {
  if (completedToday.length === 0) return 0
  
  const recentTypes = completedToday.map(t => detectTaskType(t.name))
  const thisType = detectTaskType(task.name)
  
  // Penalize if we just did similar task
  const justDidSimilar = recentTypes[recentTypes.length - 1] === thisType
  if (justDidSimilar) return -15
  
  // Encourage variety
  const timesThisType = recentTypes.filter(type => type === thisType).length
  return -5 * timesThisType
}

function detectTaskType(taskName) {
  const lower = taskName.toLowerCase()
  if (/call|email|meeting|message/i.test(lower)) return 'communication'
  if (/write|design|create|draft/i.test(lower)) return 'creative'
  if (/review|check|edit|verify/i.test(lower)) return 'detail'
  if (/organise|file|sort|clean/i.test(lower)) return 'admin'
  return 'general'
}

/**
 * Get human-readable reasons why this task was picked
 */
function getReasons(task, { phase, energy, brainState, timeOfDay }) {
  const reasons = []
  
  // Urgency
  if (task.daysUntilDue === 0) {
    reasons.push("Due today - let's get it done")
  } else if (task.daysUntilDue === 1) {
    reasons.push("Due tomorrow - good time to tackle it")
  }
  
  // Priority
  if (task.priority === 'High') {
    reasons.push("High priority task")
  }
  
  // Time estimate
  const microTaskCount = task.microTasks?.length || 0
  if (microTaskCount <= 2) {
    reasons.push("Quick task (~15 mins)")
  } else if (microTaskCount <= 3) {
    reasons.push("Moderate task (~30 mins)")
  }
  
  // Energy match
  const taskType = detectTaskType(task.name)
  if (taskType === 'communication' && energy === 'High') {
    reasons.push("Good energy for communication")
  }
  if (taskType === 'detail' && brainState === 'Calm') {
    reasons.push("Calm mind perfect for detail work")
  }
  if (taskType === 'creative' && phase === 'Follicular') {
    reasons.push("Follicular phase - great for creative work")
  }
  
  // Brain state match
  if (brainState === 'Wired' && taskType === 'admin') {
    reasons.push("Channel that wired energy into admin tasks")
  }
  if (brainState === 'Foggy' && microTaskCount <= 2) {
    reasons.push("Simple task perfect for foggy brain")
  }
  
  // Default
  if (reasons.length === 0) {
    reasons.push("Good task to start with")
  }
  
  return reasons.join(' • ')
}

/**
 * Get next micro-task from current task
 */
export function getNextMicroTask(task) {
  if (!task.microTasks || task.microTasks.length === 0) {
    return null
  }
  
  const incomplete = task.microTasks.filter(mt => !mt.completed)
  
  if (incomplete.length === 0) {
    return {
      completed: true,
      message: "Task fully complete! Brilliant work! 🎉"
    }
  }
  
  return {
    completed: false,
    microTask: incomplete[0],
    remaining: incomplete.length,
    progress: `${task.microTasks.length - incomplete.length}/${task.microTasks.length} done`
  }
}

/**
 * Suggest break type based on energy and what's next
 */
export function suggestBreak({ phase, energy, brainState, lastTaskType, nextTaskType }) {
  const breaks = {
    'movement': {
      name: "Movement Break",
      duration: "5-10 mins",
      activities: ["Stretch", "Walk around", "Dance to one song", "Do some jumping jacks"]
    },
    'rest': {
      name: "Rest Break",
      duration: "10-15 mins",
      activities: ["Lie down", "Close eyes", "Listen to calm music", "Look out window"]
    },
    'water': {
      name: "Quick Reset",
      duration: "5 mins",
      activities: ["Drink water", "Splash face", "Deep breaths", "Quick tidy"]
    },
    'creative': {
      name: "Creative Break",
      duration: "10 mins",
      activities: ["Doodle", "Journal", "Play with pet", "Look at art"]
    }
  }
  
  // Exhausted = rest
  if (energy === 'Low' && brainState === 'Foggy') {
    return breaks.rest
  }
  
  // Wired = movement
  if (brainState === 'Wired') {
    return breaks.movement
  }
  
  // Changing from detail to creative = movement
  if (lastTaskType === 'detail' && nextTaskType === 'creative') {
    return breaks.movement
  }
  
  // Menstrual = rest
  if (phase === 'Menstrual') {
    return breaks.rest
  }
  
  // Default = water break
  return breaks.water
}