import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface Props {
  partnerId: string
  onBack: () => void
}

// Ren log — ingen handling for partneren at foretage. Barnet markerer selv
// oplevelsen som indløst i sin egen app, når de er hos jer (se
// RewardsScreen.tsx i skaerm-app + supabase/migration-child-redeem.sql).
// Her kan I se det, der er sket: hvem, hvad, hvornår den blev valgt,
// hvornår den blev indløst — og koden, hvis I nogensinde vil validere den
// mod det, barnet viser frem på sin telefon.
interface RedemptionRow {
  id: string
  child_name: string
  reward_name: string
  code: string
  points_spent: number
  created_at: string
  used: boolean
  used_at: string | null
}

export function RedemptionsLogScreen({ partnerId, onBack }: Props) {
  const [rows, setRows] = useState<RedemptionRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase
      .from('redemptions')
      .select('id, child_name, reward_name, code, points_spent, created_at, used, used_at')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) {
          setError('Kunne ikke hente indløsninger.')
          return
        }
        setRows(data as RedemptionRow[])
      })
  }, [partnerId])

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="title-lg">Indløsninger</p>
        <p className="subtle">
          Barnet markerer selv oplevelsen som indløst i sin egen app, når de er hos jer — I skal
          ikke gøre noget. Her kan I se, hvad der er valgt og indløst, og hvornår.
        </p>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="card">
        {rows === null && <p className="subtle">Henter…</p>}
        {rows !== null && rows.length === 0 && (
          <div className="empty-state">
            <p>Ingen indløsninger endnu.</p>
          </div>
        )}
        {rows?.map((row) => (
          <div key={row.id} className="reward-row" style={{ alignItems: 'flex-start' }}>
            <div className="reward-row-info">
              <p className="reward-row-name">{row.reward_name}</p>
              <p className="reward-row-meta">
                {row.child_name} · {row.points_spent} point · kode {row.code}
              </p>
              <p className="reward-row-meta">
                Valgt {new Date(row.created_at).toLocaleString('da-DK')}
              </p>
            </div>
            <span className={`badge ${row.used ? 'badge-active' : 'badge-inactive'}`}>
              {row.used && row.used_at
                ? `Indløst ${new Date(row.used_at).toLocaleString('da-DK')}`
                : 'Afventer indløsning'}
            </span>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-ghost btn-block" style={{ marginTop: 16 }} onClick={onBack}>
        Tilbage til oplevelser
      </button>
    </div>
  )
}
