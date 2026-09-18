import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { TIER_LABEL, type Reward, type RewardTier } from '../types'

// Kun til Jacob (se ADMIN_EMAIL i config.ts). Viser alle rewards, der venter
// på godkendelse — på tværs af ALLE partnere, ikke kun ens egne. Det virker
// kun fordi der er sat særlige RLS-policies + en undtagelse i
// godkendelses-triggeren op for netop denne mail, se
// supabase/migration-admin-approval.sql.
type PendingReward = Reward & {
  partners: { company_name: string; contact_email: string | null } | null
}

export function AdminApprovalScreen() {
  const [rewards, setRewards] = useState<PendingReward[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tierChoice, setTierChoice] = useState<Record<string, RewardTier>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load() {
    if (!supabase) return
    const { data, error: err } = await supabase
      .from('rewards')
      .select('*, partners(company_name, contact_email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    if (err) {
      setError('Kunne ikke hente ventende oplevelser.')
      return
    }
    setRewards(data as PendingReward[])
  }

  useEffect(() => {
    load()
  }, [])

  async function approve(r: PendingReward) {
    if (!supabase) return
    setBusyId(r.id)
    const tier = tierChoice[r.id] ?? 'mellem'
    const { error: err } = await supabase.from('rewards').update({ status: 'approved', tier }).eq('id', r.id)
    setBusyId(null)
    if (err) {
      setError('Kunne ikke godkende — prøv igen.')
      return
    }
    load()
  }

  async function reject(r: PendingReward) {
    if (!supabase) return
    if (!confirm(`Afvis "${r.name}" fra ${r.partners?.company_name ?? 'ukendt partner'}?`)) return
    setBusyId(r.id)
    const { error: err } = await supabase.from('rewards').update({ status: 'rejected' }).eq('id', r.id)
    setBusyId(null)
    if (err) {
      setError('Kunne ikke afvise — prøv igen.')
      return
    }
    load()
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="title-lg">Godkend oplevelser</p>
        <p className="subtle">
          {rewards === null ? 'Henter…' : `${rewards.length} venter på godkendelse`}
        </p>
      </div>

      <div className="info-box" style={{ marginBottom: 16 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>Principper at holde øje med her</p>
        <p className="subtle" style={{ margin: '4px 0 0' }}>
          LevelUp skal primært give <strong>oplevelser</strong> — noget børnene gør eller
          oplever, ikke bare forbruger. Afvis eller bed partneren justere, hvis en oplevelse
          reelt bare er slik/sodavand/fastfood uden en aktivitet omkring, eller hvis pris/points
          ikke matcher værdien.
        </p>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="card">
        {rewards === null && <p className="subtle">Henter…</p>}
        {rewards !== null && rewards.length === 0 && (
          <div className="empty-state">
            <p>Ingen ventende oplevelser lige nu.</p>
          </div>
        )}
        {rewards?.map((r) => (
          <div key={r.id} className="reward-row" style={{ alignItems: 'flex-start' }}>
            {r.image_url ? (
              <img src={r.image_url} alt="" className="reward-row-thumb" />
            ) : (
              <div className="reward-row-thumb" />
            )}
            <div className="reward-row-info">
              <p className="reward-row-name">{r.name}</p>
              <p className="reward-row-meta">
                {r.venue} · {r.value_dkk} kr. · {r.price_points} point ·{' '}
                {r.partners?.company_name ?? 'Ukendt partner'}
                {r.partners?.contact_email ? ` (${r.partners.contact_email})` : ''}
              </p>
              {r.description && <p className="reward-row-meta">{r.description}</p>}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
                <select
                  value={tierChoice[r.id] ?? 'mellem'}
                  onChange={(e) => setTierChoice((c) => ({ ...c, [r.id]: e.target.value as RewardTier }))}
                  style={{ width: 'auto' }}
                >
                  {(Object.keys(TIER_LABEL) as RewardTier[]).map((t) => (
                    <option key={t} value={t}>{TIER_LABEL[t]}</option>
                  ))}
                </select>
                <button type="button" className="btn btn-primary btn-sm" disabled={busyId === r.id} onClick={() => approve(r)}>
                  Godkend
                </button>
                <button type="button" className="btn btn-danger btn-sm" disabled={busyId === r.id} onClick={() => reject(r)}>
                  Afvis
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
