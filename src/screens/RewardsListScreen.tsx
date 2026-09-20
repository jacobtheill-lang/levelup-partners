import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { STATUS_LABEL, TIER_LABEL, type Reward } from '../types'

interface Props {
  partnerId: string
  companyName: string
  contactEmail: string | null
  onCreate: () => void
  onEdit: (reward: Reward) => void
  onRedeem: () => void
  onProfile: () => void
}

export function RewardsListScreen({ partnerId, companyName, contactEmail, onCreate, onEdit, onRedeem, onProfile }: Props) {
  const [rewards, setRewards] = useState<Reward[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    if (!supabase) return
    const { data, error: err } = await supabase
      .from('rewards')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
    if (err) {
      setError('Kunne ikke hente jeres oplevelser.')
      return
    }
    setRewards(data as Reward[])
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId])

  async function toggleActive(r: Reward) {
    if (!supabase) return
    await supabase.from('rewards').update({ active: !r.active }).eq('id', r.id)
    load()
  }

  async function remove(r: Reward) {
    if (!supabase) return
    if (!confirm(`Slet "${r.name}"? Det kan ikke fortrydes.`)) return
    await supabase.from('rewards').delete().eq('id', r.id)
    load()
  }

  const totalRedemptions = rewards?.reduce((sum, r) => sum + r.quantity_redeemed, 0) ?? 0

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="title-lg">Jeres oplevelser</p>
        <p className="subtle">
          {rewards === null ? 'Henter…' : `${rewards.length} oplevelse${rewards.length === 1 ? '' : 'r'} · ${totalRedemptions} indløst i alt`}
        </p>
        {/* Så man kan se, hvilken virksomhed man rent faktisk er logget ind
            som — vigtigt hvis man har flere partnere/mails på samme
            computer, eller bare ikke selv har oprettet login'et. */}
        <p className="subtle" style={{ fontSize: '0.8rem', marginTop: 2 }}>
          Logget ind som <strong>{companyName}</strong>
          {contactEmail ? ` · ${contactEmail}` : ''}
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary" onClick={onCreate}>
            + Ny oplevelse
          </button>
          <button type="button" className="btn btn-ghost" onClick={onRedeem}>
            Indløsninger
          </button>
          <button type="button" className="btn btn-ghost" onClick={onProfile}>
            Firmaprofil
          </button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="card">
        {rewards === null && <p className="subtle">Henter…</p>}
        {rewards !== null && rewards.length === 0 && (
          <div className="empty-state">
            <p>Ingen oplevelser endnu.</p>
            <p className="subtle">Opret den første med knappen ovenfor.</p>
          </div>
        )}
        {rewards?.map((r) => {
          const soldOut = r.quantity_total !== null && r.quantity_redeemed >= r.quantity_total
          const lowStock = !soldOut && r.quantity_total !== null && r.quantity_total - r.quantity_redeemed <= 3
          const expired = r.expires_at !== null && r.expires_at < new Date().toISOString().slice(0, 10)
          return (
            <div key={r.id} className="reward-row">
              {r.image_url ? (
                <img src={r.image_url} alt="" className="reward-row-thumb" />
              ) : (
                <div className="reward-row-thumb" />
              )}
              <div className="reward-row-info">
                <p className="reward-row-name">{r.name}</p>
                <p className="reward-row-meta">
                  {TIER_LABEL[r.tier]} · {r.value_dkk} kr. ≈ {r.price_points} point ·{' '}
                  {r.quantity_total === null ? 'ubegrænset antal' : `${r.quantity_redeemed}/${r.quantity_total} indløst`}
                </p>
                <p className="reward-row-meta">
                  {r.venue_address
                    ? `📍 ${r.venue_address}${r.venue_lat == null ? ' (ikke valgt fra listen — intet kort-link)' : ''}`
                    : '📍 Ingen adresse angivet endnu'}
                </p>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                  <span className={`badge badge-${r.status}`}>{STATUS_LABEL[r.status]}</span>
                  <span className={`badge ${r.active ? 'badge-active' : 'badge-inactive'}`}>{r.active ? 'Aktiv' : 'Slået fra'}</span>
                  {soldOut && <span className="badge badge-outofstock">Udsolgt</span>}
                  {lowStock && <span className="badge badge-lowstock">Få tilbage</span>}
                  {expired && <span className="badge badge-outofstock">Udløbet</span>}
                </div>
                {r.status === 'pending' && (
                  <p className="subtle" style={{ marginTop: 4, fontSize: '0.8rem' }}>
                    Synlig for børn, så snart vi har godkendt den.
                  </p>
                )}
                {r.status === 'rejected' && (
                  <p className="subtle" style={{ marginTop: 4, fontSize: '0.8rem' }}>
                    Ikke godkendt — redigér oplevelsen, så sendes den til godkendelse igen.
                  </p>
                )}
              </div>
              <div className="reward-row-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEdit(r)}>Redigér</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => toggleActive(r)}>
                  {r.active ? 'Slå fra' : 'Slå til'}
                </button>
                <button type="button" className="btn btn-danger btn-sm" onClick={() => remove(r)}>Slet</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
