import { useEffect, useState } from "react"

const CYCLE_KEY = "femwork_cycle"
const BRAIN_STATE_KEY = "femwork_brain_state"
const PERIOD_HISTORY_KEY = "femwork_period_history"

function calculateCurrentPhase(cycleData) {
  if (!cycleData || !cycleData.start_date) return null
  
  const start = new Date(cycleData.start_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  start.setHours(0, 0, 0, 0)
  
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  const cycleLength = cycleData.cycle_length || 28
  const cycleDay = (diff % cycleLength) + 1
  
  let phase = "Follicular"
  let phaseDescription = ""
  
  if (cycleDay >= 1 && cycleDay <= 5) {
    phase = "Menstrual"
    phaseDescription = "Rest and reflect. Your body is asking for gentleness."
  } else if (cycleDay >= 6 && cycleDay <= 13) {
    phase = "Follicular"
    phaseDescription = "Rising energy. Great time for planning and creating."
  } else if (cycleDay >= 14 && cycleDay <= 16) {
    phase = "Ovulatory"
    phaseDescription = "Peak energy. Ideal for meetings and delivery."
  } else {
    phase = "Luteal"
    phaseDescription = "Focus on completion and attention to detail."
  }
  
  return {
    day: cycleDay,
    phase: phase,
    description: phaseDescription,
    cycleLength: cycleLength
  }
}

function analysePatterns(history) {
  if (!history || history.length < 2) return null
  
  const cycleLengths = []
  const periodLengths = []
  
  // Calculate cycle lengths between periods
  for (let i = 1; i < history.length; i++) {
    const current = new Date(history[i].start_date)
    const previous = new Date(history[i - 1].start_date)
    const diff = Math.floor((current - previous) / (1000 * 60 * 60 * 24))
    cycleLengths.push(diff)
  }
  
  // Collect period lengths
  history.forEach(period => {
    if (period.period_length) {
      periodLengths.push(period.period_length)
    }
  })
  
  const avgCycleLength = cycleLengths.length > 0 
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : null
    
  const avgPeriodLength = periodLengths.length > 0
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : null
  
  const isRegular = cycleLengths.length > 0 
    ? Math.max(...cycleLengths) - Math.min(...cycleLengths) <= 3
    : null
  
  return {
    avgCycleLength,
    avgPeriodLength,
    isRegular,
    totalPeriods: history.length,
    cycleLengths,
    periodLengths
  }
}

export default function Me() {
  const [startDate, setStartDate] = useState("")
  const [periodLength, setPeriodLength] = useState("5")
  const [cycleLength, setCycleLength] = useState("28")
  const [brainState, setBrainState] = useState("Calm")
  const [energyLevel, setEnergyLevel] = useState("Medium")
  const [currentPhase, setCurrentPhase] = useState(null)
  const [periodHistory, setPeriodHistory] = useState([])
  const [patterns, setPatterns] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // Load cycle data
    const cycleData = localStorage.getItem(CYCLE_KEY)
    if (cycleData) {
      try {
        const data = JSON.parse(cycleData)
        setStartDate(data.start_date || "")
        setPeriodLength(data.period_length?.toString() || "5")
        setCycleLength(data.cycle_length?.toString() || "28")
        
        const phase = calculateCurrentPhase(data)
        setCurrentPhase(phase)
      } catch (e) {
        console.error("Error loading cycle data:", e)
      }
    }

    // Load period history
    const history = localStorage.getItem(PERIOD_HISTORY_KEY)
    if (history) {
      try {
        const historyData = JSON.parse(history)
        setPeriodHistory(historyData)
        setPatterns(analysePatterns(historyData))
      } catch (e) {
        console.error("Error loading period history:", e)
      }
    }

    // Load brain state
    const brainData = localStorage.getItem(BRAIN_STATE_KEY)
    if (brainData) {
      try {
        const data = JSON.parse(brainData)
        setBrainState(data.state || "Calm")
        setEnergyLevel(data.energy || "Medium")
      } catch (e) {
        console.error("Error loading brain state:", e)
      }
    }
  }, [])

  function saveCycleInfo(e) {
    e.preventDefault()
    
    if (!startDate) {
      alert("Please enter your period start date")
      return
    }

    const cycleData = {
      start_date: startDate,
      period_length: Number(periodLength),
      cycle_length: Number(cycleLength),
      savedAt: new Date().toISOString()
    }

    // Save current cycle
    localStorage.setItem(CYCLE_KEY, JSON.stringify(cycleData))
    
    // Add to period history
    const newEntry = {
      start_date: startDate,
      period_length: Number(periodLength),
      recorded_at: new Date().toISOString()
    }
    
    // Check if this date already exists in history
    const existingIndex = periodHistory.findIndex(
      p => p.start_date === startDate
    )
    
    let updatedHistory
    if (existingIndex >= 0) {
      // Update existing entry
      updatedHistory = [...periodHistory]
      updatedHistory[existingIndex] = newEntry
    } else {
      // Add new entry and sort by date (most recent first)
      updatedHistory = [newEntry, ...periodHistory]
      updatedHistory.sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
    }
    
    // Keep last 12 periods
    updatedHistory = updatedHistory.slice(0, 12)
    
    setPeriodHistory(updatedHistory)
    localStorage.setItem(PERIOD_HISTORY_KEY, JSON.stringify(updatedHistory))
    
    // Analyse patterns
    const newPatterns = analysePatterns(updatedHistory)
    setPatterns(newPatterns)
    
    // Update current phase
    const phase = calculateCurrentPhase(cycleData)
    setCurrentPhase(phase)
    
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function saveBrainState(e) {
    e.preventDefault()
    
    const stateData = {
      state: brainState,
      energy: energyLevel,
      savedAt: new Date().toISOString()
    }

    localStorage.setItem(BRAIN_STATE_KEY, JSON.stringify(stateData))
    
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function deletePeriodEntry(startDate) {
    const updated = periodHistory.filter(p => p.start_date !== startDate)
    setPeriodHistory(updated)
    localStorage.setItem(PERIOD_HISTORY_KEY, JSON.stringify(updated))
    setPatterns(analysePatterns(updated))
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
      <h2 style={{ marginBottom: "8px" }}>Reflective Intelligence Dashboard</h2>
      <p style={{ 
        colour: "#999", 
        fontSize: "14px", 
        fontStyle: "italic",
        marginBottom: "24px"
      }}>
        Track your rhythms and honour where you are today
      </p>

      {/* Current Status Display */}
      {currentPhase && (
        <div style={{
          background: "linear-gradient(135deg, #f0f0ff 0%, #e6f7ff 100%)",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          border: "2px solid #c9a87c"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "14px", colour: "#666", marginBottom: "8px" }}>
              You are currently on
            </div>
            <div style={{ fontSize: "32px", fontWeight: 700, colour: "#333", marginBottom: "8px" }}>
              Day {currentPhase.day}
            </div>
            <div style={{ fontSize: "20px", colour: "#c9a87c", fontWeight: 600, marginBottom: "12px" }}>
              {currentPhase.phase} Phase
            </div>
            <div style={{ fontSize: "14px", colour: "#666", lineHeight: "1.6", fontStyle: "italic" }}>
              {currentPhase.description}
            </div>
          </div>
        </div>
      )}

      {/* Pattern Analysis */}
      {patterns && patterns.totalPeriods >= 2 && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ marginBottom: "16px", fontSize: "18px", colour: "#c9a87c" }}>
            Your Patterns
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px" }}>
            {patterns.avgCycleLength && (
              <div style={{ textAlign: "center", padding: "12px", background: "#f8f9fa", borderRadius: "8px" }}>
                <div style={{ fontSize: "24px", fontWeight: 600, colour: "#333" }}>
                  {patterns.avgCycleLength}
                </div>
                <div style={{ fontSize: "13px", colour: "#666" }}>
                  Average cycle length (days)
                </div>
              </div>
            )}
            
            {patterns.avgPeriodLength && (
              <div style={{ textAlign: "center", padding: "12px", background: "#f8f9fa", borderRadius: "8px" }}>
                <div style={{ fontSize: "24px", fontWeight: 600, colour: "#333" }}>
                  {patterns.avgPeriodLength}
                </div>
                <div style={{ fontSize: "13px", colour: "#666" }}>
                  Average period length (days)
                </div>
              </div>
            )}
            
            <div style={{ textAlign: "center", padding: "12px", background: "#f8f9fa", borderRadius: "8px" }}>
              <div style={{ fontSize: "24px", fontWeight: 600, colour: "#333" }}>
                {patterns.totalPeriods}
              </div>
              <div style={{ fontSize: "13px", colour: "#666" }}>
                Periods tracked
              </div>
            </div>
            
            {patterns.isRegular !== null && (
              <div style={{ textAlign: "center", padding: "12px", background: "#f8f9fa", borderRadius: "8px" }}>
                <div style={{ fontSize: "24px", fontWeight: 600, colour: patterns.isRegular ? "#5cb85c" : "#f0ad4e" }}>
                  {patterns.isRegular ? "Regular" : "Varies"}
                </div>
                <div style={{ fontSize: "13px", colour: "#666" }}>
                  Cycle regularity
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cycle Tracking Form */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Cycle Tracking</h3>

        <form onSubmit={saveCycleInfo}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
              When did your last period start?
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
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
              How long did your period last?
            </label>
            <select
              value={periodLength}
              onChange={(e) => setPeriodLength(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "15px"
              }}
            >
              <option value="2">2 days</option>
              <option value="3">3 days</option>
              <option value="4">4 days</option>
              <option value="5">5 days</option>
              <option value="6">6 days</option>
              <option value="7">7 days</option>
              <option value="8">8 days</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
              Average cycle length (days)
            </label>
            <select
              value={cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "15px"
              }}
            >
              <option value="21">21 days</option>
              <option value="24">24 days</option>
              <option value="26">26 days</option>
              <option value="28">28 days (average)</option>
              <option value="30">30 days</option>
              <option value="32">32 days</option>
              <option value="35">35 days</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              background: "#c9a87c",
              colour: "white",
              border: "none",
              padding: "14px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 500,
              width: "100%"
            }}
          >
            Save Cycle Info
          </button>

          {saved && (
            <div style={{ 
              marginTop: "12px", 
              padding: "12px",
              background: "#e6f7e6",
              borderRadius: "8px",
              colour: "#2d5016",
              fontSize: "14px",
              textAlign: "center"
            }}>
              ✓ Saved! Your cycle info is now active across FemWork
            </div>
          )}
        </form>
      </div>

      {/* Period History */}
      {periodHistory.length > 0 && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Period History</h3>
          
          <div style={{ fontSize: "13px", colour: "#666", marginBottom: "16px" }}>
            Tracking {periodHistory.length} period{periodHistory.length !== 1 ? 's' : ''} helps FemWork understand your unique patterns
          </div>
          
          <div style={{ display: "grid", gap: "8px" }}>
            {periodHistory.map((period, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  background: "#f8f9fa",
                  borderRadius: "8px"
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 500 }}>
                    {new Date(period.start_date).toLocaleDateString('en-GB', { 
                      day: 'numeric', 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div style={{ fontSize: "13px", colour: "#666" }}>
                    {period.period_length} day{period.period_length !== 1 ? 's' : ''} long
                  </div>
                </div>
                <button
                  onClick={() => deletePeriodEntry(period.start_date)}
                  style={{
                    background: "transparent",
                    border: "none",
                    colour: "#999",
                    cursor: "pointer",
                    fontSize: "20px",
                    padding: "0 8px"
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Brain & Energy State Form */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>Brain & Energy State</h3>
        
        <p style={{ fontSize: "14px", colour: "#666", marginBottom: "16px" }}>
          Check in with yourself right now. How are you feeling?
        </p>

        <form onSubmit={saveBrainState}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
              Brain State
            </label>
            <select
              value={brainState}
              onChange={(e) => setBrainState(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "15px"
              }}
            >
              <option>Calm</option>
              <option>Focused</option>
              <option>Wired</option>
              <option>Foggy</option>
              <option>Tender</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
              Energy Level
            </label>
            <select
              value={energyLevel}
              onChange={(e) => setEnergyLevel(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "15px"
              }}
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
            </select>
          </div>

          <button
            type="submit"
            style={{
              background: "#c9a87c",
              colour: "white",
              border: "none",
              padding: "14px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 500,
              width: "100%"
            }}
          >
            Save State
          </button>
        </form>
      </div>

      {/* Info Box */}
      <div style={{
        padding: "20px",
        background: "#f8f9fa",
        borderRadius: "12px",
        fontSize: "13px",
        colour: "#666",
        lineHeight: "1.6"
      }}>
        <strong style={{ display: "block", marginBottom: "8px", colour: "#333" }}>
          How FemWork uses this information
        </strong>
        <p style={{ margin: 0 }}>
          Your cycle and energy data help FemWork provide personalised work insights, 
          task recommendations, and focus timer durations that align with your natural 
          rhythms. Tracking multiple periods helps us understand your unique patterns 
          and adjust recommendations accordingly. All data is stored securely in your browser.
        </p>
      </div>
    </div>
  )
}