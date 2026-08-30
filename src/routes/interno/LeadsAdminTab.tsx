import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useConfirm } from '@/components/ui/use-confirm'
import { EmptyList } from '@/routes/comercial/SaleRow'
import { etiquetaMotivo } from '@/lib/motivos-descarte'
import type {
  ProspectoAdmin,
  ProspectosResumen,
  ProspectosPorComercial,
  ResumenComercial,
  MotivoDescarteRecuento,
} from '@/lib/types'

const ESTADOS = [
  { valor: null, etiqueta: 'Todos' },
  { valor: 'nuevo', etiqueta: 'Sin asignar' },
  { valor: 'asignado', etiqueta: 'Asignados' },
  { valor: 'contactado', etiqueta: 'Contactados' },
  { valor: 'descartado', etiqueta: 'Descartados' },
] as const

const COLOR_ESTADO: Record<string, string> = {
  nuevo: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  asignado: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  contactado: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  descartado: 'bg-muted text-muted-foreground',
}

export function LeadsAdminTab() {
  const { confirmar, dialogo } = useConfirm()
  const [leads, setLeads] = useState<ProspectoAdmin[] | null>(null)
  const [resumen, setResumen] = useState<ProspectosResumen | null>(null)
  const [porComercial, setPorComercial] = useState<ProspectosPorComercial[]>([])
  const [motivos, setMotivos] = useState<MotivoDescarteRecuento[]>([])
  const [comerciales, setComerciales] = useState<ResumenComercial[]>([])
  const [filtro, setFiltro] = useState<string | null>(null)
  const [ocupado, setOcupado] = useState<string | null>(null)

  const cargar = useCallback(() => {
    Promise.all([
      supabase.rpc('ceo_prospectos', { p_estado: filtro, p_pais: null, p_limite: 500 }),
      supabase.rpc('ceo_prospectos_resumen'),
      supabase.rpc('ceo_prospectos_por_comercial'),
      supabase.rpc('ceo_motivos_descarte', { p_dias: 90 }),
    ]).then(([r1, r2, r3, r4]) => {
      if (r1.error) {
        toast.error('No se pudieron cargar los leads')
        setLeads([])
        return
      }
      setLeads((r1.data as ProspectoAdmin[]) ?? [])
      // Las RPC de agregados devuelven una fila; si no hay datos, viene vacío.
      setResumen(((r2.data as ProspectosResumen[]) ?? [])[0] ?? null)
      setPorComercial((r3.data as ProspectosPorComercial[]) ?? [])
      setMotivos((r4.data as MotivoDescarteRecuento[]) ?? [])
    })
  }, [filtro])

  useEffect(cargar, [cargar])

  // La lista de comerciales alimenta el selector de reasignación. Se reutiliza
  // la RPC del tab de Comerciales en vez de crear otra igual.
  useEffect(() => {
    supabase.rpc('ceo_resumen_comerciales').then(({ data }) => {
      setComerciales(((data as ResumenComercial[]) ?? []).filter((c) => !c.es_prueba))
    })
  }, [])

  async function reasignar(id: string, comercialId: string | null) {
    setOcupado(id)
    const { error } = await supabase.rpc('ceo_reasignar_prospecto', {
      p_prospecto_id: id,
      p_comercial_id: comercialId,
    })
    setOcupado(null)
    if (error) {
      toast.error('No se pudo reasignar')
      return
    }
    toast.success(comercialId ? 'Lead reasignado' : 'Lead devuelto al pool')
    cargar()
  }

  async function borrar(id: string) {
    setOcupado(id)
    const { error } = await supabase.rpc('ceo_borrar_prospecto', { p_prospecto_id: id })
    setOcupado(null)
    if (error) {
      toast.error('No se pudo borrar')
      return
    }
    toast.success('Lead borrado')
    cargar()
  }

  // Reasignar cambia de dueño un lead ajeno y borrar no tiene vuelta atrás:
  // ambas se confirman. Para quitar un lead de la vista sin perderlo, el
  // comercial ya tiene "descartar".
  function pedirReasignar(lead: ProspectoAdmin, comercialId: string | null) {
    const destino = comerciales.find((c) => c.comercial_id === comercialId)?.name
    confirmar({
      title: comercialId ? 'Reasignar el lead' : 'Devolver el lead al pool',
      description: comercialId ? (
        <>
          <strong>{lead.nombre_empresa}</strong> pasa a <strong>{destino}</strong>
          {lead.comercial_nombre ? <> y deja de estar con {lead.comercial_nombre}</> : null}.
        </>
      ) : (
        <>
          <strong>{lead.nombre_empresa}</strong> se queda sin comercial asignado y vuelve al pool de
          reparto.
        </>
      ),
      confirmLabel: comercialId ? 'Reasignar' : 'Devolver al pool',
      onConfirm: () => reasignar(lead.id, comercialId),
    })
  }

  function pedirBorrar(lead: ProspectoAdmin) {
    confirmar({
      title: 'Borrar el lead definitivamente',
      description: (
        <>
          <strong>{lead.nombre_empresa}</strong> se elimina de la base de datos. No se puede
          deshacer. Si solo quieres quitarlo de la vista, descártalo en vez de borrarlo.
        </>
      ),
      confirmLabel: 'Borrar',
      destructive: true,
      onConfirm: () => borrar(lead.id),
    })
  }

  if (!leads) return <EmptyList>Cargando…</EmptyList>

  return (
    <div>
      {resumen && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Tarjeta titulo="Total" valor={resumen.total} pie="leads captados" />
          <Tarjeta titulo="Sin asignar" valor={resumen.sin_asignar} pie="sin cobertura" acento="text-amber-500" />
          <Tarjeta titulo="Asignados" valor={resumen.asignados} pie="sin contactar aún" />
          <Tarjeta titulo="Contactados" valor={resumen.contactados} pie="ya trabajados" acento="text-emerald-500" />
          <Tarjeta titulo="Prioritarios" valor={resumen.importantes} pie="score alto" acento="text-amber-500" />
        </div>
      )}

      {porComercial.length > 0 && (
        <Card className="mb-5 p-4 sm:p-5">
          <div className="mb-4 text-sm font-semibold">Reparto por comercial</div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {porComercial.map((c) => (
              <div key={c.comercial_id} className="rounded-lg border p-3">
                <div className="truncate text-sm font-semibold">{c.comercial_nombre}</div>
                <div className="text-2xl font-extrabold">{c.total}</div>
                <div className="text-xs text-muted-foreground">
                  {c.sin_contactar} sin contactar · {c.importantes} prioritarios
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {motivos.length > 0 && <MotivosDescarte motivos={motivos} />}

      <Card className="p-4 sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Todos los leads</div>
            <div className="text-xs text-muted-foreground">
              Reasigna o borra desde aquí. Mostrando {leads.length}.
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {ESTADOS.map((e) => (
              <Button
                key={e.etiqueta}
                size="sm"
                variant={filtro === e.valor ? 'default' : 'ghost'}
                onClick={() => setFiltro(e.valor)}
                className="h-7 text-xs"
              >
                {e.etiqueta}
              </Button>
            ))}
          </div>
        </div>

        {leads.length === 0 ? (
          <EmptyList>No hay leads con ese filtro.</EmptyList>
        ) : (
          // La tabla scrolla dentro de su contenedor: con 500 leads y muchas
          // columnas, el body de la página no debe desplazarse en horizontal.
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b text-left text-[10px] tracking-wide text-muted-foreground uppercase">
                  <th className="py-2 pr-3 font-medium">Empresa</th>
                  <th className="py-2 pr-3 font-medium">Zona</th>
                  <th className="py-2 pr-3 font-medium">Score</th>
                  <th className="py-2 pr-3 font-medium">Estado</th>
                  <th className="py-2 pr-3 font-medium">Comercial</th>
                  <th className="py-2 pr-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{l.nombre_empresa}</span>
                        {l.importante && (
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400">★</Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {[l.sector, l.telefono].filter(Boolean).join(' · ')}
                      </div>
                      {l.score_motivo && (
                        // Por qué se captó: sin esto la tabla es una lista de
                        // nombres y no se puede juzgar si el reparto acierta.
                        <div className="mt-0.5 max-w-[420px] text-[11px] leading-snug text-muted-foreground">
                          {l.score_motivo.split('| Ojo:')[0].trim()}
                        </div>
                      )}
                      {l.estado === 'descartado' && (
                        // Lo que dijo el comercial al tirarlo. Va pegado al
                        // lead porque el recuento de arriba dice qué falla en
                        // general, pero no de qué empresa se trataba.
                        <div className="mt-1 max-w-[420px] rounded-md bg-muted/60 px-2 py-1 text-[11px] leading-snug">
                          <span className="font-semibold">
                            {etiquetaMotivo(l.motivo_descarte)}
                          </span>
                          {l.nota_descarte && (
                            <span className="text-muted-foreground"> · {l.nota_descarte}</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">
                      {[l.ciudad, l.pais].filter(Boolean).join(', ')}
                    </td>
                    <td className="py-2 pr-3 font-bold">{l.score}</td>
                    <td className="py-2 pr-3">
                      <Badge className={COLOR_ESTADO[l.estado] ?? ''}>{l.estado}</Badge>
                    </td>
                    <td className="py-2 pr-3">
                      <select
                        value={l.comercial_id ?? ''}
                        disabled={ocupado === l.id}
                        onChange={(e) => pedirReasignar(l, e.target.value || null)}
                        className="max-w-[150px] rounded-md border bg-background px-2 py-1 text-xs"
                      >
                        <option value="">— sin asignar —</option>
                        {comerciales.map((c) => (
                          <option key={c.comercial_id} value={c.comercial_id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={ocupado === l.id}
                        onClick={() => pedirBorrar(l)}
                        className="h-7 text-xs text-destructive"
                      >
                        Borrar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {dialogo}
    </div>
  )
}

// Por qué se están tirando los leads. La barra proporcional es lo que hace
// legible el bloque: con siete categorías, comparar cifras sueltas obliga a
// leerlas todas para saber cuál domina.
function MotivosDescarte({ motivos }: { motivos: MotivoDescarteRecuento[] }) {
  const total = motivos.reduce((suma, m) => suma + m.total, 0)
  // Las RPC ya vienen ordenadas por volumen, así que el mayor es el primero.
  const mayor = motivos[0]?.total ?? 1

  return (
    <Card className="mb-5 p-4 sm:p-5">
      <div className="text-sm font-semibold">Por qué se descartan</div>
      <div className="mb-4 text-xs text-muted-foreground">
        {total} {total === 1 ? 'descarte' : 'descartes'} en los últimos 90 días · lo que más se
        repite es lo que hay que corregir en la captación
      </div>
      <div className="flex flex-col gap-2">
        {motivos.map((m) => (
          <div key={m.motivo} className="flex items-center gap-3">
            <div className="w-48 shrink-0 truncate text-xs sm:w-56">{etiquetaMotivo(m.motivo)}</div>
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary/60"
                style={{ width: `${Math.round((m.total / mayor) * 100)}%` }}
              />
            </div>
            <div className="w-24 shrink-0 text-right text-xs">
              <span className="font-bold">{m.total}</span>
              {m.importantes > 0 && (
                <span className="text-amber-600 dark:text-amber-400">
                  {' '}
                  · {m.importantes}★
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function Tarjeta({
  titulo,
  valor,
  pie,
  acento,
}: {
  titulo: string
  valor: number
  pie: string
  acento?: string
}) {
  return (
    <Card className="p-4">
      <div className="text-[10px] tracking-wide text-muted-foreground uppercase">{titulo}</div>
      <div className={`text-2xl font-extrabold ${acento ?? ''}`}>{valor}</div>
      <div className="text-xs text-muted-foreground">{pie}</div>
    </Card>
  )
}
