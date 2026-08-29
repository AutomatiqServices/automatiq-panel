import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { N8N_BASE, INTERNAL_PANEL_KEY } from '@/lib/env'
import { fm, fmtDate } from '@/lib/format'
import { useAuth } from '@/stores/auth'
import type { DiagnosticoPendiente, PrecioManual } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useConfirm } from '@/components/ui/use-confirm'
import { DesgloseCostos } from './DesgloseCostos'

const WF_E1_URL = `${N8N_BASE}/webhook/automatiq-diagnostico-borrador`
const WF_E2_URL = `${N8N_BASE}/webhook/automatiq-diagnostico-aprobar`
const WF_E3_URL = `${N8N_BASE}/webhook/automatiq-diagnostico-reprecio`

type EstadoBadge = { label: string; variant: 'secondary' | 'default' | 'outline' }

function estadoBadge(d: DiagnosticoPendiente): EstadoBadge {
  if (d.diag_estado === 'aprobado') return { label: 'Aprobado · enviando…', variant: 'default' }
  if (d.pdf_url) return { label: 'Borrador listo para revisar', variant: 'outline' }
  return { label: 'Sin generar', variant: 'secondary' }
}

export function DiagnosticosTab() {
  const perfil = useAuth((s) => s.perfil)
  const { confirmar, dialogo } = useConfirm()
  const [diagnosticos, setDiagnosticos] = useState<DiagnosticoPendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [openPdf, setOpenPdf] = useState<Record<string, string>>({})
  const [openDesglose, setOpenDesglose] = useState<Record<string, boolean>>({})

  function toggleDesglose(id: string) {
    setOpenDesglose((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  async function load() {
    setLoading(true)
    const { data, error } = await supabase.rpc('get_diagnosticos_pendientes')
    if (error) {
      toast.error('No se pudieron cargar los diagnósticos.')
      setLoading(false)
      return
    }
    setDiagnosticos((data as DiagnosticoPendiente[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function generarBorrador(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(WF_E1_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Key': INTERNAL_PANEL_KEY },
        body: JSON.stringify({ diagnostico_id: id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body.ok === false) throw new Error(body.error || 'Error generando el borrador')
      toast.success('Borrador generado')
      await load()
    } catch (e) {
      toast.error('No se pudo generar el borrador: ' + (e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function verPdf(id: string) {
    if (openPdf[id]) {
      setOpenPdf((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      return
    }
    const {
      data: { session },
    } = await supabase.auth.getSession()
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-diagnostico-signed-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + session?.access_token,
          },
          body: JSON.stringify({ diagnostico_id: id }),
        },
      )
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'No se pudo obtener el PDF')
      setOpenPdf((prev) => ({ ...prev, [id]: body.url }))
    } catch (e) {
      toast.error('No se pudo cargar el PDF: ' + (e as Error).message)
    }
  }

  async function aplicarPrecios(id: string, precios: PrecioManual[]) {
    setBusyId(id)
    try {
      const res = await fetch(WF_E3_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Key': INTERNAL_PANEL_KEY },
        body: JSON.stringify({ diagnostico_id: id, precios }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body.ok === false) throw new Error(body.error || 'Error aplicando los precios')
      const faltantes: string[] = body.no_encontrados ?? []
      if (faltantes.length > 0) {
        toast.warning(`PDF regenerado, pero no se encontró: ${faltantes.join(', ')}`)
      } else {
        toast.success('Precios aplicados · PDF regenerado')
      }
      // El PDF abierto quedó apuntando a la versión vieja.
      setOpenPdf((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      await load()
    } catch (e) {
      toast.error('No se pudieron aplicar los precios: ' + (e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  async function aprobarYEnviar(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(WF_E2_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Key': INTERNAL_PANEL_KEY },
        body: JSON.stringify({ diagnostico_id: id, aprobado_por: perfil?.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || body.ok === false) throw new Error(body.error || 'Error al aprobar y enviar')
      toast.success('Diagnóstico enviado al cliente')
      await load()
    } catch (e) {
      toast.error('No se pudo aprobar/enviar: ' + (e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  // Confirmaciones. Solo se pregunta cuando la acción pisa trabajo ya hecho o
  // sale del panel hacia el cliente; generar el primer borrador no pregunta.
  function pedirBorrador(d: DiagnosticoPendiente) {
    if (!d.pdf_url) {
      generarBorrador(d.diagnostico_id)
      return
    }
    confirmar({
      title: 'Regenerar el borrador',
      description: (
        <>
          Se descarta el PDF actual de <strong>{d.nombre_empresa}</strong> y la IA vuelve a redactar
          el informe desde cero. Los precios que hayas ajustado a mano se pierden.
        </>
      ),
      confirmLabel: 'Regenerar',
      destructive: true,
      onConfirm: () => generarBorrador(d.diagnostico_id),
    })
  }

  function pedirAplicarPrecios(d: DiagnosticoPendiente, precios: PrecioManual[]) {
    confirmar({
      title: 'Aplicar precios y regenerar el PDF',
      description: (
        <>
          Se reescriben los importes del informe de <strong>{d.nombre_empresa}</strong> y se
          sustituye el PDF actual. El resto del contenido no cambia.
        </>
      ),
      confirmLabel: 'Aplicar precios',
      onConfirm: () => aplicarPrecios(d.diagnostico_id, precios),
    })
  }

  function pedirAprobar(d: DiagnosticoPendiente) {
    confirmar({
      title: 'Aprobar y enviar al cliente',
      description: (
        <>
          El diagnóstico de <strong>{d.nombre_empresa}</strong> se envía por email al cliente y se
          publica en la carpeta del comercial. No se puede deshacer.
        </>
      ),
      confirmLabel: 'Aprobar y enviar',
      onConfirm: () => aprobarYEnviar(d.diagnostico_id),
    })
  }

  return (
    <div>
      <p className="mb-5 text-xs text-muted-foreground">
        Genera el borrador, revísalo, y apruébalo para enviarlo al cliente y publicarlo en la carpeta
        del comercial.
      </p>
      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="text-sm font-semibold">Cola de revisión</div>
          <div className="text-xs text-muted-foreground">
            {loading ? '—' : `${diagnosticos.length} pendiente${diagnosticos.length === 1 ? '' : 's'}`}
          </div>
        </div>
        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Cargando…</p>
        ) : diagnosticos.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay diagnósticos pendientes de revisión.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {diagnosticos.map((d) => {
              const badge = estadoBadge(d)
              const alerta = d.precio_fuera_de_rango
              const desglose = d.contenido_json?.desglose
              return (
                <div key={d.diagnostico_id} className="rounded-lg border p-4">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold">{d.nombre_empresa}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {fmtDate(d.created_at)} · Diagnóstico{' '}
                        {alerta && (
                          <span title="Precio IA fuera de rango 200-400€" className="text-amber-500">
                            ⚠︎{' '}
                          </span>
                        )}
                        {d.precio_final ? fm(d.precio_final) : '—'}
                      </div>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === d.diagnostico_id}
                      onClick={() => pedirBorrador(d)}
                    >
                      {d.pdf_url ? 'Regenerar' : 'Generar borrador'}
                    </Button>
                    <Button size="sm" variant="outline" disabled={!d.pdf_url} onClick={() => verPdf(d.diagnostico_id)}>
                      Ver PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!desglose}
                      title={desglose ? undefined : 'Genera el borrador para calcular los costos'}
                      onClick={() => toggleDesglose(d.diagnostico_id)}
                    >
                      {openDesglose[d.diagnostico_id] ? 'Ocultar costos' : 'Ver costos'}
                    </Button>
                    <Button
                      size="sm"
                      disabled={!d.pdf_url || busyId === d.diagnostico_id}
                      onClick={() => pedirAprobar(d)}
                    >
                      Aprobar y enviar
                    </Button>
                  </div>
                  {openDesglose[d.diagnostico_id] && desglose && (
                    <DesgloseCostos
                      desglose={desglose}
                      preciosManuales={d.contenido_json?.precios_manuales}
                      guardando={busyId === d.diagnostico_id}
                      onAplicar={(precios) => pedirAplicarPrecios(d, precios)}
                    />
                  )}
                  {openPdf[d.diagnostico_id] && (
                    <iframe
                      title={`PDF ${d.nombre_empresa}`}
                      src={openPdf[d.diagnostico_id]}
                      className="mt-3 h-[520px] w-full rounded-md border bg-white"
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
      {dialogo}
    </div>
  )
}
