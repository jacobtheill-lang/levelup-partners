import { supabase } from './supabase'

// Uploader ét billede til det offentlige 'reward-images'-bucket
// (se supabase/schema.sql i skaerm-app-projektet) og returnerer den
// offentlige URL, der gemmes direkte på reward-rækken.
export async function uploadRewardImage(file: File, partnerId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase er ikke sat op')
  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${partnerId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('reward-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('reward-images').getPublicUrl(path)
  return data.publicUrl
}

// Firmalogoet lægges i samme bucket som oplevelses-billeder (den var fra
// starten tænkt til begge dele, se schema.sql) — bare under sit eget
// filnavn, så det ikke overskriver et oplevelses-billede.
export async function uploadPartnerLogo(file: File, partnerId: string): Promise<string> {
  if (!supabase) throw new Error('Supabase er ikke sat op')
  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${partnerId}/logo-${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('reward-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('reward-images').getPublicUrl(path)
  return data.publicUrl
}
