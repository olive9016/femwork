import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

const CYCLE_KEY = 'femwork_cycle'
const SYMPTOMS_KEY = 'femwork_symptoms'

export default function Me() {
  const { user, signOut, syncToSupabase, isOnline } = useAuth()
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  
  // Cycle tracking states
  const [startDate, setStartDate] = useState('')
  const [periodLength, setPeriodLength] = useState(5)
  const [cycleLength, setCycleLength] = useState(28)
  const [hasCycleData, setHasCycleData] = useState(false)
  const [nextPeriodDate, setNextPeriodDate] = useState(null)
  const [currentPhase, setCurrentPhase] = useState(null)
  const [cycleDay, setCycleDay] = useState(null)
  
  // Symptom tracking
  const [showSymptomTracker, setShowSymptomTracker] = useState(false)
  const [todaySymptoms, setTodaySymptoms] = useState([])
  const [symptomHistory, setSymptomHistory] = useState([])

  const availableSymptoms = {
    'Physical': [
      'Cramps',
      'Headache',
      'Bloating',
      'Tender breasts',
      'Fatigue',
      'Back pain',
      'Nausea',
      'Acne'
    ],
    'Mood': [
      'Irritable',
      'Anxious',
      'Low mood',
      'Emotional',
      'Brain fog',
      'Can\'t focus',
      'Energetic',
      'Creative'
    ],
    'Energy': [
      'High energy',
      'Medium energy',
      'Low energy',
      'Exhausted'
    ],
    'Sleep': [
      'Slept well',
      'Insomnia',
      'Restless sleep',
      'Oversleeping'
    ],
    'Cravings': [
      'Sweet cravings',
      'Salty cravings',
      'Carb cravings',
      'No appetite',
      'Increased appetite'
    ]
  }

  useEffect(() => {
    loadCycleData()
    loadSymptomHistory()
  }, [])

  function loadCycleData() {
    const saved = localStorage.getItem(CYCLE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setStartDate(data.start_date || '')
        setPeriodLength(data.period_length || 5)
        setCycleLength(data.cycle_length || 28)
        setHasCycleData(true)
        
        if (data.start_date) {
          calculatePredictions(data.start_date, data.cycle_length)
        }
      } catch (e) {
        console.error('Error loading cycle data:', e)
      }
    }
  }

  function loadSymptomHistory() {
    const saved = localStorage.getItem(SYMPTOMS_KEY)
    if (saved) {
      try {
        const history = JSON.parse(saved)
        setSymptomHistory(history)
        
        // Check if symptoms logged today
        const today = new Date().toDateString()
        const todayEntry = history.find(entry => 
          new Date(entry.date).toDateString() === today
        )
        if (todayEntry) {
          setTodaySymptoms(todayEntry.symptoms)
        }
      } catch (e) {
        console.error('Error loading symptoms:', e)
      }
    }
  }

  function calculatePredictions(startDateStr, cycleLengthNum) {
    const start = new Date(startDateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    start.setHours(0, 0, 0, 0)
    
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
    const currentCycleDay = (diff % cycleLengthNum) + 1
    
    // Calculate next period
    const daysUntilNext = cycleLengthNum - currentCycleDay + 1
    const nextPeriod = new Date(today)
    nextPeriod.setDate(today.getDate() + daysUntilNext)
    
    setNextPeriodDate(nextPeriod)
    setCycleDay(currentCycleDay)
    
    // Determine phase
    let phase = "Follicular"
    if (currentCycleDay >= 1 && currentCycleDay <= 5) phase = "Menstrual"
    else if (currentCycleDay >= 6 && currentCycleDay <= 13) phase = "Follicular"
    else if (currentCycleDay >= 14 && currentCycleDay <= 16) phase = "Ovulatory"
    else phase = "Luteal"
    
    setCurrentPhase(phase)
  }

  function saveCycleData() {
    if (!startDate) {
      alert('Please enter your period start date')
      return
    }

    const cycleData = {
      start_date: startDate,
      period_length: periodLength,
      cycle_length: cycleLength,
      updated_at: new Date().toISOString()
    }

    localStorage.setItem(CYCLE_KEY, JSON.stringify(cycleData))
    setHasCycleData(true)
    calculatePredictions(startDate, cycleLength)
    
    // Sync to cloud if online
    if (user && isOnline) {
      syncToSupabase()
    }
    
    alert('Cycle data saved! 🌸')
  }

  function resetCycleData() {
    if (confirm('Are you sure you want to update your cycle data?')) {
      setHasCycleData(false)
    }
  }

  function toggleSymptom(symptom) {
    if (todaySymptoms.includes(symptom)) {
      setTodaySymptoms(todaySymptoms.filter(s => s !== symptom))
    } else {
      setTodaySymptoms([...todaySymptoms, symptom])
    }
  }

  function saveSymptoms() {
    const today = new Date().toISOString().split('T')[0]
    
    // Remove today's entry if it exists
    const updatedHistory = symptomHistory.filter(
      entry => entry.date !== today
    )
    
    // Add new entry
    const newEntry = {
      date: today,
      cycleDay: cycleDay,
      phase: currentPhase,
      symptoms: todaySymptoms
    }
    
    const newHistory = [...updatedHistory, newEntry].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    )
    
    setSymptomHistory(newHistory)
    localStorage.setItem(SYMPTOMS_KEY, JSON.stringify(newHistory))
    
    // Sync to cloud if online
    if (user && isOnline) {
      syncToSupabase()
    }
    
    setShowSymptomTracker(false)
    alert('Symptoms saved! 📊')
  }

  function getSymptomInsights() {
    if (symptomHistory.length < 7) return null
    
    // Analyze patterns
    const patterns = {}
    
    symptomHistory.forEach(entry => {
      const phase = entry.phase
      if (!patterns[phase]) {
        patterns[phase] = {}
      }
      
      entry.symptoms.forEach(symptom => {
        patterns[phase][symptom] = (patterns[phase][symptom] || 0) + 1
      })
    })
    
    // Find most common symptoms per phase
    const insights = {}
    Object.keys(patterns).forEach(phase => {
      const symptomCounts = patterns[phase]
      const sortedSymptoms = Object.entries(symptomCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([symptom, count]) => ({ symptom, count }))
      
      insights[phase] = sortedSymptoms
    })
    
    return insights
  }

  const insights = getSymptomInsights()

  async function handleManualSync() {
    if (!isOnline) {
      setSyncMessage('❌ Cannot sync while offline')
      setTimeout(() => setSyncMessage(''), 3000)
      return
    }
    
    setSyncing(true)
    setSyncMessage('')
    try {
      await syncToSupabase()
      setSyncMessage('✅ Data synced successfully!')
      setTimeout(() => setSyncMessage(''), 3000)
    } catch (error) {
      setSyncMessage('❌ Sync failed')
      setTimeout(() => setSyncMessage(''), 3000)
    } finally {
      setSyncing(false)
    }
  }

  async function handleSignOut() {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  function getDaysUntilPeriod() {
    if (!nextPeriodDate) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diff = Math.floor((nextPeriodDate - today) / (1000 * 60 * 60 * 24))
    return diff
  }

  const daysUntil = getDaysUntilPeriod()

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto", paddingBottom: "100px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "32px" }}>Me</h1>

      {/* Cycle Tracking Section */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ marginBottom: "16px" }}>Cycle Tracking</h3>
        
        {hasCycleData ? (
          <div>
            {/* Current Status */}
            <div style={{ 
              padding: "16px", 
              background: "linear-gradient(135deg, #f0f0ff 0%, #fff9f0 100%)",
              borderRadius: "8px",
              marginBottom: "16px"
            }}>
              <div style={{ fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
                Day {cycleDay} • {currentPhase} Phase
              </div>
              <div style={{ fontSize: "14px", marginBottom: "8px", color: "#666" }}>
                <strong>Last Period:</strong> {new Date(startDate).toLocaleDateString('en-GB')}
              </div>
              <div style={{ fontSize: "14px", color: "#666" }}>
                <strong>Period Length:</strong> {periodLength} days • <strong>Cycle:</strong> {cycleLength} days
              </div>
            </div>

            {/* Next Period Prediction */}
            {nextPeriodDate && (
              <div style={{
                padding: "16px",
                background: daysUntil <= 3 ? "#fff0f0" : "#f0fff0",
                border: `2px solid ${daysUntil <= 3 ? "#ffcccc" : "#ccffcc"}`,
                borderRadius: "8px",
                marginBottom: "16px"
              }}>
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
                  📅 Next Period Predicted:
                </div>
                <div style={{ fontSize: "18px", fontWeight: 600, color: daysUntil <= 3 ? "#cc0000" : "#00cc00" }}>
                  {nextPeriodDate.toLocaleDateString('en-GB', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                </div>
                <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
                  {daysUntil === 0 ? "Expected today" :
                   daysUntil === 1 ? "Expected tomorrow" :
                   daysUntil < 0 ? `${Math.abs(daysUntil)} days overdue` :
                   `In ${daysUntil} days`}
                </div>
              </div>
            )}
            
            {/* Symptom Tracker Button */}
            <button
              onClick={() => setShowSymptomTracker(true)}
              style={{
                width: "100%",
                padding: "12px",
                background: todaySymptoms.length > 0 ? "#e6f7e6" : "white",
                color: todaySymptoms.length > 0 ? "#060" : "#666",
                border: todaySymptoms.length > 0 ? "2px solid #060" : "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                marginBottom: "12px"
              }}
            >
              {todaySymptoms.length > 0 
                ? `✅ ${todaySymptoms.length} symptoms logged today`
                : "📊 Track Today's Symptoms"
              }
            </button>

            <button
              onClick={resetCycleData}
              style={{
                width: "100%",
                padding: "12px",
                background: "white",
                color: "#666",
                border: "1px solid #ddd",
                borderRadius: "8px",
                fontSize: "14px",
                cursor: "pointer"
              }}
            >
              Update Cycle Details
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
              Track your cycle to get phase-aware insights, capacity recommendations, and period predictions.
            </p>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
                When did your last period start?
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                How many days does your period typically last?
              </label>
              <input
                type="number"
                min="2"
                max="10"
                value={periodLength}
                onChange={(e) => setPeriodLength(parseInt(e.target.value))}
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
                How long is your full cycle? (days from one period to the next)
              </label>
              <input
                type="number"
                min="21"
                max="35"
                value={cycleLength}
                onChange={(e) => setCycleLength(parseInt(e.target.value))}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "8px",
                  border: "1px solid #ddd",
                  fontSize: "15px"
                }}
              />
            </div>

            <button
              onClick={saveCycleData}
              style={{
                width: "100%",
                padding: "14px",
                background: "linear-gradient(135deg, #c9a87c 0%, #d4a574 100%)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(201, 168, 124, 0.3)"
              }}
            >
              Save Cycle Data
            </button>
          </div>
        )}
      </div>

      {/* Symptom Insights */}
      {insights && (
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
        }}>
          <h3 style={{ marginBottom: "16px" }}>Your Patterns 📈</h3>
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
            Based on {symptomHistory.length} days of tracking
          </p>
          
          {Object.entries(insights).map(([phase, symptoms]) => (
            symptoms.length > 0 && (
              <div key={phase} style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                  {phase} Phase:
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  {symptoms.map(({ symptom, count }) => (
                    <span key={symptom} style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      background: "#f0f0f0",
                      borderRadius: "12px",
                      marginRight: "6px",
                      marginBottom: "6px"
                    }}>
                      {symptom} ({count}×)
                    </span>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Symptom Tracker Modal */}
      {showSymptomTracker && (
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
            <h3 style={{ marginBottom: "8px" }}>Track Today's Symptoms</h3>
            <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
              Day {cycleDay} • {currentPhase} Phase
            </p>

            {Object.entries(availableSymptoms).map(([category, symptoms]) => (
              <div key={category} style={{ marginBottom: "20px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
                  {category}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {symptoms.map(symptom => (
                    <button
                      key={symptom}
                      onClick={() => toggleSymptom(symptom)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "20px",
                        border: todaySymptoms.includes(symptom) ? "2px solid #c9a87c" : "1px solid #ddd",
                        background: todaySymptoms.includes(symptom) ? "#fff9f0" : "white",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: todaySymptoms.includes(symptom) ? 600 : 400
                      }}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={() => setShowSymptomTracker(false)}
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
                onClick={saveSymptoms}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "#c9a87c",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight: 600
                }}
              >
                Save ({todaySymptoms.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Info */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ marginBottom: "16px" }}>Account</h3>
        <div style={{ fontSize: "14px", color: "#666", marginBottom: "8px" }}>
          <strong>Email:</strong> {user?.email}
        </div>
        <div style={{ fontSize: "14px", color: "#666" }}>
          <strong>User ID:</strong> {user?.id?.slice(0, 8)}...
        </div>
      </div>

      {/* Sync Section */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0 }}>Cloud Sync</h3>
          <div style={{
            padding: "6px 12px",
            borderRadius: "12px",
            background: isOnline ? "#e6f7e6" : "#fee",
            color: isOnline ? "#060" : "#c00",
            fontSize: "13px",
            fontWeight: 600
          }}>
            {isOnline ? "🌐 Online" : "📴 Offline"}
          </div>
        </div>
        <p style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>
          {isOnline 
            ? "Your data automatically syncs every 30 seconds."
            : "You're offline. Changes are saved locally and will sync when you're back online."
          }
        </p>
        
        {syncMessage && (
          <div style={{
            padding: "12px",
            background: syncMessage.includes('✅') ? "#e6f7e6" : "#fee",
            borderRadius: "8px",
            marginBottom: "12px",
            fontSize: "14px"
          }}>
            {syncMessage}
          </div>
        )}

        <button
          onClick={handleManualSync}
          disabled={syncing || !isOnline}
          style={{
            width: "100%",
            padding: "12px",
            background: (syncing || !isOnline) ? "#ccc" : "#c9a87c",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "15px",
            fontWeight: 600,
            cursor: (syncing || !isOnline) ? "not-allowed" : "pointer"
          }}
        >
          {syncing ? "Syncing..." : isOnline ? "🔄 Sync Now" : "📴 Offline"}
        </button>
      </div>

      {/* About Section */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ marginBottom: "12px" }}>About FemWork</h3>
        <p style={{ fontSize: "14px", color: "#666", lineHeight: "1.6", marginBottom: "12px" }}>
          FemWork is a cycle-aware productivity app that helps you work with your body, not against it.
        </p>
        <div style={{ fontSize: "13px", color: "#999" }}>
          Version 1.0.0
        </div>
      </div>

      {/* Sign Out Button */}
      <button
        onClick={handleSignOut}
        style={{
          width: "100%",
          padding: "14px",
          background: "white",
          color: "#c00",
          border: "2px solid #c00",
          borderRadius: "8px",
          fontSize: "15px",
          fontWeight: 600,
          cursor: "pointer"
        }}
      >
        Sign Out
      </button>

      <p style={{
        marginTop: "16px",
        fontSize: "12px",
        color: "#999",
        textAlign: "center",
        lineHeight: "1.5"
      }}>
        Your data will be synced before signing out
      </p>
    </div>
  )
}