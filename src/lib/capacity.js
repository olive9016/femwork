// src/lib/capacity.js
// ADHD + Hormone-Aware Capacity Calculator

/**
 * Calculate how many tasks someone can realistically handle today
 * Based on cycle phase, energy, and brain state
 */
export function calculateDailyCapacity({ phase, energy, brainState }) {
  let baseCapacity = 3 // Default moderate capacity
  
  // Adjust for cycle phase
  const phaseModifier = {
    'Menstrual': -1,    // 2 tasks (rest phase)
    'Follicular': +1,   // 4 tasks (rising energy)
    'Ovulatory': +2,    // 5 tasks (peak energy)
    'Luteal': 0         // 3 tasks (steady focus)
  }
  
  baseCapacity += phaseModifier[phase] || 0
  
  // Adjust for energy level
  const energyModifier = {
    'Low': -1,
    'Medium': 0,
    'High': +1
  }
  
  baseCapacity += energyModifier[energy] || 0
  
  // Adjust for brain state
  const brainModifier = {
    'Calm': +1,      // Great for sustained work
    'Focused': +1,   // Peak productivity
    'Wired': -1,     // Scattered energy
    'Foggy': -2,     // Need simple tasks only
    'Tender': -1     // Emotional, need gentle tasks
  }
  
  baseCapacity += brainModifier[brainState] || 0
  
  // Keep within reasonable bounds
  const capacity = Math.max(1, Math.min(baseCapacity, 6))
  
  return {
    taskCount: capacity,
    focusHours: getFocusHours(capacity, phase, energy, brainState),
    recommendation: getRecommendation(capacity, phase, energy, brainState)
  }
}

function getFocusHours(taskCount, phase, energy, brainState) {
  // Estimate realistic focus hours
  let baseHours = taskCount * 0.5 // ~30 mins per task
  
  if (brainState === 'Foggy') baseHours *= 0.6
  if (brainState === 'Wired') baseHours *= 0.7
  if (energy === 'Low') baseHours *= 0.8
  if (phase === 'Menstrual') baseHours *= 0.7
  
  return Math.round(baseHours * 2) / 2 // Round to nearest 0.5
}

function getRecommendation(capacity, phase, energy, brainState) {
  if (capacity === 1) {
    return "Today is a one-task day. That's perfect. Choose your most important thing and that's enough."
  }
  
  if (capacity === 2) {
    return "Two tasks is realistic today. Pick your priorities and let everything else wait."
  }
  
  if (capacity <= 3) {
    return "You can handle 2-3 focused tasks today. Quality over quantity."
  }
  
  if (capacity === 4) {
    return "Good energy today! 3-4 tasks is achievable. Pace yourself."
  }
  
  return "Great capacity today! You can tackle 4-5 tasks. Remember to take breaks."
}

/**
 * Prioritize tasks based on urgency, energy match, and time estimate
 */
export function prioritizeTasks(tasks, { phase, energy, brainState, capacity }) {
  return tasks
    .filter(task => !task.completed)
    .map(task => {
      const score = calculateTaskScore(task, { phase, energy, brainState })
      return { ...task, priorityScore: score }
    })
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, capacity.taskCount)
}

function calculateTaskScore(task, { phase, energy, brainState }) {
  let score = 0
  
  // Urgency score (0-40 points)
  const daysUntilDue = task.daysUntilDue || 999
  if (daysUntilDue === 0) score += 40       // Due today
  else if (daysUntilDue === 1) score += 30  // Due tomorrow
  else if (daysUntilDue <= 3) score += 20   // Due soon
  else if (daysUntilDue <= 7) score += 10   // Due this week
  
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

function detectTaskType(taskName) {
  const lower = taskName.toLowerCase()
  
  if (/call|email|meeting|message|contact|speak/i.test(lower)) return 'communication'
  if (/write|design|create|draft|brainstorm/i.test(lower)) return 'creative'
  if (/review|check|edit|proofread|verify/i.test(lower)) return 'detail'
  if (/organise|file|sort|clean|tidy/i.test(lower)) return 'admin'
  if (/walk|exercise|stretch|move/i.test(lower)) return 'physical'
  
  return 'general'
}

/**
 * Determine if today is an "impossible day"
 */
export function isImpossibleDay({ phase, energy, brainState }) {
  // Day 1-3 of period + low energy + foggy brain = impossible day
  if (phase === 'Menstrual' && energy === 'Low' && brainState === 'Foggy') {
    return true
  }
  
  // Very low energy regardless of phase
  if (energy === 'Low' && brainState === 'Tender') {
    return true
  }
  
  return false
}

/**
 * Get bare minimum tasks for impossible days
 */
export function getBareMinimumTasks() {
  return [
    { id: 'water', text: 'Drink a glass of water', completed: false },
    { id: 'breathe', text: 'Take 3 deep breaths', completed: false },
    { id: 'rest', text: 'Rest without guilt', completed: false }
  ]
}

/**
 * Calculate time blocks for the day
 */
export function calculateTimeBlocks({ phase, energy, brainState, tasks }) {
  const capacity = calculateDailyCapacity({ phase, energy, brainState })
  const focusHours = capacity.focusHours
  
  // Distribute focus hours across day
  const morningPeak = phase === 'Follicular' || phase === 'Ovulatory'
  
  let morning, afternoon, evening
  
  if (morningPeak) {
    morning = focusHours * 0.6
    afternoon = focusHours * 0.3
    evening = focusHours * 0.1
  } else {
    morning = focusHours * 0.4
    afternoon = focusHours * 0.4
    evening = focusHours * 0.2
  }
  
  return {
    morning: {
      hours: Math.round(morning * 2) / 2,
      quality: morningPeak ? 'peak' : 'good',
      tasks: []
    },
    afternoon: {
      hours: Math.round(afternoon * 2) / 2,
      quality: 'moderate',
      tasks: []
    },
    evening: {
      hours: Math.round(evening * 2) / 2,
      quality: energy === 'High' ? 'moderate' : 'low',
      tasks: []
    }
  }
}