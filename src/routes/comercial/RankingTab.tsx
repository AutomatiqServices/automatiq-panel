import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { fm } from '@/lib/format'
import { EmptyList } from '@/routes/comercial/SaleRow'
import type { RankingRow } from '@/lib/types'

type Scope = 'month' | 'year'

export function RankingTab({ sellerId }: { sellerId: string }) {
  const [scope, setScope] = useState<Scope>('month')
  const [data, setData] = useState<Record<Scope, RankingRow[] | null>>({ month: null, year: null })
  const [failedScopes, setFailedScopes] = useState<Record<Scope, boolean>>({ month: false, year: false })
  const [retryTick, setRetryTick] = useState(0)
  const curYear = new Date().getFullYear()

  // Refetch whenever the scope changes (or a retry is requested). Deliberately
  // does NOT depend on `data`: an object dependency would refire the effect on
  // its own writes. Re-fetching an already-loaded scope on remount is cheap and
  // keeps this correct under StrictMode's double-invoke, which a ref-based
  // "already fetched" guard does not (the ref survives the remount, so the
  // second pass would skip the fetch while the first pass was cancelled).
  useEffect(() => {
    let cancelled = false
    supabase.rpc('get_seller_ranking', { scope }).then(({ data: rows, error }) => {
      if (cancelled) return
      if (error) {
        setFailedScopes((prev) => ({ ...prev, [scope]: true }))
        return
      }
      setFailedScopes((prev) => ({ ...prev, [scope]: false }))
      setData((prev) => ({ ...prev, [scope]: (rows as RankingRow[]) ?? [] }))
    })
    return () => {
      cancelled = true
    }
  }, [scope, retryTick])

  const failed = failedScopes[scope]

  const ranked = data[scope]
  const withSales = ranked?.filter((r) => r.sales_count > 0) ?? []
  const myIdx = ranked?.findIndex((r) => r.seller_id === sellerId) ?? -1
  const me = myIdx >= 0 ? ranked![myIdx] : null
  const myRank = myIdx >= 0 ? myIdx + 1 : (ranked?.length ?? 0)
  const scopeLbl = scope === 'month' ? 'este mes' : 'este año'

  return (
    <div>
      <div className="mb-4 flex gap-1">
        <Button
          size="sm"
          variant={scope === 'month' ? 'default' : 'outline'}
          className="rounded-full text-xs"
          onClick={() => setScope('month')}
        >
          Este mes
        </Button>
        <Button
          size="sm"
          variant={scope === 'year' ? 'default' : 'outline'}
          className="rounded-full text-xs"
          onClick={() => setScope('year')}
        >
          Año {curYear}
        </Button>
      </div>

      <Card className={`mb-5 flex flex-wrap items-center gap-5 p-6 ${myRank <= 3 && me ? 'bg-primary/5' : ''}`}>
        <div
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl border ${
            myRank <= 3 && me ? 'bg-primary text-primary-foreground' : ''
          }`}
        >
          <div className="text-2xl font-black">{me ? `${myRank}º` : '—'}</div>
          <div className="text-[8px] tracking-wide uppercase">Puesto</div>
        </div>
        <div className="min-w-[200px] flex-1">
          {failed ? (
            <>
              <div className="text-sm font-bold">No se pudo cargar el ranking.</div>
              <Button
                size="sm"
                variant="outline"
                className="mt-2 rounded-full text-xs"
                onClick={() => setRetryTick((t) => t + 1)}
              >
                Reintentar
              </Button>
            </>
          ) : !ranked ? (
            <div className="text-sm font-bold">Cargando ranking…</div>
          ) : !me || me.sales_count === 0 ? (
            <>
              <div className="text-sm font-bold">Aún no estás en el ranking {scopeLbl}</div>
              <p className="text-xs text-muted-foreground">
                Registra tu primera venta {scopeLbl} para aparecer en la clasificación del equipo.
              </p>
            </>
          ) : (
            <>
              <div className="text-sm font-bold">
                {myRank === 1
                  ? '🥇 ¡Lideras el equipo!'
                  : `${myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : ''} Vas ${myRank}º de ${withSales.length}`}
              </div>
              <p className="text-xs text-muted-foreground">
                {myRank === 1
                  ? withSales[1]
                    ? `Llevas ${me.sales_count - withSales[1].sales_count} venta(s) de ventaja sobre el 2º. Mantén el ritmo. 🔥`
                    : `Eres el único con ventas ${scopeLbl}. ¡Marca el paso!`
                  : `Te faltan ${(ranked[myIdx - 1]?.sales_count ?? 0) - me.sales_count} venta(s) para superar a ${
                      ranked[myIdx - 1]?.name ?? ''
                    } y subir al ${myRank - 1}º.`}
              </p>
            </>
          )}
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-semibold">Top 5 comerciales</div>
          <div className="text-xs text-muted-foreground">
            {ranked ? `${withSales.length} con ventas ${scopeLbl}` : '—'}
          </div>
        </div>
        {failed ? (
          <EmptyList>No se pudo cargar el ranking.</EmptyList>
        ) : !ranked ? (
          <EmptyList>Cargando ranking…</EmptyList>
        ) : withSales.length === 0 ? (
          <EmptyList>Sin ventas del equipo {scopeLbl} todavía. ¡Sé el primero! 🚀</EmptyList>
        ) : (
          <div className="flex flex-col gap-2">
            {ranked.slice(0, 5).map((r, i) => (
              <RankRow key={r.seller_id} r={r} pos={i + 1} isMe={r.seller_id === sellerId} />
            ))}
            {myIdx >= 5 && me && me.sales_count > 0 && (
              <RankRow r={me} pos={myRank} isMe />
            )}
          </div>
        )}
      </Card>
    </div>
  )
}

function RankRow({ r, pos, isMe }: { r: RankingRow; pos: number; isMe: boolean }) {
  const medal = pos === 1 ? '🥇' : pos === 2 ? '🥈' : pos === 3 ? '🥉' : `${pos}º`
  return (
    <div className={`grid grid-cols-[44px_40px_1fr_auto] items-center gap-3 rounded-lg border p-3 ${isMe ? 'border-primary/40 bg-primary/5' : ''}`}>
      <div className="text-center text-lg font-bold text-muted-foreground">{medal}</div>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-sm font-bold">
        {r.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">
          {r.name}
          {isMe && <span className="ml-1.5 text-[9px] tracking-wide">TÚ</span>}
        </div>
        <div className="text-xs text-muted-foreground">{r.commission > 0 ? `${fm(r.commission)} generados` : '—'}</div>
      </div>
      <div className="text-right">
        <div className="text-xl font-black">{r.sales_count}</div>
        <div className="text-[9px] tracking-wide text-muted-foreground uppercase">ventas</div>
      </div>
    </div>
  )
}
