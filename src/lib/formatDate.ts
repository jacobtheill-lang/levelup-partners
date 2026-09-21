// Alle tidspunkter i Supabase gemmes i UTC (timestamptz) — helt korrekt og som
// det skal være. Problemet var, at admin-skærmene viste dem med
// toLocaleString/toLocaleDateString UDEN at fortælle browseren hvilken
// tidszone den skal regne om til, så visningen faldt tilbage til UTC i
// stedet for dansk tid.
//
// Løsningen er IKKE at hardcode "+1 time" eller "CET" — Danmark skifter
// mellem CET (UTC+1) og CEST (UTC+2) to gange om året (sommertid), så en fast
// offset ville være forkert halve året. I stedet bruger vi IANA-tidszonen
// "Europe/Copenhagen", som selv ved præcis hvornår skiftet sker, uanset
// hvilken tidszone serveren/browseren der viser siden faktisk kører i.
const TZ = 'Europe/Copenhagen'

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('da-DK', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('da-DK', { timeZone: TZ })
}
