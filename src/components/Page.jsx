export default function Page({ title, subtitle, children }) {
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ marginBottom: 6 }}>{title}</h1>
        {subtitle && (
          <p style={{ marginTop: 0, color: "#7a7a7a" }}>{subtitle}</p>
        )}
      </header>

      <section style={{ display: "grid", gap: 16 }}>
        {children}
      </section>
    </div>
  )
}
