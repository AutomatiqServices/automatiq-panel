import { fm, fmtDate } from '@/lib/format'
import type { Sale } from '@/routes/comercial/data'

export function SaleRow({ sale }: { sale: Sale }) {
  return (
    <div className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-lg border p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-sm font-bold">
        {(sale.client_name || '?').charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">{sale.client_name}</div>
        <div className="text-xs text-muted-foreground">{fmtDate(sale.created_at)}</div>
      </div>
      <div className="text-sm font-bold whitespace-nowrap">{fm(sale.commission)}</div>
    </div>
  )
}

export function EmptyList({ children }: { children: React.ReactNode }) {
  return <div className="py-8 text-center text-sm text-muted-foreground">{children}</div>
}
