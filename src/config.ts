// Kurs mellem kroner og point. Der findes ikke noget "rigtigt" facit for
// den her — det er en forretningsbeslutning, ikke en teknisk en. Tallet
// herunder er sat løst efter det eksisterende statiske eksempel-katalog
// (skaerm-app/src/data/rewards.ts), hvor fx en is til 35-40 kr. kostede
// ca. 120 point. Ret bare tallet, hvis I vil have point til at føles
// "dyrere" eller "billigere" — det påvirker kun NYE/gemte rewards fra det
// øjeblik, I ændrer det; allerede oprettede rewards beholder deres pris.
export const POINTS_PER_KRONE = 150

// Den eneste konto, der ser godkendelses-skærmen i stedet for den normale
// partner-visning, når den logger ind. Skal matche PRÆCIS den mail-adresse,
// Jacob logger ind med — og skal også matche adressen i de RLS-policies og
// den trigger-undtagelse, der er sat op i
// supabase/migration-admin-approval.sql (ellers kan admin-skærmen vise
// rewards, men ikke rent faktisk godkende/afvise dem).
export const ADMIN_EMAIL = 'jacob.theill@gmail.com'
