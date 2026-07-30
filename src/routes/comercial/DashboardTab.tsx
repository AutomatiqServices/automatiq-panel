import { Card } from '@/components/ui/card'
import { fm } from '@/lib/format'
import { GOAL, getMonthSales, type Sale } from '@/routes/comercial/data'
import { SaleRow, EmptyList } from '@/routes/comercial/SaleRow'

const CUR = new Date()
const CUR_M = CUR.getMonth()
const CUR_Y = CUR.getFullYear()

const MESSAGES: [number, number, string][] = [
  [0, 0, 'Empieza fuerte. <strong>El primer cierre</strong> está a punto de llegar.'],
  [1, 1, '¡Primer cliente! 🎉 <strong>7 más para el objetivo.</strong>'],
  [2, 3, 'Buen ritmo. Estás construyendo <strong>momentum</strong>.'],
  [4, 5, 'A <strong>mitad de camino</strong>. ¡Sigue así!'],
  [6, 6, '<strong>¡Solo 2 más</strong> para el objetivo!'],
  [7, 7, '<strong>UN SOLO CLIENTE MÁS</strong> para cerrar el mes! 🔥'],
  [8, 11, '🏆 <strong>OBJETIVO ALCANZADO.</strong> ¿A por el bonus de 12?'],
  [12, 999, '💥 <strong>MODO BEAST.</strong> Histórico.'],
]

const MILESTONES = [
  { label: '🎯 25%', v: 2 },
  { label: '⚡ 50%', v: 4 },
  { label: '🔥 75%', v: 6 },
  { label: '🏆 Objetivo', v: 8 },
  { label: '💥 Bonus x12', v: 12 },
]

export function DashboardTab({ sales, refUrl }: { sales: Sale[]; refUrl: string }) {
  const monthSales = getMonthSales(sales, CUR_M, CUR_Y)
  const yearSales = sales.filter((s) => new Date(s.created_at).getFullYear() === CUR_Y)
  const totalM = monthSales.length
  const commM = monthSales.reduce((s, sale) => s + sale.commission, 0)
  const pending = sales.reduce((s, sale) => s + sale.pendiente, 0)
  const yearComm = yearSales.reduce((s, sale) => s + sale.commission, 0)
  const pct = Math.min(100, (totalM / GOAL) * 100)
  const remaining = Math.max(0, GOAL - totalM)
  const msg = MESSAGES.find(([min, max]) => totalM >= min && totalM <= max)?.[2] ?? MESSAGES[0][2]

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-4">
        <div className="min-w-0 flex-1 basis-[200px] text-xs text-muted-foreground">
          <strong className="mb-0.5 block text-[10px] tracking-wider text-foreground uppercase">
            Tu link de referido
          </strong>
          <span className="break-all">{refUrl}</span>
        </div>
        <button
          className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
          onClick={() => navigator.clipboard.writeText(refUrl)}
        >
          Copiar link
        </button>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Este mes</div>
          <div className="text-2xl font-extrabold">{totalM}</div>
          <div className="text-xs text-muted-foreground">clientes cerrados</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Comisión del mes</div>
          <div className="text-2xl font-extrabold">{fm(commM)}</div>
          <div className="text-xs text-muted-foreground">generada este mes</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Por cobrar</div>
          <div className="text-2xl font-extrabold">{fm(pending)}</div>
          <div className="text-xs text-muted-foreground">pendiente de pago</div>
        </Card>
        <Card className="p-4">
          <div className="text-[10px] tracking-wide text-muted-foreground uppercase">Total año</div>
          <div className="text-2xl font-extrabold">{yearSales.length}</div>
          <div className="text-xs text-muted-foreground">clientes · {fm(yearComm)}</div>
        </Card>
      </div>

      <Card className="mb-5 p-5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold">Objetivo del mes</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Meta: 8 clientes ·{' '}
              {remaining > 0 ? `${remaining} restante${remaining === 1 ? '' : 's'}` : '¡Objetivo cumplido! 🎯'}
            </div>
          </div>
          <div className="shrink-0 text-2xl font-black">
            {totalM}
            <span className="text-base font-normal text-muted-foreground">/{GOAL}</span>
          </div>
        </div>
        <div className="mb-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mb-3 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: msg }} />
        <div className="flex flex-wrap gap-2">
          {MILESTONES.map((m) => (
            <span
              key={m.label}
              className={`rounded-full border px-3 py-1 text-[10px] ${
                totalM >= m.v ? 'border-primary/40 bg-primary/10' : 'text-muted-foreground'
              }`}
            >
              {m.label}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="text-sm font-semibold">Clientes cerrados este mes</div>
          <div className="text-xs text-muted-foreground">
            {totalM} cliente{totalM === 1 ? '' : 's'} este mes
          </div>
        </div>
        <div className="flex max-h-[340px] flex-col gap-2 overflow-y-auto">
          {monthSales.length === 0 ? (
            <EmptyList>Sin clientes aún. ¡A por el primer cierre!</EmptyList>
          ) : (
            monthSales.map((s) => <SaleRow key={s.id} sale={s} />)
          )}
        </div>
      </Card>
    </div>
  )
}
