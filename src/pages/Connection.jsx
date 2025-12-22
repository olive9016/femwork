import { useEffect, useState } from "react"

const CONNECTION_KEY = "femwork_connections"

const QUESTIONS = [
  "Who sees you clearly, and how does that feel?",
  "What connection fed you most today?",
  "Where did you feel most yourself?",
  "Who made you smile today, and why?",
  "What conversation are you still carrying?",
  "Where did you show up authentically today?",
  "What felt tender in connection today?"
]

export default function Connection() {
  const [connections, setConnections] = useState([])
  const [connectionType, setConnectionType] = useState("")
  const [notes, setNotes] = useState("")
  const [todayQuestion, setTodayQuestion] = useState("")

  useEffect(() => {
    // Load saved connections
    const stored = localStorage.getItem(CONNECTION_KEY)
    if (stored) {
      try {
        setConnections(JSON.parse(stored))
      } catch (e) {
        console.error("Error loading connections:", e)
      }
    }

    // Get question of the day (rotates based on day of year)
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24)
    setTodayQuestion(QUESTIONS[dayOfYear % QUESTIONS.length])
  }, [])

  function saveConnection(e) {
    e.preventDefault()
    
    if (!connectionType || !notes.trim()) {
      alert("Please select a connection type and add notes")
      return
    }

    const newConnection = {
      id: Date.now(),
      type: connectionType,
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    }

    const updated = [newConnection, ...connections]
    setConnections(updated)
    localStorage.setItem(CONNECTION_KEY, JSON.stringify(updated))
    
    // Reset form
    setConnectionType("")
    setNotes("")
  }

  function deleteConnection(id) {
    const updated = connections.filter(c => c.id !== id)
    setConnections(updated)
    localStorage.setItem(CONNECTION_KEY, JSON.stringify(updated))
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto", paddingBottom: "100px" }}>
      <h2 style={{ marginBottom: "8px" }}>Connection</h2>
      <p style={{ 
        colour: "#999", 
        fontSize: "14px", 
        fontStyle: "italic",
        marginBottom: "24px"
      }}>
        A nurturing space to honour meaningful communication
      </p>

      {/* Spotlight Question */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ 
          margin: "0 0 16px 0", 
          fontSize: "16px", 
          colour: "#c9a87c",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <span style={{ fontSize: "18px" }}>♡</span>
          Spotlight Question of the Day
        </h3>
        <p style={{ 
          margin: 0, 
          fontStyle: "italic", 
          fontSize: "17px",
          lineHeight: "1.6",
          colour: "#333"
        }}>
          {todayQuestion}
        </p>
      </div>

      {/* Record a Connection */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ marginBottom: "20px", fontSize: "16px", colour: "#666" }}>
          Record a Connection
        </h3>

        <form onSubmit={saveConnection}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
              Who I connected with today
            </label>
            <select
              value={connectionType}
              onChange={(e) => setConnectionType(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "15px",
                background: "white"
              }}
            >
              <option value="">Select connection type...</option>
              <option value="Partner">Partner</option>
              <option value="Child">Child</option>
              <option value="Client">Client</option>
              <option value="Friend">Friend</option>
              <option value="Myself">Myself</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "14px", fontWeight: 500 }}>
              Space for Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Capture the essence of this connection..."
              required
              rows={4}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #ddd",
                fontSize: "15px",
                resize: "vertical",
                fontFamily: "inherit"
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px",
              background: "#c9a87c",
              colour: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: 500
            }}
          >
            Save Connection
          </button>
        </form>
      </div>

      {/* Recent Connections */}
      {connections.length > 0 && (
        <div>
          <h3 style={{ marginBottom: "16px", fontSize: "16px" }}>Recent Connections</h3>
          <div style={{ display: "grid", gap: "12px" }}>
            {connections.map((connection) => (
              <div
                key={connection.id}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  position: "relative"
                }}
              >
                <button
                  onClick={() => deleteConnection(connection.id)}
                  style={{
                    position: "absolute",
                    top: "16px",
                    right: "16px",
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
                
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: "12px",
                  paddingRight: "24px"
                }}>
                  <strong style={{ colour: "#c9a87c", fontSize: "15px" }}>
                    {connection.type}
                  </strong>
                  <span style={{ fontSize: "12px", colour: "#999" }}>
                    {new Date(connection.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: "14px", 
                  lineHeight: "1.6", 
                  colour: "#666" 
                }}>
                  {connection.notes}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}