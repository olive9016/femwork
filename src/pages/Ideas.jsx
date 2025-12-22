import { useEffect, useState } from "react"

const IDEAS_KEY = "femwork_ideas"

export default function Ideas() {
  const [ideas, setIdeas] = useState([])
  const [newIdea, setNewIdea] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem(IDEAS_KEY)
    if (stored) {
      setIdeas(JSON.parse(stored))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(IDEAS_KEY, JSON.stringify(ideas))
  }, [ideas])

  function addIdea() {
    if (!newIdea.trim()) return

    const idea = {
      id: Date.now(),
      text: newIdea.trim(),
      createdAt: new Date().toISOString()
    }

    setIdeas([idea, ...ideas])
    setNewIdea("")
  }

  function deleteIdea(id) {
    setIdeas(ideas.filter(idea => idea.id !== id))
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "8px" }}>Idea Drop</h2>
      <p style={{ 
        colour: "#999", 
        fontSize: "14px", 
        fontStyle: "italic",
        marginBottom: "24px"
      }}>
        A safe space to park ideas without the pressure to act on them right now
      </p>

      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
      }}>
        <h3 style={{ marginBottom: "16px", fontSize: "16px", colour: "#666" }}>
          Drop your idea here
        </h3>

        <textarea
          value={newIdea}
          onChange={(e) => setNewIdea(e.target.value)}
          placeholder="What's sparking your curiosity? Let it land here safely..."
          rows={4}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            border: "1px solid #ddd",
            fontSize: "15px",
            resize: "vertical",
            marginBottom: "12px"
          }}
        />

        <button
          onClick={addIdea}
          style={{
            background: "#c9a87c",
            colour: "white",
            border: "none",
            padding: "12px 24px",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "15px"
          }}
        >
          + Add Idea
        </button>
      </div>

      {ideas.length === 0 ? (
        <p style={{ 
          textAlign: "center", 
          colour: "#999", 
          padding: "60px 20px",
          fontSize: "14px",
          fontStyle: "italic"
        }}>
          No ideas yet. When inspiration strikes, drop it here.
        </p>
      ) : (
        <div>
          <h3 style={{ marginBottom: "16px", fontSize: "16px" }}>Saved Ideas</h3>
          <div style={{ display: "grid", gap: "12px" }}>
            {ideas.map((idea) => (
              <div
                key={idea.id}
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "16px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                  position: "relative"
                }}
              >
                <p style={{ margin: "0 0 8px 0", fontSize: "15px", lineHeight: "1.5" }}>
                  {idea.text}
                </p>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center" 
                }}>
                  <span style={{ fontSize: "12px", colour: "#999" }}>
                    {new Date(idea.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteIdea(idea.id)}
                    style={{
                      background: "transparent",
                      border: "none",
                      colour: "#999",
                      cursor: "pointer",
                      fontSize: "18px",
                      padding: "4px 8px"
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}