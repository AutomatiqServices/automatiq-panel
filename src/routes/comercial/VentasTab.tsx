import { Card } from '@/components/ui/card'
import { fm } from '@/lib/format'
import { GOAL, MONTHS, getMonthSales, type Sale } from '@/routes/comercial/data'
import { SaleRow, EmptyList } from '@/routes/comercial/SaleRow'

const CUR = new Date()
const CUR_M = CUR.getMonth()
const CUR_Y = CUR.getFullYear()

export function VentasTab({ sales }: { sales: Sale[] }) {
  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {MONTHS.map((m, i) => {
          const monthSales = getMonthSales(sales, i, CUR_Y)
          const pct = Math.min(100, (monthSales.length / GOAL) * 100)
          const comm = monthSales.reduce((s, sale) => s + sale.commission, 0)
          const isCur = i === CUR_M
          const barColor = pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-400' : 'bg-muted-foreground/40'
          return (
            <Card key={m} className={`rounded-xl p-3.5 ${isCur ? 'ring-foreground' : ''}`}>
              <div
                className={`mb-2 text-xs tracking-wide uppercase ${
                  isCur ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {m}
                {isCur ? ' ✦' : ''}
              </div>
              <div className="mb-1.5 h-1.5 overflow-hidden rounded bg-muted">
                <div className={`h-full rounded ${barColor}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>
                  {monthSales.length}/{GOAL}
                </span>
                <span className="text-emerald-500">{comm > 0 ? fm(comm) : ''}</span>
              </div>
            </Card>
          )
        })}
      </div>
      <Card className="p-5">
        <div className="mb-4 text-sm font-bold">Historial completo</div>
        <div className="flex max-h-[500px] flex-col gap-2 overflow-y-auto">
          {sales.length === 0 ? (
            <EmptyList>Sin clientes aún. ¡A por el primer cierre!</EmptyList>
          ) : (
            sales.map((s) => <SaleRow key={s.id} sale={s} />)
          )}
        </div>
      </Card>
    </div>
  )
}
