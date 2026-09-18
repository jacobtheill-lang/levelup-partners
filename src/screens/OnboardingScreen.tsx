import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadPartnerLogo } from '../lib/uploadImage'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User
  onDone: () => void
}

export function OnboardingScreen({ user, onDone }: Props) {
  const [companyName, setCompanyName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [showOnLanding, setShowOnLanding] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function onPickLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    try {
      let logoUrl: string | null = null
      if (logoFile) {
        logoUrl = await uploadPartnerLogo(logoFile, user.id)
      }
      const { error: err } = await supabase.from('partners').insert({
        id: user.id,
        company_name: companyName.trim(),
        contact_email: user.email,
        logo_url: logoUrl,
        // Kun sat til true, hvis der rent faktisk er et logo at vise — et
        // samtykke uden logo ville bare give en tom firkant på landingssiden.
        show_on_landing: showOnLanding && logoUrl !== null,
      })
      if (err) throw err
      onDone()
    } catch {
      setError('Kunne ikke oprette profilen. Prøv igen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <p className="title-lg">Velkommen 👋</p>
      <p className="subtle" style={{ marginBottom: 18 }}>
        Sidste skridt — hvad hedder jeres virksomhed? Det er navnet, børnene ser under jeres
        oplevelser.
      </p>
      <div className="info-box" style={{ marginBottom: 18 }}>
        <p style={{ margin: 0 }}>
          LevelUp handler om rigtige oplevelser, børn og familier oplever sammen — ikke bare
          slik og sodavand. I opretter jeres første oplevelse på næste skærm.
        </p>
      </div>
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

        <div className="field">
          <label htmlFor="logo">Logo (valgfrit)</label>
          <div className="thumb-picker">
            {logoPreview ? (
              <img src={logoPreview} alt="" className="thumb-preview" />
            ) : (
              <div className="thumb-preview" />
            )}
            <input id="logo" type="file" accept="image/*" onChange={onPickLogo} />
          </div>
          <p className="field-hint">
            Kan tilføjes eller ændres når som helst senere under "Firmaprofil".
          </p>
        </div>

        <label className="checkbox-row" style={{ marginBottom: 18 }}>
          <input
            type="checkbox"
            checked={showOnLanding}
            onChange={(e) => setShowOnLanding(e.target.checked)}
          />
          Vis vores logo på LevelUps landingsside (under "Oplevelsespartnere")
        </label>

        {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || !companyName.trim()}>
          {busy ? 'Et øjeblik…' : 'Kom i gang'}
        </button>
      </form>
    </div>
  )
}
