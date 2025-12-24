// src/lib/cycles.js
// Helper function for cycle phase calculation
// Used by Schedule page (Me.jsx has its own implementation)

export function getCurrentPhase(cycleData) {
  if (!cycleData || !cycleData.start_date) {
    return { phase: "Follicular", cycleDay: 1 }
  }
  
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