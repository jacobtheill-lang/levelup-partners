import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { uploadRewardImage } from '../lib/uploadImage'
import { AddressField } from '../components/AddressField'
import { pointsForValue } from '../config'
import type { Reward, RewardFormValues } from '../types'

interface Props {
  partnerId: string
  existing: Reward | null // null = opret ny
  onSaved: () => void
  onCancel: () => void
}

function toFormValues(r: Reward | null): RewardFormValues {
  if (!r) {
    return {
      name: '',
      venue: '',
      venue_address: '',
      venue_lat: null,
      venue_lng: null,
      description: '',
      value_dkk: '',
      quantity_total: '',
      expires_at: '',
      active: true,
    }
  }
  return {
    name: r.name,
    venue: r.venue,
    venue_address: r.venue_address ?? '',
    venue_lat: r.venue_lat,
    venue_lng: r.venue_lng,
    description: r.description ?? '',
    value_dkk: String(r.value_dkk),
    quantity_total: r.quantity_total === null ? '' : String(r.quantity_total),
    expires_at: r.expires_at ?? '',
    active: r.active,
  }
}

export function RewardFormScreen({ partnerId, existing, onSaved, onCancel }: Props) {
  const [values, setValues] = useState<RewardFormValues>(toFormValues(existing))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(existing?.image_url ?? null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update<K extends keyof RewardFormValues>(key: K, value: RewardFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError(null)
    try {
      let imageUrl = existing?.image_url ?? null
      if (imageFile) {
        imageUrl = await uploadRewardImage(imageFile, partnerId)
      }

      const valueDkk = Number(values.value_dkk)
      if (!Number.isFinite(valueDkk) || valueDkk <= 0) throw new Error('Angiv en værdi i kr. (større end 0).')
      const price = pointsForValue(valueDkk)
      const quantityTotal = values.quantity_total.trim() === '' ? null : Number(values.quantity_total)
      if (quantityTotal !== null && (!Number.isFinite(quantityTotal) || quantityTotal < 0)) {
        throw new Error('Antal skal være et tal, eller stå tomt for ubegrænset.')
      }

      const payload = {
        partner_id: partnerId,
        name: values.name.trim(),
        venue: values.venue.trim(),
        venue_address: values.venue_address.trim() || null,
        venue_lat: values.venue_lat,
        venue_lng: values.venue_lng,
        description: values.description.trim() || null,
        image_url: imageUrl,
        // Ingen "tier" her med vilje: den kategorisering (lille/mellem/stor)
        // sætter LevelUp selv, typisk i forbindelse med godkendelsen — en
        // partner skal ikke bruge tid på at gætte den, og en redigering skal
        // ikke ved et uheld overskrive en kategori, admin allerede har sat.
        value_dkk: valueDkk,
        price_points: price,
        quantity_total: quantityTotal,
        expires_at: values.expires_at || null,
        active: values.active,
      }

      const { error: err } = existing
        ? await supabase.from('rewards').update(payload).eq('id', existing.id)
        : await supabase.from('rewards').insert(payload)

      if (err) throw err
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke gemme oplevelsen. Prøv igen.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="card">
      <p className="title-lg">{existing ? 'Redigér oplevelse' : 'Ny oplevelse'}</p>
      <p className="subtle" style={{ marginBottom: 18 }}>
        {existing
          ? 'Ændrer du noget herunder, skal oplevelsen godkendes af LevelUp igen, før ændringen er synlig for børnene.'
          : 'Når du opretter oplevelsen, skal LevelUp lige godkende den (brand-fit + at pris/points passer), før den vises til børnene.'}
      </p>
      <div className="info-box" style={{ marginBottom: 18 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>Hvad slags oplevelser leder vi efter?</p>
        <p className="subtle" style={{ margin: '4px 0 0' }}>
          LevelUp er lavet til at give børn og familier <strong>rigtige oplevelser</strong> —
          noget man gør eller oplever sammen (en aktivitet, en entré, en time i naturen eller
          byen). Undgå slik, sodavand og anden usund mad/drikke som selve præmien — forældrene
          er med i appen, og de melder fra, hvis den fyldes med den slags. Et lille traktement
          som en del af en større oplevelse (fx en is efter havnebadet) er fint, men bør ikke stå
          alene som oplevelsen.
        </p>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="thumb">Billede</label>
          <div className="thumb-picker">
            {imagePreview ? (
              <img src={imagePreview} alt="" className="thumb-preview" />
            ) : (
              <div className="thumb-preview" />
            )}
            <input id="thumb" type="file" accept="image/*" onChange={onPickImage} />
          </div>
          <p className="field-hint">Vises til barnet i oplevelseskataloget. Valgfrit, men anbefales.</p>
        </div>

        <div className="field">
          <label htmlFor="name">Navn på oplevelsen</label>
          <input id="name" type="text" required placeholder="fx Is med 2 kugler" value={values.name} onChange={(e) => update('name', e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="venue">Sted / afdeling</label>
          <input id="venue" type="text" required placeholder="fx Christianshavns Is" value={values.venue} onChange={(e) => update('venue', e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="venue_address">Adresse</label>
          <AddressField
            value={values.venue_address}
            onChange={(address, lat, lng) => {
              setValues((v) => ({ ...v, venue_address: address, venue_lat: lat, venue_lng: lng }))
            }}
          />
          <p className="field-hint">
            Søg og vælg jeres adresse fra listen, så børnene kan finde præcis derhen i appen. Skriver
            I bare fritekst uden at vælge et forslag, gemmes teksten stadig, men uden kort-link.
          </p>
        </div>

        <div className="field">
          <label htmlFor="description">Betingelser / beskrivelse</label>
          <textarea id="description" placeholder="fx gælder alle hverdage, én pr. barn, skal vises inden kl. 18" value={values.description} onChange={(e) => update('description', e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="value">Værdi (kr.)</label>
          <input id="value" type="number" min={1} step="1" required placeholder="fx 40" value={values.value_dkk} onChange={(e) => update('value_dkk', e.target.value)} />
          <p className="field-hint">
            Den reelle værdi af oplevelsen i kroner.
            {Number(values.value_dkk) > 0 && (
              <> Koster ca. <strong>{pointsForValue(Number(values.value_dkk))} point</strong> i appen.</>
            )}
          </p>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor="quantity">Antal til rådighed</label>
            <input id="quantity" type="number" min={0} placeholder="Tomt = ubegrænset" value={values.quantity_total} onChange={(e) => update('quantity_total', e.target.value)} />
            <p className="field-hint">
              {existing ? `${existing.quantity_redeemed} allerede indløst.` : 'Tomt felt = intet loft på antal.'}
            </p>
          </div>
          <div className="field">
            <label htmlFor="expires">Udløber (valgfrit)</label>
            <input id="expires" type="date" value={values.expires_at} onChange={(e) => update('expires_at', e.target.value)} />
          </div>
        </div>

        <label className="checkbox-row" style={{ marginBottom: 18 }}>
          <input type="checkbox" checked={values.active} onChange={(e) => update('active', e.target.checked)} />
          Aktiv — vises til børnene i appen, når den er godkendt
        </label>

        {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Gemmer…' : existing ? 'Gem ændringer' : 'Opret oplevelse'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Annullér
          </button>
        </div>
      </form>
    </div>
  )
}
