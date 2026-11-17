import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { N8N_BASE, INTERNAL_PANEL_KEY } from '@/lib/env'
import { EmptyList } from '@/routes/comercial/SaleRow'

const USO_URL = `${N8N_BASE}/webhook/automatiq-claude-uso`
const CREAR_URL = `${N8N_BASE}/webhook/automatiq-crear-agente`

interface UsoDia {
  fecha: string
  tokens: number
  coste_usd: number
}
interface Uso {
  dias: UsoDia[]
  total_tokens: number
  total_coste_usd: number
  por_modelo: { modelo: string; tokens: number; coste_usd: number }[]
}
interface Borrador {
  nombre: string
  resumen: string
  workflow: unknown
}

const hdr = { 'Content-Type': 'application/json', 'X-Internal-Key': INTERNAL_PANEL_KEY }
const usd = (n: number) => '$' + n.toFixed(2)
const num = (n: number) => Math.round(n).toLocaleString('es-ES')

function UsoClaude() {
  const [uso, setUso] = useState<Uso | null>(null)
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>('cargando')

  useEffect(() => {
    let cancelled = false
    fetch(USO_URL, { method: 'POST', headers: hdr, body: JSON.stringify({ dias: 30 }) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Uso) => {
        if (cancelled) return
        setUso(d)
        setEstado('ok')
      })
      .catch(() => !cancelled && setEstado('error'))
    return () => {
      cancelled = true
    }
  }, [])

  const max = uso ? Math.max(1, ...uso.dias.map((d) => d.coste_usd)) : 1
  const hoy = uso?.dias[uso.dias.length - 1]
  const media = uso && uso.dias.length ? uso.total_coste_usd / uso.dias.length : 0

  return (
    <div>
      <div className="mb-3 text-sm font-bold">Uso de Claude por API (últimos 30 días)</div>
      {estado === 'cargando' && <EmptyList>Cargando…</EmptyList>}
      {estado === 'error' && (
        <Card className="p-4 text-sm text-muted-foreground">
          Todavía no está conectado. Importa en n8n el flujo «automatiq-claude-uso» y añade tu clave de
          administración de Anthropic como credencial; aquí aparecerá el gasto sin tocar nada más.
        </Card>
      )}
      {uso && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Gasto 30 días</div>
              <div className="mt-1 text-2xl font-bold">{usd(uso.total_coste_usd)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Media diaria</div>
              <div className="mt-1 text-2xl font-bold">{usd(media)}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Último día</div>
              <div className="mt-1 text-2xl font-bold">{hoy ? usd(hoy.coste_usd) : '—'}</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground">Tokens</div>
              <div className="mt-1 text-2xl font-bold">{num(uso.total_tokens)}</div>
            </Card>
          </div>
          <Card className="mb-4 p-4">
            <div className="flex h-32 items-end gap-1">
              {uso.dias.map((d) => (
                <div
                  key={d.fecha}
                  className="flex-1 rounded-t bg-emerald-500/80"
                  style={{ height: `${Math.max(2, (d.coste_usd / max) * 100)}%` }}
                  title={`${d.fecha}: ${usd(d.coste_usd)}`}
                />
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <div className="mb-3 text-sm font-bold">Por modelo</div>
            <div className="flex flex-col gap-2 text-sm">
              {uso.por_modelo.map((m) => (
                <div key={m.modelo} className="flex justify-between">
                  <span>{m.modelo}</span>
                  <span className="font-bold">
                    {usd(m.coste_usd)}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">{num(m.tokens)} tokens</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

function CreadorAgentes() {
  const [desc, setDesc] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [borrador, setBorrador] = useState<Borrador | null>(null)

  async function generar() {
    setCargando(true)
    setError(null)
    setBorrador(null)
    try {
      const r = await fetch(CREAR_URL, { method: 'POST', headers: hdr, body: JSON.stringify({ descripcion: desc }) })
      if (!r.ok) throw new Error(String(r.status))
      setBorrador((await r.json()) as Borrador)
    } catch {
      setError('No se pudo generar el borrador. ¿Está importado el flujo «automatiq-crear-agente» en n8n?')
    } finally {
      setCargando(false)
    }
  }

  function descargar() {
    if (!borrador) return
    const blob = new Blob([JSON.stringify(borrador.workflow, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${borrador.nombre || 'agente'}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div>
      <div className="mb-3 text-sm font-bold">Creador de agentes</div>
      <Card className="p-4">
        <p className="mb-3 text-sm text-muted-foreground">
          Describe qué debe hacer el agente. Claude genera un flujo base de n8n como borrador: se descarga
          para que lo revises e importes tú. Nada se activa solo.
        </p>
        <textarea
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          rows={4}
          placeholder="Ej.: cuando llegue un lead nuevo, resumirlo y avisarme por WhatsApp con su prioridad"
          className="w-full rounded-lg border bg-transparent p-3 text-sm"
        />
        <button
          type="button"
          onClick={generar}
          disabled={cargando || desc.trim().length < 15}
          className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
        >
          {cargando ? 'Generando…' : 'Generar borrador'}
        </button>
        {error && <div className="mt-3 text-sm text-amber-500">{error}</div>}
        {borrador && (
          <div className="mt-4 rounded-lg border p-3 text-sm">
            <div className="font-bold">{borrador.nombre}</div>
            <div className="mt-1 text-muted-foreground">{borrador.resumen}</div>
            <button type="button" onClick={descargar} className="mt-3 rounded-lg border px-3 py-1.5 text-xs font-semibold">
              Descargar flujo (.json)
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

export function AgentesTab() {
  return (
    <div className="grid gap-6">
      <UsoClaude />
      <CreadorAgentes />
    </div>
  )
}
