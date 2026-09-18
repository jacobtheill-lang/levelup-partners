import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  onBack: () => void
}

// Personalets side af indløsningen: barnet viser koden/QR-koden frem på sin
// telefon, personalet taster (eller scanner, hvis I bruger telefonens
// kamera-app til at læse QR-koden og bare taster teksten ind her — der er
// ikke indbygget kamera-scanning i selve portalen endnu) koden ind her og
// trykker Indløs. Det er FØRST her, oplevelsen reelt bliver "brugt" i
// systemet — se supabase/migration-staff-redeem.sql.
type Result =
  | { status: 'ok'; reward_name: string; child_name: string; points_spent: number }
  | { status: 'already_used'; reward_name: string; child_name: string; used_at: string | null }
  | { status: 'not_found' }

export function RedeemCodeScreen({ onBack }: Props) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase || !code.trim()) return
    setBusy(true)
    setError(null)
    setResult(null)
    const { data, error: err } = await supabase.rpc('mark_redemption_used', { p_code: code.trim() })
    setBusy(false)
    if (err) {
      setError('Der skete en fejl — prøv igen.')
      return
    }
    setResult(data as Result)
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="title-lg">Indløs kode</p>
        <p className="subtle">
          Når et barn viser sin kode eller QR-kode frem hos jer, tast koden ind herunder og tryk
          Indløs — så er oplevelsen brugt, og barnet kan ikke vise den samme kode frem igen.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="code">Kode</label>
            <input
              id="code"
              type="text"
              autoCapitalize="characters"
              autoComplete="off"
              required
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setResult(null)
                setError(null)
              }}
              style={{ fontSize: '1.3rem', letterSpacing: '0.15em', textAlign: 'center' }}
            />
          </div>
          {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}
          <button type="submit" className="btn btn-primary btn-block" disabled={busy || !code.trim()}>
            {busy ? 'Tjekker…' : 'Indløs'}
          </button>
        </form>
      </div>

      {result?.status === 'ok' && (
        <div className="card" style={{ borderColor: 'var(--green, #26c281)' }}>
          <p className="title-lg">✅ Indløst</p>
          <p className="subtle">
            <strong>{result.reward_name}</strong> til {result.child_name}. God fornøjelse!
          </p>
        </div>
      )}

      {result?.status === 'already_used' && (
        <div className="card">
          <p className="title-lg">⚠️ Allerede indløst</p>
          <p className="subtle">
            <strong>{result.reward_name}</strong> til {result.child_name} er allerede blevet indløst
            {result.used_at ? ` (${new Date(result.used_at).toLocaleString('da-DK')})` : ''}. Denne kode
            kan ikke bruges igen.
          </p>
        </div>
      )}

      {result?.status === 'not_found' && (
        <div className="error-box">
          Koden blev ikke fundet, eller tilhører ikke jeres oplevelser. Tjek at den er tastet rigtigt ind.
        </div>
      )}

      <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 16 }} onClick={onBack}>
        Tilbage til oplevelser
      </button>
    </div>
  )
}
