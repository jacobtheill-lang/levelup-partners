// --- Kr → point: degressiv kurve ------------------------------------------
//
// Der findes ikke noget "rigtigt" facit her — det er en forretningsbeslutning,
// ikke en teknisk en. Men det er BEVIDST ikke længere én flad sats (kr × X),
// fordi en flad sats tvinger forholdet mellem "hvor mange dage tager den
// billigste" og "hvor mange dage tager den dyreste" til at være nøjagtig det
// samme som forholdet mellem priserne — en oplevelse til 2000 kr ville tage
// 100x så lang tid som en til 20 kr, uanset satsen. Det er urealistisk for et
// barn (og kedeligt).
//
// I stedet FALDER antal point pr. krone, jo dyrere oplevelsen er:
//  - Billige oplevelser (is, havnebad) føles hurtigt opnåelige.
//  - Dyre oplevelser (Tivoli, museum for hele familien) er stadig inden for
//    rækkevidde på et par måneders konsistent spil — ikke ni.
//  - Som en sidegevinst "kamuflerer" det den præcise kr-værdi af en given
//    oplevelse: der er ikke én division, der afslører den.
//
// Tabellen herunder er identisk med DEFAULT_POINTS_PER_KR i
// levelup-motor-simulator.html (simulatoren Jacob har brugt til at
// kalibrere tempoet) — HOLD DEM I SYNC, hvis satserne justeres, og
// opdatér samme tal i skaerm-app/src/data/rewards.ts's kommentar-note.
//
// Ret roligt tallene i tabellen, hvis I vil have point til at føles
// "dyrere" eller "billigere" — det påvirker kun NYE/gemte rewards fra det
// øjeblik, I ændrer det; allerede oprettede rewards beholder deres pris.
const RATE_TABLE: { kr: number; pointsPerKr: number }[] = [
  { kr: 10, pointsPerKr: 160 },
  { kr: 20, pointsPerKr: 140 },
  { kr: 50, pointsPerKr: 110 },
  { kr: 100, pointsPerKr: 90 },
  { kr: 250, pointsPerKr: 65 },
  { kr: 500, pointsPerKr: 50 },
  { kr: 1000, pointsPerKr: 38 },
  { kr: 2000, pointsPerKr: 27 },
]

// Glidende (log-log) interpolation mellem punkterne i RATE_TABLE, så enhver
// kr-værdi (også dem der ikke rammer et tabel-punkt præcist) får en sats,
// der falder jævnt i stedet for at "hoppe" ved hvert tærskel-punkt.
function interpolateRate(valueDkk: number): number {
  const table = RATE_TABLE
  if (valueDkk <= table[0].kr) return table[0].pointsPerKr

  const last = table[table.length - 1]
  if (valueDkk >= last.kr) {
    // Over 2000 kr (endnu ikke brugt i praksis, men skal ikke krakke):
    // fortsæt samme fald som sidste segment, men aldrig under det halve af
    // sidste sats, så meget dyre oplevelser ikke ender med at "koste 0".
    const prev = table[table.length - 2]
    const logSlope =
      (Math.log(last.pointsPerKr) - Math.log(prev.pointsPerKr)) / (Math.log(last.kr) - Math.log(prev.kr))
    const extrapolated = last.pointsPerKr * Math.exp(logSlope * (Math.log(valueDkk) - Math.log(last.kr)))
    return Math.max(extrapolated, last.pointsPerKr * 0.5)
  }

  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i]
    const b = table[i + 1]
    if (valueDkk >= a.kr && valueDkk <= b.kr) {
      const t = (Math.log(valueDkk) - Math.log(a.kr)) / (Math.log(b.kr) - Math.log(a.kr))
      return a.pointsPerKr + t * (b.pointsPerKr - a.pointsPerKr)
    }
  }
  return last.pointsPerKr
}

// --- Afrunding til "pæne" point-tiers ---------------------------------------
//
// Den degressive kurve ovenfor afgør stadig HVOR DYR en oplevelse føles
// relativt til de andre — men det rå resultat (fx 4259 point) er et
// tilfældigt-udseende tal. Jacob bad om at runde til faste tiers i stedet
// (500 / 1000 / 2000 / 5000 / 10000 / 20000 / 50000 / 100000), så en
// oplevelse altid koster ét af disse "pæne" tal. Afrundingen sker i
// LOG-skala (samme princip som kurven selv): fx 4259 (relativt tæt på 5000)
// runder til 5000, mens 2225 (relativt tæt på 2000) runder til 2000 — se
// samme kommentar/logik i skaerm-app/src/lib/pointsPricing.ts (HOLD I SYNC).
export const POINT_TIERS = [500, 1000, 2000, 5000, 10000, 20000, 50000, 100000]

export function snapToTier(rawPoints: number): number {
  if (rawPoints <= POINT_TIERS[0]) return POINT_TIERS[0]
  if (rawPoints >= POINT_TIERS[POINT_TIERS.length - 1]) return POINT_TIERS[POINT_TIERS.length - 1]
  let closest = POINT_TIERS[0]
  let closestLogDist = Infinity
  for (const tier of POINT_TIERS) {
    const dist = Math.abs(Math.log(rawPoints) - Math.log(tier))
    if (dist < closestLogDist) {
      closestLogDist = dist
      closest = tier
    }
  }
  return closest
}

/** Konverter en oplevelses værdi i kr. til dens pointpris via den degressive kurve, afrundet til nærmeste tier. */
export function pointsForValue(valueDkk: number): number {
  if (!Number.isFinite(valueDkk) || valueDkk <= 0) return 0
  const raw = Math.round(valueDkk * interpolateRate(valueDkk))
  return snapToTier(raw)
}

// Den eneste konto, der ser godkendelses-skærmen i stedet for den normale
// partner-visning, når den logger ind. Skal matche PRÆCIS den mail-adresse,
// Jacob logger ind med — og skal også matche adressen i de RLS-policies og
// den trigger-undtagelse, der er sat op i
// supabase/migration-admin-approval.sql (ellers kan admin-skærmen vise
// rewards, men ikke rent faktisk godkende/afvise dem).
export const ADMIN_EMAIL = 'jacob.theill@gmail.com'
