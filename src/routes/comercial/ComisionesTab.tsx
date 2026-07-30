import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { fm } from '@/lib/format'
import { MONTHS, type Sale } from '@/routes/comercial/data'
import { EmptyList } from '@/routes/comercial/SaleRow'
import type { CalendarioMes } from '@/lib/types'

const CUR = new Date()
const CUR_M = CUR.getMonth()
const CUR_Y = CUR.getFullYear()

export function ComisionesTab({ sales, comercialId }: { sales: Sale[]; comercialId: string }) {
  const [meses, setMeses] = useState<CalendarioMes[] | null>(null)

  useEffect(() => {
    supabase
      .rpc('get_comisiones_calendario', { p_comercial_id: comercialId, p_meses: 6 })
      .then(({ data, error }) => {
        if (error) return
        // La RPC devuelve orden descendente; mostramos cronológico (izq→der).
        setMeses(((data as CalendarioMes[]) ?? []).slice().reverse())
      })
  }, [comercialId])

  const cobrada = sales.reduce((s, sale) => s + sale.cobrada, 0)
  const pending = sales.reduce((s, sale) => s + sale.pendiente, 0)
  const total = sales.reduce((s, sale) => s + sale.commission, 0)
  const avg = sales.length ? Math.round(total / sales.length) : 0

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Comisión cobrada</div>
          <div className="text-2xl font-extrabold text-emerald-500">{fm(cobrada)}</div>
          <div className="text-xs text-muted-foreground">pagos confirmados</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Por cobrar</div>
          <div className="text-2xl font-extrabold">{fm(pending)}</div>
          <div className="text-xs text-muted-foreground">pendiente de pago</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">
            Comisión media/cliente
          </div>
          <div className="text-2xl font-extrabold">{fm(avg)}</div>
          <div className="text-xs text-muted-foreground">por cliente cerrado</div>
        </Card>
      </div>

      <Card className="mb-5 p-4 sm:p-5">
        <div className="text-sm font-semibold">Calendario de cobros · Últimos 6 meses</div>
        <div className="mb-4 text-xs text-muted-foreground">
          Comisiones agrupadas por el mes en que se generaron
        </div>
        {!meses ? (
          <EmptyList>Cargando…</EmptyList>
        ) : (
          <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
            {meses.map((m) => {
              const d = new Date(m.mes + 'T00:00:00')
              const conf = Number(m.confirmado) || 0
              const pend = Number(m.a_cobrar) || 0
              const isCur = d.getFullYear() === CUR_Y && d.getMonth() === CUR_M
              const hasIncome = conf > 0
              const label =
                MONTHS[d.getMonth()] + (d.getFullYear() !== CUR_Y ? ` '${String(d.getFullYear()).slice(-2)}` : '')
              return (
                <div
                  key={m.mes}
                  className={`rounded-lg border p-2 text-center ${isCur ? 'border-primary/50' : ''} ${
                    hasIncome ? 'bg-muted/40' : ''
                  }`}
                >
                  <div className="mb-2 text-[9px] tracking-wide text-muted-foreground uppercase">
                    {label}
                    {isCur ? ' ★' : ''}
                  </div>
                  <div className="text-sm font-extrabold">{conf > 0 ? fm(conf) : '—'}</div>
                  {pend > 0 && <div className="mt-0.5 text-[11px] font-bold text-amber-500">+{fm(pend)}</div>}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 text-sm font-semibold">Desglose por cliente</div>
        {sales.length === 0 ? (
          <EmptyList>Sin ventas aún.</EmptyList>
        ) : (
          <div className="flex flex-col gap-2">
            {sales.map((s) => (
              // En móvil los importes bajan a una segunda línea bajo el nombre;
              // en sm+ vuelven a la fila de cuatro columnas.
              <div
                key={s.id}
                className="grid grid-cols-[36px_1fr] items-center gap-x-3 gap-y-2 rounded-lg border p-3 sm:grid-cols-[36px_1fr_auto_auto]"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                  {(s.client_name || '?').charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{s.client_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
                <div className="col-start-2 flex gap-6 sm:col-start-auto sm:block sm:text-right">
                  <div>
                    <div className="text-[10px] text-muted-foreground">Cobrado</div>
                    <div className="text-sm font-bold whitespace-nowrap text-emerald-500">{fm(s.cobrada)}</div>
                  </div>
                  <div className="sm:hidden">
                    <div className="text-[10px] text-muted-foreground">Por cobrar</div>
                    <div className="text-sm font-bold whitespace-nowrap text-amber-500">{fm(s.pendiente)}</div>
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <div className="text-[10px] text-muted-foreground">Por cobrar</div>
                  <div className="text-sm font-bold whitespace-nowrap text-amber-500">{fm(s.pendiente)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
