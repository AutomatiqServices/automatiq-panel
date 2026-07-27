import { GOAL, getMonthSales, type Sale } from '@/routes/comercial/data'

const CUR = new Date()
const CUR_M = CUR.getMonth()
const CUR_Y = CUR.getFullYear()

interface Badge {
  icon: string
  name: string
  desc: string
  check: (sales: Sale[], monthSales: Sale[], yearSales: Sale[], streak: number) => boolean
}

const BADGES: Badge[] = [
  { icon: '🎯', name: 'Primer cierre', desc: 'Cierra tu primer cliente', check: (sales) => sales.length >= 1 },
  { icon: '⚡', name: 'Cinco en un mes', desc: '5 clientes en un solo mes', check: (_s, m) => m.length >= 5 },
  { icon: '🏆', name: 'Goal Crusher', desc: '8 clientes en el mes', check: (_s, m) => m.length >= GOAL },
  { icon: '💥', name: 'Superstar', desc: '12 clientes en un mes', check: (_s, m) => m.length >= 12 },
  { icon: '🔥', name: 'En racha', desc: 'Objetivo 2 meses seguidos', check: (_s, _m, _y, streak) => streak >= 2 },
  { icon: '🚀', name: 'Imparable', desc: 'Objetivo 4 meses seguidos', check: (_s, _m, _y, streak) => streak >= 4 },
  { icon: '💼', name: 'Veterano', desc: '20 clientes en el año', check: (_s, _m, y) => y.length >= 20 },
  { icon: '👑', name: 'Leyenda', desc: '50 clientes totales', check: (sales) => sales.length >= 50 },
]

export function LogrosTab({ sales }: { sales: Sale[] }) {
  const monthSales = getMonthSales(sales, CUR_M, CUR_Y)
  const yearSales = sales.filter((s) => new Date(s.created_at).getFullYear() === CUR_Y)

  let streak = 0
  for (let i = 0; i < 12; i++) {
    const m = (CUR_M - i + 12) % 12
    const y = CUR_Y - (CUR_M - i < 0 ? 1 : 0)
    if (getMonthSales(sales, m, y).length >= GOAL) streak++
    else break
  }

  const earned = BADGES.filter((b) => b.check(sales, monthSales, yearSales, streak))
  const locked = BADGES.filter((b) => !b.check(sales, monthSales, yearSales, streak))

  return (
    <div>
      <p className="mb-5 text-xs text-muted-foreground">
        {earned.length} de {BADGES.length} logros desbloqueados
      </p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {earned.map((b) => (
          <div key={b.name} className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
            <div className="mb-2 text-3xl grayscale">{b.icon}</div>
            <div className="mb-1 text-xs font-bold">{b.name}</div>
            <div className="text-[10px] text-muted-foreground">{b.desc}</div>
            <div className="mt-1.5 text-[9px] tracking-wide">✓ DESBLOQUEADO</div>
          </div>
        ))}
        {locked.map((b) => (
          <div key={b.name} className="rounded-lg border p-4 text-center opacity-30 grayscale">
            <div className="mb-2 text-3xl">{b.icon}</div>
            <div className="mb-1 text-xs font-bold">{b.name}</div>
            <div className="text-[10px] text-muted-foreground">{b.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
