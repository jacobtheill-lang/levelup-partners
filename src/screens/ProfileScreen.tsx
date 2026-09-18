import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadPartnerLogo } from '../lib/uploadImage'
import type { Partner } from '../types'

interface Props {
  partner: Partner
  onSaved: () => void
  onBack: () => void
}

export function ProfileScreen({ partner, onSaved, onBack }: Props) {
  const [companyName, setCompanyName] = useState(partner.company_name)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(partner.logo_url)
  const [showOnLanding, setShowOnLanding] = useState(partner.show_on_landing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

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
    setSaved(false)
    try {
      let logoUrl = partner.logo_url
      if (logoFile) {
        logoUrl = await uploadPartnerLogo(logoFile, partner.id)
      }
      const { error: err } = await supabase
        .from('partners')
        .update({
          company_name: companyName.trim(),
          logo_url: logoUrl,
          // Samme sikkerhed som ved oprettelsen: et samtykke uden logo giver
          // ingen mening på landingssiden.
          show_on_landing: showOnLanding && logoUrl !== null,
        })
        .eq('id', partner.id)
      if (err) throw err
      setSaved(true)
      onSaved()
    } catch {
      setError('Kunne ikke gemme ændringerne. Prøv igen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <p className="title-lg">Firmaprofil</p>
      <p className="subtle" style={{ marginBottom: 18 }}>
        Styr jeres logo, og om I skal vises på LevelUps landingsside under "Oplevelsespartnere".
      </p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="company">Virksomhedsnavn</label>
          <input
            id="company"
            type="text"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="logo">Logo</label>
          <div className="thumb-picker">
            {logoPreview ? (
              <img src={logoPreview} alt="" className="thumb-preview" />
            ) : (
              <div className="thumb-preview" />
            )}
            <input id="logo" type="file" accept="image/*" onChange={onPickLogo} />
          </div>
          <p className="field-hint">Vises på landingssiden, hvis I har sagt ja tak nedenfor.</p>
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
        {saved && !error && (
          <div style={{ marginBottom: 14, color: 'var(--green-ink, #148f5e)', fontWeight: 700, fontSize: 14 }}>
            Gemt ✅
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={busy || !companyName.trim()}>
            {busy ? 'Gemmer…' : 'Gem ændringer'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onBack}>
            Tilbage
          </button>
        </div>
      </form>
    </div>
  )
}
