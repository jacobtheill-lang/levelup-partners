import { useEffect, useRef, useState } from 'react'

// Adresseopslag uden nogen API-nøgle: OpenStreetMap's gratis Nominatim-søgning
// (ingen Google-nøgle/betaling nødvendig for at få dette til at virke med det
// samme). Partneren søger sit sted, vælger det rigtige forslag, og vi gemmer
// den formaterede adresse + koordinater. Barnets app bruger bagefter et
// almindeligt Google Maps-link (se lib/mapsLink.ts i skaerm-app) til at åbne
// den PRÆCISE adresse — det er der, "Find derhen" reelt sker, uafhængigt af
// hvilken tjeneste selve søgningen her bruger.
interface Suggestion {
  display_name: string
  lat: string
  lon: string
}

interface Props {
  value: string
  onChange: (address: string, lat: number | null, lng: number | null) => void
}

export function AddressField({ value, onChange }: Props) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => setQuery(value), [value])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleInput(text: string) {
    setQuery(text)
    onChange(text, null, null) // fritekst indtil et forslag vælges — se AddressField.tsx-kommentaren
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (text.trim().length < 3) {
      setSuggestions([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&countrycodes=dk&q=${encodeURIComponent(text)}`
        const res = await fetch(url)
        const data = (await res.json()) as Suggestion[]
        setSuggestions(data)
        setOpen(true)
      } catch {
        setSuggestions([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  function pick(s: Suggestion) {
    setQuery(s.display_name)
    onChange(s.display_name, Number(s.lat), Number(s.lon))
    setOpen(false)
  }

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Søg adressen, fx Torvegade 45, København"
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && (suggestions.length > 0 || loading) && (
        <div
          style={{
            position: 'absolute',
            zIndex: 10,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            background: '#fff',
            border: '1.5px solid var(--line, #e5e0d8)',
            borderRadius: 10,
            boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {loading && <div style={{ padding: '10px 12px', fontSize: '0.85rem', color: 'var(--ink-faint, #9a9086)' }}>Søger…</div>}
          {!loading &&
            suggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => pick(s)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 12px',
                  fontSize: '0.85rem',
                  border: 'none',
                  borderTop: i > 0 ? '1px solid var(--line, #efe2cf)' : 'none',
                  background: '#fff',
                  cursor: 'pointer',
                }}
              >
                {s.display_name}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
