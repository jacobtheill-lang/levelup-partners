import { useState } from 'react'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User
  onDone: () => void
}

export function OnboardingScreen({ user, onDone }: Props) {
  const [companyName, setCompanyName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    const { error: err } = await supabase.from('partners').insert({
      id: user.id,
      company_name: companyName.trim(),
      contact_email: user.email,
    })
    setBusy(false)
    if (err) {
      setError('Kunne ikke oprette profilen. Prøv igen.')
      return
    }
    onDone()
  }

  return (
    <div className="card">
      <p className="title-lg">Velkommen 👋</p>
      <p className="subtle" style={{ marginBottom: 18 }}>
        Sidste skridt — hvad hedder jeres virksomhed? Det er navnet, børnene ser under jeres
        oplevelser.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="company">Virksomhedsnavn</label>
          <input
            id="company"
            type="text"
            required
            placeholder="fx Christianshavns Is"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || !companyName.trim()}>
          {busy ? 'Et øjeblik…' : 'Kom i gang'}
        </button>
      </form>
    </div>
  )
}
