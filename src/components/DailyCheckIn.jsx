import { useState } from "react"
import { calculateDailyCapacity, isImpossibleDay } from "../lib/capacity"

const CHECK_IN_KEY = "femwork_daily_checkins"

export default function DailyCheckIn({ cycle, onComplete, onSkip }) {
  const [energy, setEnergy] = useState("Medium")
  const [brainState, setBrainState] = useState("Calm")
  const [mood, setMood] = useState("")
  const [notes, setNotes] = useState("")

  function handleCheckIn() {
    const phase = cycle?.phase || "Follicular"
    
    const checkIn = {
      date: new Date().toISOString(),
      cycleDay: cycle?.currentDay,
      phase: phase,
      energy: energy,
      brainState: brainState,
      mood: mood,
      notes: notes
    }
    
    // Save to history
    const history = JSON.parse(localStorage.getItem(CHECK_IN_KEY) || '[]')
    history.push(checkIn)
    localStorage.setItem(CHECK_IN_KEY, JSON.stringify(history))
    
    // Calculate capacity
    const capacity = calculateDailyCapacity({ phase, energy, brainState })
    const impossible = isImpossibleDay({ phase, energy, brainState })
    
    // Save brain state for other components
    localStorage.setItem('femwork_brain_state', JSON.stringify({
      state: brainState,
      energy: energy,
      savedAt: new Date().toISOString()
    }))
    
    onComplete({ checkIn, capacity, impossible })
  }

  return (
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
        padding: "32px",
        maxWidth: "500px",
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto"
      }}>
        <h2 style={{ marginBottom: "8px", fontSize: "24px" }}>Good morning! ☀️</h2>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "24px" }}>
          Let's check in with how you're feeling today
        </p>

        {/* Energy Level */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "12px", fontSize: "15px", fontWeight: 600 }}>
            What's your energy like?
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {["Low", "Medium", "High"].map(level => (
              <button
                key={level}
                onClick={() => setEnergy(level)}
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  border: energy === level ? "2px solid #c9a87c" : "1px solid #ddd",
                  background: energy === level ? "#fff9f0" : "white",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: energy === level ? 600 : 400,
                  transition: "all 0.2s"
                }}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Brain State */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "12px", fontSize: "15px", fontWeight: 600 }}>
            How does your mind feel?
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
            {[
              { value: "Calm", emoji: "🧘" },
              { value: "Focused", emoji: "🎯" },
              { value: "Wired", emoji: "⚡" },
              { value: "Foggy", emoji: "🌫️" },
              { value: "Tender", emoji: "🌸" }
            ].map(state => (
              <button
                key={state.value}
                onClick={() => setBrainState(state.value)}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: brainState === state.value ? "2px solid #c9a87c" : "1px solid #ddd",
                  background: brainState === state.value ? "#fff9f0" : "white",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: brainState === state.value ? 600 : 400,
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s"
                }}
              >
                <span style={{ fontSize: "20px" }}>{state.emoji}</span>
                {state.value}
              </button>
            ))}
          </div>
        </div>

        {/* Optional: One-word mood */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "#666" }}>
            One word for today? (optional)
          </label>
          <input
            type="text"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder="E.g., hopeful, tired, excited..."
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid #ddd",
              fontSize: "15px"
            }}
          />
        </div>

        {/* Optional: Notes */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500, color: "#666" }}>
            Anything else? (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How are you really feeling today?"
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
            onClick={onSkip}
            style={{
              flex: 1,
              padding: "14px",
              background: "white",
              border: "1px solid #ddd",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
              color: "#666"
            }}
          >
            Skip for now
          </button>
          <button
            onClick={handleCheckIn}
            style={{
              flex: 2,
              padding: "14px",
              background: "#c9a87c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 600
            }}
          >
            Check In
          </button>
        </div>

        <p style={{ 
          fontSize: "12px", 
          color: "#999", 
          marginTop: "16px", 
          textAlign: "center",
          lineHeight: "1.5"
        }}>
          This helps FemWork show you only what you can realistically do today
        </p>
      </div>
    </div>
  )
}