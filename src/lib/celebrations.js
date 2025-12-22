// src/lib/celebrations.js
// Dopamine Celebration System

const CELEBRATIONS = [
  "Brilliant! ✨",
  "You did it! 🎉",
  "Nice work! 💪",
  "That's done! ✅",
  "Amazing! 🌟",
  "Well done! 👏",
  "Crushing it! 🔥",
  "Yes! 🎯",
  "Beautiful! 💫",
  "Perfect! ⭐"
]

const ENCOURAGEMENTS = [
  "One step at a time, you're doing great",
  "Every small win counts",
  "Progress, not perfection",
  "You showed up, that's what matters",
  "Your effort is enough",
  "You're building momentum",
  "This is how change happens",
  "You're doing better than you think"
]

/**
 * Get a random celebration message
 */
export function getCelebration() {
  return CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]
}

/**
 * Get encouragement message
 */
export function getEncouragement() {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
}

/**
 * Calculate streak data
 */
export function calculateStreak(checkIns) {
  if (!checkIns || checkIns.length === 0) return { current: 0, longest: 0 }
  
  // Sort by date
  const sorted = [...checkIns].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  )
  
  // Calculate current streak
  let currentStreak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  for (let i = 0; i < sorted.length; i++) {
    const checkInDate = new Date(sorted[i].date)
    checkInDate.setHours(0, 0, 0, 0)
    
    const daysDiff = Math.floor((today - checkInDate) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === i) {
      currentStreak++
    } else {
      break
    }
  }
  
  // Calculate longest streak
  let longestStreak = 0
  let tempStreak = 1
  
  for (let i = 1; i < sorted.length; i++) {
    const current = new Date(sorted[i].date)
    const previous = new Date(sorted[i - 1].date)
    current.setHours(0, 0, 0, 0)
    previous.setHours(0, 0, 0, 0)
    
    const diff = Math.floor((previous - current) / (1000 * 60 * 60 * 24))
    
    if (diff === 1) {
      tempStreak++
    } else {
      longestStreak = Math.max(longestStreak, tempStreak)
      tempStreak = 1
    }
  }
  
  longestStreak = Math.max(longestStreak, tempStreak)
  
  return { current: currentStreak, longest: longestStreak }
}

/**
 * Get weekly wins summary
 */
export function getWeeklyWins(completedTasks, checkIns) {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  
  const thisWeekTasks = completedTasks.filter(task => 
    new Date(task.completedAt) >= oneWeekAgo
  )
  
  const thisWeekCheckIns = checkIns.filter(checkIn =>
    new Date(checkIn.date) >= oneWeekAgo
  )
  
  // Count high energy days
  const highEnergyDays = thisWeekCheckIns.filter(
    ci => ci.energy === 'High'
  ).length
  
  return {
    tasksCompleted: thisWeekTasks.length,
    daysCheckedIn: thisWeekCheckIns.length,
    highEnergyDays: highEnergyDays,
    message: getWeeklyMessage(thisWeekTasks.length, thisWeekCheckIns.length)
  }
}

function getWeeklyMessage(taskCount, checkInCount) {
  if (taskCount === 0 && checkInCount === 0) {
    return "This week was hard. That's okay. Tomorrow is a fresh start."
  }
  
  if (taskCount === 0 && checkInCount > 0) {
    return `You checked in ${checkInCount} times this week. That awareness is valuable.`
  }
  
  if (taskCount < 5) {
    return `${taskCount} tasks done! Every single one counts.`
  }
  
  if (taskCount < 10) {
    return `${taskCount} tasks completed! You're building great momentum.`
  }
  
  return `${taskCount} tasks done! You're absolutely crushing it! 🔥`
}

/**
 * Get celebration based on completion
 */
export function getCelebrationForTask(task, completedCount) {
  const messages = []
  
  // First task of the day
  if (completedCount === 1) {
    messages.push("First one done! Momentum started! 🚀")
  }
  
  // All micro-tasks complete
  const allMicroTasksDone = task.microTasks?.every(mt => mt.completed)
  if (allMicroTasksDone) {
    messages.push("Full task completed! Amazing work! 🎉")
  }
  
  // High priority task
  if (task.priority === 'High') {
    messages.push("High priority task conquered! 💪")
  }
  
  // Due today/overdue
  if (task.daysUntilDue === 0) {
    messages.push("Just in time! Well done! ⏰")
  }
  
  return messages.length > 0 
    ? messages[Math.floor(Math.random() * messages.length)]
    : getCelebration()
}

/**
 * Save celebration data
 */
export function saveCelebration(type, data) {
  const CELEBRATIONS_KEY = 'femwork_celebrations'
  const celebrations = JSON.parse(localStorage.getItem(CELEBRATIONS_KEY) || '[]')
  
  celebrations.push({
    type,
    data,
    timestamp: new Date().toISOString()
  })
  
  // Keep last 100
  const trimmed = celebrations.slice(-100)
  localStorage.setItem(CELEBRATIONS_KEY, JSON.stringify(trimmed))
}

/**
 * Get celebration animation
 */
export function getCelebrationAnimation() {
  const animations = [
    { emoji: '✨', color: '#FFD700' },
    { emoji: '🎉', color: '#FF6B9D' },
    { emoji: '⭐', color: '#FFA500' },
    { emoji: '💫', color: '#9D4EDD' },
    { emoji: '🌟', color: '#F72585' }
  ]
  
  return animations[Math.floor(Math.random() * animations.length)]
}