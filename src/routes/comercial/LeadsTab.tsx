import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { EmptyList } from '@/routes/comercial/SaleRow'
import type { Prospecto } from '@/lib/types'

// Los leads llegan solos: WF-G los capta y el reparto por territorio decide de
// quién es cada uno. Aquí el comercial solo los trabaja.
export function LeadsTab({ comercialId }: { comercialId: string }) {
  const [leads, setLeads] = useState<Prospecto[] | null>(null)
  const [marcando, setMarcando] = useState<string | null>(null)

  const cargar = useCallback(() => {
    supabase
      .rpc('get_mis_prospectos', { p_comercial_id: comercialId })
      .then(({ data, error }) => {
        if (error) {
          toast.error('No se pudieron cargar los leads')
          setLeads([])
          return
        }
        setLeads((data as Prospecto[]) ?? [])
      })
  }, [comercialId])

  useEffect(cargar, [cargar])

  async function marcar(id: string, estado: 'contactado' | 'descartado') {
    setMarcando(id)
    const { error } = await supabase.rpc('marcar_prospecto', {
      p_prospecto_id: id,
      p_estado: estado,
    })
    setMarcando(null)

    if (error) {
      toast.error('No se pudo actualizar el lead')
      return
    }

    toast.success(estado === 'contactado' ? 'Marcado como contactado' : 'Lead descartado')

    // Los descartados desaparecen de la lista; recargamos en vez de tocar el
    // estado local para que el orden lo siga decidiendo la RPC.
    cargar()
  }

  if (!leads) return <EmptyList>Cargando…</EmptyList>

  const nuevos = leads.filter((l) => l.estado === 'asignado')
  const contactados = leads.filter((l) => l.estado === 'contactado')

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Sin contactar</div>
          <div className="text-2xl font-extrabold">{nuevos.length}</div>
          <div className="text-xs text-muted-foreground">esperando tu llamada</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Prioritarios</div>
          <div className="text-2xl font-extrabold text-amber-500">
            {nuevos.filter((l) => l.importante).length}
          </div>
          <div className="text-xs text-muted-foreground">empieza por estos</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Contactados</div>
          <div className="text-2xl font-extrabold text-emerald-500">{contactados.length}</div>
          <div className="text-xs text-muted-foreground">ya en seguimiento</div>
        </Card>
      </div>

      <Card className="mb-5 p-4 sm:p-5">
        <div className="text-sm font-semibold">Leads asignados</div>
        <div className="mb-4 text-xs text-muted-foreground">
          Empresas de tu territorio captadas automáticamente. Los prioritarios salen primero.
        </div>

        {nuevos.length === 0 ? (
          <EmptyList>Sin leads nuevos por ahora.</EmptyList>
        ) : (
          <div className="flex flex-col gap-2">
            {nuevos.map((l) => (
              <LeadRow
                key={l.id}
                lead={l}
                ocupado={marcando === l.id}
                onMarcar={marcar}
              />
            ))}
          </div>
        )}
      </Card>

      {contactados.length > 0 && (
        <Card className="p-4 sm:p-5">
          <div className="text-sm font-semibold">Ya contactados</div>
          <div className="mb-4 text-xs text-muted-foreground">
            {contactados.length} {contactados.length === 1 ? 'lead trabajado' : 'leads trabajados'} · siguen
            aquí por si necesitas volver a ellos
          </div>
          <div className="flex flex-col gap-2">
            {contactados.map((l) => (
              <LeadRow key={l.id} lead={l} ocupado={marcando === l.id} onMarcar={marcar} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function LeadRow({
  lead,
  ocupado,
  onMarcar,
}: {
  lead: Prospecto
  ocupado: boolean
  onMarcar: (id: string, estado: 'contactado' | 'descartado') => void
}) {
  const sitio = [lead.ciudad, lead.pais].filter(Boolean).join(', ')
  const contactado = lead.estado === 'contactado'

  return (
    // El contactado se atenúa y cambia de borde: de un vistazo se ve cuáles ya
    // has trabajado sin tener que leer cada fila.
    <div
      className={`rounded-lg border p-3 ${
        contactado ? 'border-emerald-500/30 bg-emerald-500/[0.03]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-sm font-semibold">{lead.nombre_empresa}</span>
            {lead.importante && !contactado && (
              <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400">Prioritario</Badge>
            )}
            {contactado && (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                ✓ Contactado
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {[lead.sector, sitio].filter(Boolean).join(' · ')}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] text-muted-foreground">Score</div>
          <div className="text-sm font-bold">{lead.score}</div>
        </div>
      </div>

      {contactado && lead.contactado_at && (
        <div className="mt-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          Contactado el{' '}
          {new Date(lead.contactado_at).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
          })}
        </div>
      )}

      {/* Vías de contacto: en móvil se apilan, con área de toque suficiente. */}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {lead.telefono && (
          <a href={`tel:${lead.telefono}`} className="font-medium text-primary hover:underline">
            {lead.telefono}
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="truncate font-medium text-primary hover:underline">
            {lead.email}
          </a>
        )}
        {lead.web && (
          <a
            href={lead.web.startsWith('http') ? lead.web : `https://${lead.web}`}
            target="_blank"
            rel="noopener noreferrer"
            className="truncate text-muted-foreground hover:underline"
          >
            web
          </a>
        )}
      </div>

      {lead.score_motivo && (
        <div className="mt-1.5 text-[11px] text-muted-foreground">{lead.score_motivo}</div>
      )}

      <div className="mt-3 flex gap-2">
        {!contactado && (
          <Button size="sm" variant="outline" disabled={ocupado} onClick={() => onMarcar(lead.id, 'contactado')}>
            {ocupado ? 'Guardando…' : 'Marcar contactado'}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          disabled={ocupado}
          onClick={() => onMarcar(lead.id, 'descartado')}
          className="text-muted-foreground"
        >
          Descartar
        </Button>
      </div>
    </div>
  )
}
