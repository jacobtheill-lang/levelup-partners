import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { formatDateTime as formatDate } from '../lib/formatDate'

interface FeedbackRow {
  id: string
  child_name: string
  message: string
  created_at: string
}

interface ContactRow {
  id: string
  name: string | null
  email: string
  message: string
  created_at: string
}

type Tab = 'feedback' | 'contact'

// Kun til Jacob — se admin_can_read-policies i
// supabase/migration-admin-inbox-analytics.sql. To kilder samlet ét sted:
// feedback fra selve appen (børnene) og kontakt-beskeder fra landingssidens
// diskrete kontaktformular. Begge udløser en ntfy.sh-notifikation med det
// samme (samme emne som godkendelser), så denne skærm er "gå tilbage og se
// detaljerne", ikke den primære måde man opdager en ny besked på.
export function AdminInboxScreen() {
  const [tab, setTab] = useState<Tab>('feedback')
  const [feedback, setFeedback] = useState<FeedbackRow[] | null>(null)
  const [contact, setContact] = useState<ContactRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    client
      .from('feedback')
      .select('id, child_name, message, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) { setError('Kunne ikke hente feedback.'); return }
        setFeedback(data as FeedbackRow[])
      })
    client
      .from('contact_messages')
      .select('id, name, email, message, created_at')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) { setError((e) => e ?? 'Kunne ikke hente kontakt-beskeder.'); return }
        setContact(data as ContactRow[])
      })
  }, [])

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <p className="title-lg">Indbakke</p>
        <p className="subtle">Feedback fra appen og beskeder fra landingssidens kontaktformular.</p>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button
            type="button"
            className={tab === 'feedback' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            onClick={() => setTab('feedback')}
          >
            Feedback {feedback ? `(${feedback.length})` : ''}
          </button>
          <button
            type="button"
            className={tab === 'contact' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
            onClick={() => setTab('contact')}
          >
            Beskeder {contact ? `(${contact.length})` : ''}
          </button>
        </div>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      <div className="card">
        {tab === 'feedback' && (
          <>
            {feedback === null && <p className="subtle">Henter…</p>}
            {feedback !== null && feedback.length === 0 && (
              <div className="empty-state"><p>Ingen feedback endnu.</p></div>
            )}
            {feedback?.map((f) => (
              <div key={f.id} className="reward-row" style={{ alignItems: 'flex-start' }}>
                <div className="reward-row-info">
                  <p className="reward-row-name">{f.child_name}</p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{f.message}</p>
                  <p className="reward-row-meta">{formatDate(f.created_at)}</p>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'contact' && (
          <>
            {contact === null && <p className="subtle">Henter…</p>}
            {contact !== null && contact.length === 0 && (
              <div className="empty-state"><p>Ingen beskeder endnu.</p></div>
            )}
            {contact?.map((c) => (
              <div key={c.id} className="reward-row" style={{ alignItems: 'flex-start' }}>
                <div className="reward-row-info">
                  <p className="reward-row-name">{c.name?.trim() || c.email}</p>
                  {c.name && <p className="reward-row-meta">{c.email}</p>}
                  <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{c.message}</p>
                  <p className="reward-row-meta">{formatDate(c.created_at)}</p>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
