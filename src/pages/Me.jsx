import { useState, useEffect } from 'react'

const CYCLE_KEY = 'femwork_cycle'
const PERIOD_HISTORY_KEY = 'femwork_period_history'

export default function Me() {
  const [cycleData, setCycleData] = useState(null)
  const [periodHistory, setPeriodHistory] = useState([])
  const [showAddPrevious, setShowAddPrevious] = useState(false)
  const [previousDate, setPreviousDate] = useState('')
  
  // Current period tracking
  const [trackingPeriod, setTrackingPeriod] = useState(false)
  const [periodStartDate, setPeriodStartDate] = useState('')

  useEffect(() => {
    loadCycleData()
    loadPeriodHistory()
  }, [])

  function loadCycleData() {
    const saved = localStorage.getItem(CYCLE_KEY)
    if (saved) {
      setCycleData(JSON.parse(saved))
    }
  }

  function loadPeriodHistory() {
    const saved = localStorage.getItem(PERIOD_HISTORY_KEY)
    if (saved) {
      setPeriodHistory(JSON.parse(saved))
    }
  }

  function saveCycleData(data) {
    localStorage.setItem(CYCLE_KEY, JSON.stringify(data))
    setCycleData(data)
  }

  function savePeriodHistory(history) {
    localStorage.setItem(PERIOD_HISTORY_KEY, JSON.stringify(history))
    setPeriodHistory(history)
  }

  function startPeriod() {
    const today = new Date().toISOString().split('T')[0]
    
    const newCycleData = {
      start_date: today,
      cycle_length: cycleData?.cycle_length || 28,
      period_length: cycleData?.period_length || 5
    }
    
    saveCycleData(newCycleData)
    
    // Add to history
    const newHistory = [
      ...periodHistory,
      {
        date: today,
        addedAt: new Date().toISOString()
      }
    ].sort((a, b) => new Date(b.date) - new Date(a.date))
    
    savePeriodHistory(newHistory)
    
    setTrackingPeriod(false)
    setPeriodStartDate('')
  }

  function addPreviousPeriod() {
    if (!previousDate) return
    
    const newHistory = [
      ...periodHistory,
      {
        date: previousDate,
        addedAt: new Date().toISOString()
      }
    ].sort((a, b) => new Date(b.date) - new Date(a.date))
    
    savePeriodHistory(newHistory)
    
    // Update cycle data if this is the most recent period
    const mostRecent = newHistory[0]
    if (mostRecent.date === previousDate) {
      const newCycleData = {
        start_date: previousDate,
        cycle_length: cycleData?.cycle_length || 28,
        period_length: cycleData?.period_length || 5
      }
      saveCycleData(newCycleData)
    }
    
    setShowAddPrevious(false)
    setPreviousDate('')
  }

  function deletePeriodEntry(date) {
    if (confirm('Delete this period entry?')) {
      const updated = periodHistory.filter(p => p.date !== date)
      savePeriodHistory(updated)
      
      // Update cycle data if we deleted the most recent
      if (cycleData?.start_date === date && updated.length > 0) {
        const newCycleData = {
          ...cycleData,
          start_date: updated[0].date
        }
        saveCycleData(newCycleData)
      }
    }
  }

  function updateCycleLength(length) {
    const newCycleData = {
      ...cycleData,
      cycle_length: parseInt(length)
    }
    saveCycleData(newCycleData)
  }

  function updatePeriodLength(length) {
    const newCycleData = {
      ...cycleData,
      period_length: parseInt(length)
    }
    saveCycleData(newCycleData)
  }

  // Calculate stats
  function calculateAverageCycle() {
    if (periodHistory.length < 2) return null
    
    const sortedHistory = [...periodHistory].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    )
    
    let totalDays = 0
    let count = 0
    
    for (let i = 1; i < sortedHistory.length; i++) {
      const prevDate = new Date(sortedHistory[i - 1].date)
      const currDate = new Date(sortedHistory[i].date)
      const diff = Math.floor((currDate - prevDate) / (1000 * 60 * 60 * 24))
      
      // Only count realistic cycle lengths (15-45 days)
      if (diff >= 15 && diff <= 45) {
        totalDays += diff
        count++
      }
    }
    
    return count > 0 ? Math.round(totalDays / count) : null
  }

  function getNextPredictedPeriod() {
    if (!cycleData?.start_date) return null
    
    const startDate = new Date(cycleData.start_date)
    const cycleLength = cycleData.cycle_length || 28
    const nextDate = new Date(startDate)
    nextDate.setDate(nextDate.getDate() + cycleLength)
    
    return nextDate
  }

  function getCurrentPhase() {
    if (!cycleData?.start_date) return 'Unknown'
    
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

  const averageCycle = calculateAverageCycle()
  const nextPeriod = getNextPredictedPeriod()
  const currentPhase = getCurrentPhase()

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '24px' }}>Me</h1>

      {/* Current Phase */}
      {cycleData && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: '#666' }}>
            Current Phase
          </h3>
          <div style={{
            fontSize: '36px',
            fontWeight: 700,
            color: '#c9a87c',
            marginBottom: '8px'
          }}>
            {currentPhase}
          </div>
          {nextPeriod && (
            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
              Next period predicted: {nextPeriod.toLocaleDateString('en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short'
              })}
            </p>
          )}
        </div>
      )}

      {/* Period Tracking */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
          Period Tracking
        </h3>

        {!trackingPeriod ? (
          <button
            onClick={() => setTrackingPeriod(true)}
            style={{
              width: '100%',
              padding: '16px',
              background: '#E91E63',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              marginBottom: '12px'
            }}
          >
            🩸 Start Period Today
          </button>
        ) : (
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
              Mark today as the start of your period?
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={startPeriod}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#27AE60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                ✓ Yes
              </button>
              <button
                onClick={() => setTrackingPeriod(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'white',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowAddPrevious(true)}
          style={{
            width: '100%',
            padding: '12px',
            background: 'white',
            border: '2px solid #c9a87c',
            color: '#c9a87c',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          📅 Add Previous Period
        </button>
      </div>

      {/* Cycle Settings */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
          Cycle Settings
        </h3>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
            Average Cycle Length
          </label>
          <input
            type="number"
            value={cycleData?.cycle_length || 28}
            onChange={(e) => updateCycleLength(e.target.value)}
            min={21}
            max={35}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '15px'
            }}
          />
          {averageCycle && averageCycle !== cycleData?.cycle_length && (
            <div style={{ fontSize: '12px', color: '#666', marginTop: '6px' }}>
              💡 Based on your history: {averageCycle} days
              <button
                onClick={() => updateCycleLength(averageCycle)}
                style={{
                  marginLeft: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#3498DB',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                Use this
              </button>
            </div>
          )}
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>
            Period Length (days)
          </label>
          <input
            type="number"
            value={cycleData?.period_length || 5}
            onChange={(e) => updatePeriodLength(e.target.value)}
            min={3}
            max={7}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '15px'
            }}
          />
        </div>
      </div>

      {/* Period History */}
      {periodHistory.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
            Period History
            {averageCycle && (
              <span style={{ fontSize: '14px', fontWeight: 400, color: '#666', marginLeft: '8px' }}>
                (avg: {averageCycle} days)
              </span>
            )}
          </h3>

          {periodHistory.length < 2 && (
            <div style={{
              padding: '12px',
              background: '#FFF9E6',
              borderRadius: '8px',
              fontSize: '13px',
              color: '#856404',
              marginBottom: '16px'
            }}>
              💡 Add more periods to see your average cycle length
            </div>
          )}

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {periodHistory.slice(0, 10).map((period, index) => {
              const periodDate = new Date(period.date)
              
              // Calculate days since last period
              let daysSince = null
              if (index < periodHistory.length - 1) {
                const prevPeriod = new Date(periodHistory[index + 1].date)
                daysSince = Math.floor((periodDate - prevPeriod) / (1000 * 60 * 60 * 24))
              }
              
              return (
                <div
                  key={period.date}
                  style={{
                    padding: '12px',
                    background: index === 0 ? '#FFF4F8' : '#f9f9f9',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
                      {periodDate.toLocaleDateString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {index === 0 && (
                        <span style={{
                          marginLeft: '8px',
                          padding: '2px 6px',
                          background: '#E91E63',
                          color: 'white',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 600
                        }}>
                          LATEST
                        </span>
                      )}
                    </div>
                    {daysSince && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {daysSince} days after previous
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deletePeriodEntry(period.date)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#E74C3C',
                      fontSize: '16px',
                      cursor: 'pointer',
                      padding: '4px 8px'
                    }}
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Add Previous Period Modal */}
      {showAddPrevious && (
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
            <h3 style={{ marginBottom: '16px' }}>Add Previous Period</h3>
            
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              When did your last period start?
            </p>

            <input
              type="date"
              value={previousDate}
              onChange={(e) => setPreviousDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '15px',
                marginBottom: '20px'
              }}
              autoFocus
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={addPreviousPeriod}
                disabled={!previousDate}
                style={{
                  flex: 1,
                  padding: '14px',
                  background: previousDate ? '#c9a87c' : '#ddd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: previousDate ? 'pointer' : 'not-allowed'
                }}
              >
                ✓ Add Period
              </button>
              <button
                onClick={() => {
                  setShowAddPrevious(false)
                  setPreviousDate('')
                }}
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