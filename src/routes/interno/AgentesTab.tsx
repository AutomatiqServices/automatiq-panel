import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Card } from '@/components/ui/card'
import { N8N_BASE, INTERNAL_PANEL_KEY } from '@/lib/env'
import { EmptyList } from '@/routes/comercial/SaleRow'

const USO_URL = `${N8N_BASE}/webhook/automatiq-claude-uso`
const CREAR_URL = `${N8N_BASE}/webhook/automatiq-crear-agente`
const AGENTES_URL = `${N8N_BASE}/webhook/automatiq-agentes-estado`

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
interface Agente {
  id: string
  nombre: string
  activo: boolean
  ejecuciones: number
  errores: number
  ultima: string | null
  por_dia: number[]
}
interface Borrador {
  nombre: string
  resumen: string
  workflow: unknown
}

const hdr = { 'Content-Type': 'application/json', 'X-Internal-Key': INTERNAL_PANEL_KEY }
const usd = (n: number) => '$' + n.toFixed(2)
const num = (n: number) => Math.round(n).toLocaleString('es-ES')

// Colores: naranja = Claude, y una paleta para el resto.
const PALETA = ['#f59e0b', '#2dd4bf', '#a78bfa', '#f472b6', '#60a5fa', '#34d399', '#fb7185', '#fbbf24']
const colorModelo = (m: string, i: number) =>
  /opus/i.test(m) ? '#f59e0b' : /sonnet/i.test(m) ? '#2dd4bf' : /haiku/i.test(m) ? '#a78bfa' : PALETA[(i + 3) % PALETA.length]

function hace(iso: string | null) {
  if (!iso) return 'nunca'
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'ahora mismo'
  if (min < 60) return `hace ${min} min`
  if (min < 1440) return `hace ${Math.round(min / 60)} h`
  return `hace ${Math.round(min / 1440)} d`
}

function Titulo({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="mb-3">
      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{children}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground/80">{sub}</div>}
    </div>
  )
}

/** Medidor circular tipo cuota: % del presupuesto gastado, con marca de lo permitido hoy. */
function Medidor({ pct, marca, color, etiqueta = 'del presupuesto' }: { pct: number; marca: number; color: string; etiqueta?: string }) {
  const R = 52
  const ARCO = 0.75 // 270 grados
  const L = 2 * Math.PI * R
  const p = Math.min(1, Math.max(0, pct))
  const ang = (v: number) => (135 + Math.min(1, Math.max(0, v)) * 270) * (Math.PI / 180)
  const mx = 70 + Math.cos(ang(marca)) * R
  const my = 70 + Math.sin(ang(marca)) * R
  const mx2 = 70 + Math.cos(ang(marca)) * (R - 11)
  const my2 = 70 + Math.sin(ang(marca)) * (R - 11)
  return (
    <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0">
      <g transform="rotate(135 70 70)" fill="none" strokeWidth="11" strokeLinecap="round">
        <circle cx="70" cy="70" r={R} stroke="rgba(255,255,255,0.08)" strokeDasharray={`${L * ARCO} ${L}`} />
        <circle
          cx="70"
          cy="70"
          r={R}
          stroke={color}
          strokeDasharray={`${L * ARCO * p} ${L}`}
          style={{ transition: 'stroke-dasharray .8s ease', filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </g>
      <line x1={mx} y1={my} x2={mx2} y2={my2} stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
      <text x="70" y="72" textAnchor="middle" fontSize="30" fontWeight="800" fill="currentColor">
        {Math.round(p * 100)}
        <tspan fontSize="14" fontWeight="700">
          %
        </tspan>
      </text>
      <text x="70" y="90" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.6">
        {etiqueta}
      </text>
    </svg>
  )
}

function Barra({ valor, marca, color }: { valor: number; marca?: number; color: string }) {
  return (
    <div className="relative h-2 w-full rounded-full bg-white/10">
      <div
        className="h-2 rounded-full"
        style={{ width: `${Math.min(100, Math.max(0, valor * 100))}%`, background: color, transition: 'width .8s ease' }}
      />
      {marca !== undefined && (
        <div className="absolute top-[-3px] h-3.5 w-0.5 rounded bg-white/90" style={{ left: `${Math.min(100, marca * 100)}%` }} />
      )}
    </div>
  )
}

function Kpi({ label, valor, nota, color }: { label: string; valor: string; nota?: string; color: string }) {
  return (
    <Card className="relative overflow-hidden p-4">
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: color }} />
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold tracking-tight">{valor}</div>
      {nota && <div className="mt-0.5 text-[11px] text-muted-foreground">{nota}</div>}
    </Card>
  )
}

/** Uso de la suscripción de Claude (no hay API): lo apuntas tú a mano y se guarda en este navegador. */
function SuscripcionClaude() {
  type Reg = { sesion: number; semana: number; fecha: string }
  const [reg, setReg] = useState<Reg>(() => {
    try {
      const v = JSON.parse(localStorage.getItem('aq_suscripcion_claude') || '')
      return { sesion: Number(v.sesion) || 0, semana: Number(v.semana) || 0, fecha: String(v.fecha || '') }
    } catch {
      return { sesion: 0, semana: 0, fecha: '' }
    }
  })
  const [edit, setEdit] = useState(false)
  const [sesion, setSesion] = useState(String(reg.sesion))
  const [semana, setSemana] = useState(String(reg.semana))
  const clamp = (v: string) => Math.min(100, Math.max(0, Math.round(Number(v) || 0)))
  const color = (p: number) => (p >= 85 ? '#fb7185' : p >= 60 ? '#f59e0b' : '#2dd4bf')
  function guardar() {
    const nuevo = { sesion: clamp(sesion), semana: clamp(semana), fecha: new Date().toISOString() }
    localStorage.setItem('aq_suscripcion_claude', JSON.stringify(nuevo))
    setReg(nuevo)
    setEdit(false)
  }
  return (
    <Card className="p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Titulo sub="Lo que ves en Claude → Ajustes → Uso. No hay forma automática de leerlo, así que lo apuntas aquí.">
          Suscripción de Claude
        </Titulo>
        <button
          type="button"
          onClick={() => setEdit((e) => !e)}
          className="rounded-md border border-white/15 px-3 py-1 text-xs font-semibold hover:bg-white/10"
        >
          {edit ? 'Cancelar' : 'Actualizar %'}
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-around gap-6">
        <div className="text-center">
          <Medidor pct={reg.sesion / 100} marca={0} color={color(reg.sesion)} etiqueta="sesión actual" />
        </div>
        <div className="text-center">
          <Medidor pct={reg.semana / 100} marca={0} color={color(reg.semana)} etiqueta="esta semana" />
        </div>
      </div>
      <div className="mt-3 text-center text-[11px] text-muted-foreground">
        {reg.fecha ? `Apuntado ${hace(reg.fecha)}` : 'Todavía no has apuntado nada'}
      </div>
      {edit && (
        <div className="mt-4 flex flex-wrap items-end justify-center gap-3">
          <label className="text-xs">
            Sesión actual (%)
            <input
              type="number"
              min={0}
              max={100}
              value={sesion}
              onChange={(e) => setSesion(e.target.value)}
              className="mt-1 block w-28 rounded-md border border-white/15 bg-transparent px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs">
            Semana (%)
            <input
              type="number"
              min={0}
              max={100}
              value={semana}
              onChange={(e) => setSemana(e.target.value)}
              className="mt-1 block w-28 rounded-md border border-white/15 bg-transparent px-2 py-1.5 text-sm"
            />
          </label>
          <button type="button" onClick={guardar} className="rounded-md bg-amber-500 px-4 py-1.5 text-sm font-bold text-black">
            Guardar
          </button>
        </div>
      )}
    </Card>
  )
}

function UsoClaude() {
  const [uso, setUso] = useState<Uso | null>(null)
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>('cargando')
  const [presupuesto, setPresupuesto] = useState<number>(() => {
    const v = Number(localStorage.getItem('aq_presupuesto_usd'))
    return v > 0 ? v : 50
  })

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

  const m = useMemo(() => {
    if (!uso) return null
    const ahora = new Date()
    const ym = ahora.toISOString().slice(0, 7)
    const diasMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0).getDate()
    const dia = ahora.getDate()
    const gastoMes = uso.dias.filter((d) => d.fecha.startsWith(ym)).reduce((a, d) => a + d.coste_usd, 0)
    const pct = gastoMes / presupuesto
    const permitido = dia / diasMes
    const ritmoDia = presupuesto / diasMes
    const proyeccion = (gastoMes / dia) * diasMes
    const restan = diasMes - dia
    const ultimos = uso.dias.slice(-14)
    const max = Math.max(0.0001, ...ultimos.map((d) => d.coste_usd))
    const media = uso.dias.length ? uso.total_coste_usd / uso.dias.length : 0
    const totalModelos = Math.max(0.0001, uso.por_modelo.reduce((a, x) => a + x.coste_usd, 0))
    return { gastoMes, pct, permitido, ritmoDia, proyeccion, restan, ultimos, max, media, totalModelos }
  }, [uso, presupuesto])

  function cambiarPresupuesto() {
    const v = Number(window.prompt('Presupuesto mensual de API en USD', String(presupuesto)))
    if (v > 0) {
      localStorage.setItem('aq_presupuesto_usd', String(v))
      setPresupuesto(v)
    }
  }

  if (estado === 'cargando') return <EmptyList>Cargando…</EmptyList>
  if (estado === 'error' || !uso || !m)
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Todavía no está conectado. Importa en n8n el flujo «automatiq-claude-uso» y añade tu clave de
        administración de Anthropic como credencial; aquí aparecerá el gasto sin tocar nada más.
      </Card>
    )

  const encima = m.pct > m.permitido
  const colorEstado = m.pct > 1 ? '#f87171' : encima ? '#f59e0b' : '#34d399'

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Gasto este mes" valor={usd(m.gastoMes)} nota={`de ${usd(presupuesto)} de presupuesto`} color="#f59e0b" />
        <Kpi label="Media diaria" valor={usd(m.media)} nota="últimos 30 días" color="#2dd4bf" />
        <Kpi label="Proyección fin de mes" valor={usd(m.proyeccion)} nota={m.proyeccion > presupuesto ? 'te pasarías' : 'dentro de presupuesto'} color="#a78bfa" />
        <Kpi label="Tokens (30 días)" valor={num(uso.total_tokens)} nota="entrada + salida + caché" color="#60a5fa" />
      </div>

      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-6">
          <div className="relative">
            <Medidor pct={m.pct} marca={m.permitido} color={colorEstado} />
          </div>
          <div className="min-w-[240px] flex-1">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: colorEstado }} />
              <span className="text-sm font-bold">Claude · API</span>
              <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `${colorEstado}22`, color: colorEstado }}>
                {m.pct > 1 ? 'Presupuesto superado' : encima ? 'Por encima del ritmo' : 'En ritmo'}
              </span>
              <button type="button" onClick={cambiarPresupuesto} className="ml-auto rounded-lg border px-2.5 py-1 text-[11px] font-semibold">
                Cambiar presupuesto
              </button>
            </div>
            <div className="grid gap-3 text-xs">
              <div>
                <div className="mb-1 flex justify-between">
                  <span>Usado del mes</span>
                  <b>{Math.round(m.pct * 100)}%</b>
                </div>
                <Barra valor={m.pct} marca={m.permitido} color={colorEstado} />
                <div className="mt-1 text-[11px] text-muted-foreground">
                  La marca blanca es lo permitido hoy ({Math.round(m.permitido * 100)}%).
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-white/5 p-2.5">
                  <div className="text-[10px] uppercase text-muted-foreground">Permitido hoy</div>
                  <div className="text-base font-extrabold">{usd(presupuesto * m.permitido)}</div>
                </div>
                <div className="rounded-lg bg-white/5 p-2.5">
                  <div className="text-[10px] uppercase text-muted-foreground">Ritmo por día</div>
                  <div className="text-base font-extrabold">{usd(m.ritmoDia)}</div>
                </div>
                <div className="rounded-lg bg-white/5 p-2.5">
                  <div className="text-[10px] uppercase text-muted-foreground">Queda</div>
                  <div className="text-base font-extrabold">{usd(Math.max(0, presupuesto - m.gastoMes))}</div>
                  <div className="text-[10px] text-muted-foreground">reinicia en {m.restan + 1} d</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <Titulo sub="Gasto por día en USD">Últimos 14 días</Titulo>
          <div className="flex h-32 items-end gap-1.5">
            {m.ultimos.map((d, i) => (
              <div key={d.fecha} className="group relative flex h-full flex-1 items-end" title={`${d.fecha}: ${usd(d.coste_usd)}`}>
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${Math.max(3, (d.coste_usd / m.max) * 100)}%`,
                    background: i === m.ultimos.length - 1 ? '#f59e0b' : 'linear-gradient(#fbbf24aa,#f59e0b55)',
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{m.ultimos[0]?.fecha.slice(5)}</span>
            <span>hoy</span>
          </div>
        </Card>
        <Card className="p-4">
          <Titulo sub="Quién gasta más">Reparto por modelo</Titulo>
          <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-white/10">
            {uso.por_modelo.map((x, i) => (
              <div key={x.modelo} style={{ width: `${(x.coste_usd / m.totalModelos) * 100}%`, background: colorModelo(x.modelo, i) }} />
            ))}
          </div>
          <div className="grid gap-2 text-sm">
            {uso.por_modelo.map((x, i) => (
              <div key={x.modelo} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorModelo(x.modelo, i) }} />
                <span className="flex-1 truncate">{x.modelo}</span>
                <span className="font-bold">{usd(x.coste_usd)}</span>
                <span className="w-24 text-right text-xs text-muted-foreground">{num(x.tokens)} tok</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function Sparkline({ datos, color }: { datos: number[]; color: string }) {
  const max = Math.max(1, ...datos)
  return (
    <div className="flex h-8 items-end gap-1">
      {datos.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm" style={{ height: `${Math.max(8, (v / max) * 100)}%`, background: v ? color : 'rgba(255,255,255,0.08)' }} />
      ))}
    </div>
  )
}

function AgentesN8n() {
  const [agentes, setAgentes] = useState<Agente[] | null>(null)
  const [estado, setEstado] = useState<'cargando' | 'ok' | 'error'>('cargando')

  useEffect(() => {
    let cancelled = false
    fetch(AGENTES_URL, { method: 'POST', headers: hdr, body: JSON.stringify({ dias: 7 }) })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { agentes: Agente[] }) => {
        if (cancelled) return
        setAgentes(d.agentes)
        setEstado('ok')
      })
      .catch(() => !cancelled && setEstado('error'))
    return () => {
      cancelled = true
    }
  }, [])

  if (estado === 'cargando') return <EmptyList>Cargando agentes…</EmptyList>
  if (estado === 'error' || !agentes)
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Aquí aparecerán tus agentes (flujos de n8n) con sus ejecuciones, errores y última actividad. Falta importar el
        flujo «automatiq-agentes-estado» en n8n.
      </Card>
    )

  const total = Math.max(1, agentes.reduce((a, x) => a + x.ejecuciones, 0))
  const activos = agentes.filter((a) => a.activo).length

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Agentes" valor={String(agentes.length)} nota={`${activos} activos`} color="#2dd4bf" />
        <Kpi label="Ejecuciones (7 días)" valor={num(agentes.reduce((a, x) => a + x.ejecuciones, 0))} color="#f59e0b" />
        <Kpi label="Errores" valor={num(agentes.reduce((a, x) => a + x.errores, 0))} color="#f87171" />
        <Kpi
          label="Éxito"
          valor={`${Math.round((1 - agentes.reduce((a, x) => a + x.errores, 0) / total) * 100)}%`}
          color="#34d399"
        />
      </div>

      <Card className="p-4">
        <Titulo sub="Ejecuciones de los últimos 7 días">Reparto del trabajo</Titulo>
        <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-white/10">
          {agentes.map((a, i) => (
            <div key={a.id} style={{ width: `${(a.ejecuciones / total) * 100}%`, background: PALETA[i % PALETA.length] }} />
          ))}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {agentes.map((a, i) => (
            <span key={a.id} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: PALETA[i % PALETA.length] }} />
              {a.nombre} <b>{a.ejecuciones}</b>
            </span>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {agentes.map((a, i) => {
          const c = PALETA[i % PALETA.length]
          const exito = a.ejecuciones ? Math.round((1 - a.errores / a.ejecuciones) * 100) : 100
          return (
            <Card key={a.id} className="p-4" style={{ boxShadow: `inset 0 0 0 1px ${c}33` }}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold" style={{ background: `${c}26`, color: c }}>
                  {a.nombre.replace(/^automatiq-?/i, '').slice(0, 2).toUpperCase() || 'AG'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{a.nombre}</div>
                  <div className="text-[11px] text-muted-foreground">última ejecución {hace(a.ultima)}</div>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ background: a.activo ? '#34d39926' : '#ffffff14', color: a.activo ? '#34d399' : '#9ca3af' }}>
                  {a.activo ? 'Activo' : 'Pausado'}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">Ejecuciones</div>
                  <div className="text-lg font-extrabold">{a.ejecuciones}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">Éxito</div>
                  <div className="text-lg font-extrabold" style={{ color: exito >= 90 ? '#34d399' : exito >= 70 ? '#f59e0b' : '#f87171' }}>
                    {exito}%
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-muted-foreground">Errores</div>
                  <div className="text-lg font-extrabold">{a.errores}</div>
                </div>
              </div>
              <div className="mt-3">
                <div className="mb-1 text-[10px] uppercase text-muted-foreground">Por día · 7 d</div>
                <Sparkline datos={a.por_dia} color={c} />
              </div>
            </Card>
          )
        })}
      </div>
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
    <Card className="relative overflow-hidden p-5">
      <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: 'linear-gradient(90deg,#f59e0b,#2dd4bf,#a78bfa)' }} />
      <Titulo sub="Claude escribe un flujo base de n8n como borrador. Se descarga para que lo revises e importes tú; nada se activa solo.">
        Crear un agente nuevo
      </Titulo>
      <textarea
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        rows={3}
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
        <div className="mt-4 rounded-lg border p-3 text-sm" style={{ borderColor: '#2dd4bf55', background: '#2dd4bf0d' }}>
          <div className="font-bold">{borrador.nombre}</div>
          <div className="mt-1 text-muted-foreground">{borrador.resumen}</div>
          <button type="button" onClick={descargar} className="mt-3 rounded-lg border px-3 py-1.5 text-xs font-semibold">
            Descargar flujo (.json)
          </button>
        </div>
      )}
    </Card>
  )
}

export function AgentesTab() {
  return (
    <div className="grid gap-8">
      <section>
        <Titulo sub="Gasto de la API de Claude contra el presupuesto que tú fijas">Claude · uso y presupuesto</Titulo>
        <div className="mb-5">
          <SuscripcionClaude />
        </div>
        <UsoClaude />
      </section>
      <section>
        <Titulo sub="Tus flujos de n8n, con lo que han hecho esta semana">Agentes</Titulo>
        <AgentesN8n />
      </section>
      <section>
        <CreadorAgentes />
      </section>
    </div>
  )
}
