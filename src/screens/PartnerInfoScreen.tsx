// Vises KUN før login (session === null, se App.tsx) — forklarer hvad det vil
// sige at være LevelUp-partner, og hvordan indløsning fungerer, til besøgende
// der endnu ikke har oprettet sig. Rene forklarings-/illustrations-kort, ingen
// rigtige skærmbilleder (undgår at vise testdata fra pilotten) — samme stil
// som resten af portalen og landingssiden.
export function PartnerInfoScreen() {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 4 }}>
      <div>
        <p className="title-lg">Hvad vil det sige at være partner?</p>
        <p className="subtle">
          I opretter en eller flere rigtige oplevelser — en is, en biografbillet, en klatretime —
          som børn i LevelUp kan låse op med point, de har optjent ved at løse skoleopgaver.
          I får motiverede børn forbi, som kommer til at kende og tale om jeres forretning. Det koster ikke noget at være med.
        </p>
      </div>

      <div>
        <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: '0 0 10px' }}>Sådan fungerer indløsning</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { n: 1, text: 'I opretter jeres oplevelse her i portalen — navn, billede, beskrivelse, udløbsdato og antal.' },
            { n: 2, text: 'Børn ser den i appens katalog og reserverer den med deres points. Den lægges under "Mine oplevelser" i barnets app — klar til brug.' },
            { n: 3, text: 'Når børnene kommer forbi hos jer, åbner de oplevelsen og trykker "Indløs". I ser en kode på deres skærm som bekræftelse på indløsningen.' },
          ].map((step) => (
            <div key={step.n} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  flex: 'none',
                  borderRadius: '50%',
                  background: 'var(--gold, #d99a2b)',
                  color: '#fffaf0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                }}
              >
                {step.n}
              </div>
              <p className="subtle" style={{ margin: 0 }}>{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="info-box">
        <p style={{ margin: 0 }}>
          En indløsning kan ikke fortrydes, når koden er vist — så I kan altid stole på, at "indløst"
          betyder brugt. I kan følge alle jeres indløsninger under "Indløsninger" i portalen, når I er
          logget ind.
        </p>
      </div>
    </div>
  )
}
