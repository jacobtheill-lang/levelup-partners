import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Login foregår udelukkende via magic link (login-link på mail) — ingen
// adgangskode. Samme formular bruges til både første login (opretter automatisk
// en bruger i Supabase Auth) og alle senere logins: signInWithOtp opretter
// brugeren, hvis den ikke findes, og sender ellers bare et nyt login-link.
export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkSent, setLinkSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email,
        options: {
          // Sender brugeren tilbage til partner-portalen (ikke landingssiden),
          // uanset hvilken side login-linket blev sendt fra.
          emailRedirectTo: window.location.origin,
        },
      })
      if (err) throw err
      setLinkSent(true)
    } catch (err) {
      setError(err instanceof Error ? translateAuthError(err.message) : 'Der skete en fejl.')
    } finally {
      setBusy(false)
    }
  }

  if (linkSent) {
    return (
      <div className="card">
        <p className="title-lg">Tjek din mail 📬</p>
        <p className="subtle">
          Vi har sendt et login-link til <strong>{email}</strong>. Klik på linket for at logge ind
          — I skal ikke bruge nogen adgangskode.
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ marginTop: 14 }}
          onClick={() => setLinkSent(false)}
        >
          Send igen / brug en anden mail
        </button>
      </div>
    )
  }

  return (
    <div className="card">
      <p className="title-lg">Log ind som partner</p>
      <p className="subtle" style={{ marginBottom: 18 }}>
        Indtast jeres e-mail, så sender vi et login-link. Ny hos LevelUp? Samme formular opretter
        automatisk en konto til jer — I udfylder jeres oplysninger på næste skærm.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Et øjeblik…' : 'Send login-link'}
        </button>
      </form>
    </div>
  )
}

function translateAuthError(message: string): string {
  if (message.includes('Unable to validate email')) return 'Den e-mail ser ikke gyldig ud.'
  if (message.includes('rate limit')) return 'For mange forsøg — vent et par minutter og prøv igen.'
  return message
}
