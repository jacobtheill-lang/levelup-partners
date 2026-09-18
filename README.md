# Partner-portal — Skærm til Oplevelse

Simpel webside hvor I (og senere jeres partnere) opretter og redigerer
oplevelser: billede, firmalogo/navn, betingelser, udløbsdato, en kr.-værdi
(der selv regner point ud), og hvor mange der er til rådighed. Adskilt fra
selve børneappen (`skaerm-app`) — samme backend, to selvstændige "døre ind",
som beskrevet i `arkitektur.html`.

Det vigtige designvalg: denne portal er ikke en midlertidig admin-side, I
skal smide væk senere. Login, rettigheder og tabeller er bygget sådan, at
**den samme side** bruges af jer selv i dag og af rigtige partnere senere —
der er intet at genbygge, kun flere brugere der kommer til.

I MVP'en er der ingen grund til, at rigtige partnere selv skal oprette sig
endnu — det er kun jer, der bruger siden, som den ene, der i dag lægger
rewards ind. Login er derfor stadig med (det er 30 sekunders arbejde, én
gang, og beskytter samtidig rewards mod at kunne redigeres af hvem som
helst, der har linket) — men det er JER, der logger ind, ikke en ekstern
virksomhed.

## Kr. til point

I skriver oplevelsens værdi i kroner — portalen udregner selv pointprisen
med en fast kurs (`POINTS_PER_KRONE` i `src/config.ts`, sat til 3 point pr.
kr. som udgangspunkt, løst efter det gamle statiske eksempel-katalog). Det
er en tommelfingerregel, ikke en fastlåst sandhed — ret tallet i `config.ts`,
hvis point skal føles "dyrere" eller "billigere". Allerede oprettede
rewards beholder deres pris, selvom I ændrer kursen bagefter; kun nye eller
redigerede rewards regner igen.

## Sådan sætter du det op (ca. 5 minutter)

1. Har I ikke allerede et Supabase-projekt (fx fra `skaerm-app`), opret ét på
   [supabase.com](https://supabase.com) — ellers genbrug det samme projekt,
   det er meningen: alt ligger i ét skema (se `datamodel.html`).
2. Åbn SQL-editoren i projektet, indsæt hele indholdet af
   `../skaerm-app/supabase/schema.sql`, og kør det. Det opretter alle seks
   tabeller (`children`, `sessions`, `task_attempts`, `partners`, `rewards`,
   `redemptions`), adgangsreglerne, og et offentligt billed-bucket.
3. Under **Authentication → Providers**, sørg for at **Email** er slået til
   (det er det som udgangspunkt). Slå evt. "Confirm email" fra under
   **Authentication → Settings**, hvis I vil kunne logge ind med det samme
   uden at bekræfte mailen først — praktisk i en tidlig fase.
4. Gå til **Project Settings → API**, kopiér **Project URL** og
   **anon public key**.
5. Kopiér `.env.example` til `.env`, indsæt de to værdier.
6. `npm install && npm run dev` (eller `npm run build` til en deploybar
   version).

## Sådan bruger du den

- Første gang: opret en konto (e-mail + adgangskode), bekræft evt. mailen,
  log ind, og udfyld jeres virksomhedsnavn.
- Herefter: opret oplevelser med "+ Ny oplevelse" — billede, navn, sted,
  betingelser, størrelse, værdi i kr. (portalen viser den udregnede
  pointpris med det samme), antal til rådighed (tomt felt = ubegrænset) og
  en valgfri udløbsdato.
- I kan altid slå en oplevelse fra (uden at slette den) eller redigere den.
- Antal indløst tælles automatisk op, hver gang et barn indløser
  oplevelsen i selve appen — I behøver ikke opdatere det manuelt.

## Hosting — sådan får du et rigtigt link

Ligesom `skaerm-app` bygger denne portal til en almindelig statisk mappe
(`npm run build` → `dist/`) — den skal hostes for sig selv, adskilt fra
Supabase (som kun er databasen). Se `arkitektur.html`, afsnittet "Hosting".

```bash
npm i -g vercel   # én gang, kan genbruges til begge apps
vercel login
vercel --prod     # kørt fra denne mappe, efter npm run build
```

Netlify virker identisk, eller endnu simplere: træk `dist/`-mappen direkte
ind på netlify.com. Indtil videre kører portalen kun lokalt hos dig
(`npm run dev`) — det er fint til at teste med, men et rigtigt link kræver
dette skridt.

## Hvordan det hænger sammen med barnets app

`skaerm-app` læser rewards direkte fra samme `rewards`-tabel (se
`src/lib/rewardsApi.ts` der), i stedet for den tidligere statiske fil. Er der
ikke sat en Supabase-forbindelse op i `skaerm-app`, falder den automatisk
tilbage til det gamle statiske katalog — så begge apps kan udvikles og
testes uafhængigt af hinanden.

## Hvad der bevidst ikke er bygget endnu

- **Fakturering.** Ingen betaling/opkrævning af partnere endnu — det er
  bevidst lagt uden for denne portal, se `arkitektur.html`.
- **Rigtig invitation af partnere.** Alle kan i dag oprette en konto via
  "Opret partner-konto" — der er ikke noget godkendelses- eller
  invitations-flow, I skal styre det manuelt (fx ved kun at dele linket med
  de partnere, I selv har aftalt med), indtil det bliver relevant.
- **Statistik/traction ud over indløsningstal.** Portalen viser i dag kun
  antal indløst pr. oplevelse — grafer/trends over tid er ikke bygget.
