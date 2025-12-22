import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  async function signIn(e) {
    e.preventDefault()
    setMessage("")
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    }

    setLoading(false)
  }

  async function signUp() {
    setMessage("")
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      if (error.message.toLowerCase().includes("already")) {
        setMessage("Account already exists. Please sign in instead.")
      } else {
        setMessage(error.message)
      }
    } else {
      setMessage("Account created. Check your email to verify, then sign in.")
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: 24 }}>
      <h2>Login</h2>

      <form onSubmit={signIn} style={{ display: "grid", gap: 12 }}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button type="submit" disabled={loading}>
          Sign in
        </button>
      </form>

      <button
        onClick={signUp}
        disabled={loading}
        style={{ marginTop: 12 }}
      >
        Create account
      </button>

      {message && (
        <p style={{ marginTop: 12 }}>
          {message}
        </p>
      )}
    </div>
  )
}
