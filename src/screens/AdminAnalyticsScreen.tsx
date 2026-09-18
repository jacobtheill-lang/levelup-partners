import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

interface HourCount { hour: number; count: number }
interface WeekdayCount { weekday: number; count: number }
interface SubjectAccuracy { subject: string; attempts: number; accuracy_pct: number | null }
interface ChildStat {
  child_id: string
  name: string
  sessions: number
  points_total: number
  accuracy_pct: number | null
  last_active: string | null
}
interface Stats {
  total_children: number
  total_sessions: number
  sessions_today: number
  sessions_last_7_days: number
  avg_tasks_per_session: number | null
  avg_session_minutes: number | null
  accuracy_pct: number | null
  sessions_by_hour: HourCount[]
  sessions_by_weekday: WeekdayCount[]
  accuracy_by_subject: SubjectAccuracy[]
  per_child: ChildStat[]
}

const WEEKDAY_LABEL = ['Søn', 'Man', 'Tirs', 'Ons', 'Tors', 'Fre', 'Lør']

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ flex: '1 1 120px', background: 'var(--bg-alt)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.6rem', color: 'var(--ink)' }}>{value}</div>
      <div className="subtle" style={{ fontSize: '0.8rem', marginTop: 2 }}>{label}</div>
    </div>
  )
}

function BarChart({ data, labelFor }: { data: { key: number; count: number }[]; labelFor: (key: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 90 }}>
      {data.map((d) => (
        <div key={d.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div
            title={`${labelFor(d.key)}: ${d.count}`}
            style={{
              width: '100%',
              height: Math.max(3, (d.count / max) * 64),
              background: 'var(--teal)',
              borderRadius: 4,
            }}
          />
          <div style={{ fontSize: '0.62rem', color: 'var(--ink-faint)', writingMode: 'horizontal-tb' }}>
            {labelFor(d.key)}
          </div>
        </div>
      ))}
    </div>
  )
}

// Kun til Jacob — kalder admin_get_stats()-funktionen (se
// supabase/migration-admin-inbox-analytics.sql), som selv tjekker at det
// rent faktisk er ham der spørger, uanset hvem der ellers måtte kalde den.
// Ren CSS til graferne (ingen chart-bibliotek), samme stil som
// partner-logo-karrusellen på landingssiden.
export function AdminAnalyticsScreen() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) return
    supabase.rpc('admin_get_stats').then(({ data, error: err }) => {
      if (err) { setError('Kunne ikke hente statistik.'); return }
      setStats(data as Stats)
    })
  }, [])

  if (error) return <div className="error-box">{error}</div>
  if (!stats) return <p className="subtle">Henter…</p>

  const hourData = Array.from({ length: 24 }, (_, h) => ({
    key: h,
    count: stats.sessions_by_hour.find((d) => d.hour === h)?.count ?? 0,
  }))
  const weekdayData = [1, 2, 3, 4, 5, 6, 0].map((w) => ({
    key: w,
    count: stats.sessions_by_weekday.find((d) => d.weekday === w)?.count ?? 0,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <p className="title-lg">Statistik</p>
        <p className="subtle" style={{ marginBottom: 14 }}>
          Baseret på fuldførte sessioner. Tider er i UTC, ikke dansk tid — godt til at se mønstre, ikke til minuttet.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <StatBox label="Børn i alt" value={stats.total_children} />
          <StatBox label="Sessioner i dag" value={stats.sessions_today} />
          <StatBox label="Sidste 7 dage" value={stats.sessions_last_7_days} />
          <StatBox label="Sessioner i alt" value={stats.total_sessions} />
          <StatBox label="Snit opgaver/session" value={stats.avg_tasks_per_session ?? '–'} />
          <StatBox label="Snit minutter/session" value={stats.avg_session_minutes ?? '–'} />
          <StatBox label="Rigtige svar" value={stats.accuracy_pct != null ? `${stats.accuracy_pct}%` : '–'} />
        </div>
      </div>

      <div className="card">
        <p className="title-lg" style={{ fontSize: '1.1rem' }}>Hvornår på dagen</p>
        <p className="subtle" style={{ marginBottom: 12, fontSize: '0.85rem' }}>Antal sessioner pr. time i døgnet (UTC).</p>
        <BarChart data={hourData} labelFor={(h) => (h % 3 === 0 ? String(h) : '')} />
      </div>

      <div className="card">
        <p className="title-lg" style={{ fontSize: '1.1rem' }}>Hvilke dage</p>
        <BarChart data={weekdayData} labelFor={(w) => WEEKDAY_LABEL[w]} />
      </div>

      <div className="card">
        <p className="title-lg" style={{ fontSize: '1.1rem' }}>Rigtige svar pr. fag</p>
        {stats.accuracy_by_subject.length === 0 && <p className="subtle">Ingen data endnu.</p>}
        {stats.accuracy_by_subject.map((s) => (
          <div key={s.subject} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{s.subject}</span>
            <span className="subtle">{s.attempts} forsøg · {s.accuracy_pct != null ? `${s.accuracy_pct}%` : '–'} rigtige</span>
          </div>
        ))}
      </div>

      <div className="card">
        <p className="title-lg" style={{ fontSize: '1.1rem' }}>Pr. barn</p>
        {stats.per_child.length === 0 && <p className="subtle">Ingen børn endnu.</p>}
        {stats.per_child.map((c) => (
          <div key={c.child_id} className="reward-row">
            <div className="reward-row-info">
              <p className="reward-row-name">{c.name}</p>
              <p className="reward-row-meta">
                {c.sessions} session{c.sessions === 1 ? '' : 'er'} · {c.points_total} point ·{' '}
                {c.accuracy_pct != null ? `${c.accuracy_pct}% rigtige` : 'ingen data'}
              </p>
            </div>
            <div className="subtle" style={{ fontSize: '0.8rem', textAlign: 'right' }}>
              {c.last_active ? `Sidst aktiv ${new Date(c.last_active).toLocaleDateString('da-DK')}` : 'Ikke startet'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
