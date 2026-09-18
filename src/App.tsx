import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './lib/supabase'
import { LoginScreen } from './screens/LoginScreen'
import { OnboardingScreen } from './screens/OnboardingScreen'
import { RewardsListScreen } from './screens/RewardsListScreen'
import { RewardFormScreen } from './screens/RewardFormScreen'
import type { Partner, Reward } from './types'

type View = { name: 'list' } | { name: 'create' } | { name: 'edit'; reward: Reward }

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
        <p className="brand">
          Partner-portal
          <small>Skærm til Oplevelse</small>
        </p>
        {session && (
          <button type="button" className="top-link" onClick={() => client.auth.signOut()}>
            Log ud
          </button>
        )}
      </div>

      {session === undefined && <p className="subtle">Henter…</p>}

      {session === null && <LoginScreen />}

      {session && partner === undefined && <p className="subtle">Henter…</p>}

      {session && partner === null && (
        <OnboardingScreen user={session.user} onDone={() => setPartner(undefined)} />
      )}

      {session && partner && view.name === 'list' && (
        <RewardsListScreen
          partnerId={partner.id}
          onCreate={() => setView({ name: 'create' })}
          onEdit={(reward) => setView({ name: 'edit', reward })}
        />
      )}

      {session && partner && view.name === 'create' && (
        <RewardFormScreen
          partnerId={partner.id}
          existing={null}
          onSaved={() => setView({ name: 'list' })}
          onCancel={() => setView({ name: 'list' })}
        />
      )}

      {session && partner && view.name === 'edit' && (
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
