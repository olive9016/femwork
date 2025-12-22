// Cycle management functions
// Using localStorage for now - can be connected to Supabase later

const CYCLES_KEY = "femwork_cycles"

export async function getCycles(userId) {
  // Simulate async operation
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem(CYCLES_KEY)
      if (stored) {
        const allCycles = JSON.parse(stored)
        const userCycles = allCycles.filter(c => c.user_id === userId)
        resolve(userCycles)
      } else {
        resolve([])
      }
    }, 100)
  })
}

export async function addCycle(cycleData) {
  // Simulate async operation
  return new Promise((resolve) => {
    setTimeout(() => {
      const stored = localStorage.getItem(CYCLES_KEY)
      const existing = stored ? JSON.parse(stored) : []
      
      const newCycle = {
        ...cycleData,
        id: Date.now().toString(),
        created_at: new Date().toISOString()
      }
      
      const updated = [...existing, newCycle]
      localStorage.setItem(CYCLES_KEY, JSON.stringify(updated))
      
      resolve(newCycle)
    }, 100)
  })
}
