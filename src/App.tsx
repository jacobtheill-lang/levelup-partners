import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './lib/supabase'
import { LoginScreen } from './screens/LoginScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { RewardsListScreen } from './screens/RewardsListScreen'
import { RewardFormScreen } from './screens/RewardFormScreen'
import { RedeemCodeScreen } from './screens/RedeemCodeScreen'
import { AdminApprovalScreen } from './screens/AdminApprovalScreen'
import { ADMIN_EMAIL } from './config'
import type { Partner, Reward } from './types'

type View = { name: 'list' } | { name: 'create' } | { name: 'edit'; reward: Reward } | { name: 'redeem' }

function NotConfigured() {
  return (
    <div className="card">
      <p className="title-lg">Ikke sat op endnu</p>
      <p className="subtle">
        Denne portal mangler forbindelse til Supabase-projektet. Kopiér <code>.env.example</code> til{' '}
        <code>.env</code>, udfyld nøglerne fra jeres Supabase-projekt (samme projekt som{' '}
        <code>skaerm-app</code> bruger til pilot-analytics), og kør <code>npm run build</code> igen. Se{' '}
        <code>README.md</code>.
      </p>
    </div>
  )
}

function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined) // undefined = ukendt endnu
  const [partner, setPartner] = useState<Partner | null | undefined>(undefined)
  const [view, setView] = useState<View>({ name: 'list' })

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    client.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = client.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setPartner(undefined)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return
    const client = supabase
    client
      .from('partners')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data }) => setPartner((data as Partner | null) ?? null))
  }, [session])

  if (!supabaseConfigured) {
    return (
      <div className="portal">
        <NotConfigured />
      </div>
    )
  }

  const client = supabase!

  return (
    <div className="portal">
      <div className="portal-topbar">
        <a
          href="https://mit-levelup.vercel.app/landing.html"
          title="Til landingssiden"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffb703',
              borderRadius: 10,
              transform: 'rotate(-6deg)',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2b2420" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 15l6-8 6 8" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <div style={{ fontFamily: '"Baloo 2", ui-rounded, system-ui, sans-serif', fontWeight: 800, fontSize: 18, color: '#2b2420', lineHeight: 1 }}>LevelUp</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 9, height: 2, borderRadius: 2, background: '#26c281' }} />
              <div style={{ fontWeight: 700, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#148f5e' }}>Moments</div>
            </div>
          </div>
          <span className="subtle" style={{ marginLeft: 6, fontSize: 13 }}>Partner-portal</span>
        </a>
        {session && (
          <button type="button" className="top-link" onClick={() => client.auth.signOut()}>
            Log ud
          </button>
        )}
      </div>

      {session === undefined && <p className="subtle">Henter…</p>}

      {session === null && <LoginScreen />}

      {session && session.user.email === ADMIN_EMAIL && <AdminApprovalScreen />}

      {session && session.user.email !== ADMIN_EMAIL && partner === undefined && (
        <p className="subtle">Henter…</p>
      )}

      {session && session.user.email !== ADMIN_EMAIL && partner === null && (
        <OnboardingScreen user={session.user} onDone={() => setPartner(undefined)} />
      )}

      {session && session.user.email !== ADMIN_EMAIL && partner && view.name === 'list' && (
        <RewardsListScreen
          partnerId={partner.id}
          onCreate={() => setView({ name: 'create' })}
          onEdit={(reward) => setView({ name: 'edit', reward })}
          onRedeem={() => setView({ name: 'redeem' })}
        />
      )}

      {session && session.user.email !== ADMIN_EMAIL && partner && view.name === 'redeem' && (
        <RedeemCodeScreen onBack={() => setView({ name: 'list' })} />
      )}

      {session && session.user.email !== ADMIN_EMAIL && partner && view.name === 'create' && (
        <RewardFormScreen
          partnerId={partner.id}
          existing={null}
          onSaved={() => setView({ name: 'list' })}
          onCancel={() => setView({ name: 'list' })}
        />
      )}

      {session && session.user.email !== ADMIN_EMAIL && partner && view.name === 'edit' && (
        <RewardFormScreen
          partnerId={partner.id}
          existing={view.reward}
          onSaved={() => setView({ name: 'list' })}
          onCancel={() => setView({ name: 'list' })}
        />
      )}
    </div>
  )
}

export default App
