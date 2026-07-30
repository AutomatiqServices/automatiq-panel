import { useState } from 'react'
import { fm } from '@/lib/format'
import type { Desglose, PrecioManual } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Props = {
  desglose: Desglose
  /** Precios fijados a mano en una pasada anterior, si los hubo. */
  preciosManuales?: PrecioManual[]
  guardando?: boolean
  onAplicar: (precios: PrecioManual[]) => void
}

/** '' cuando no hay valor: el input queda vacío en vez de mostrar 0. */
function num(v: string): number | null {
  const n = Number(v.replace(/[^\d.-]/g, ''))
  return v.trim() === '' || !isFinite(n) ? null : n
}

/**
 * Cómo la IA llegó al precio de cada nivel de Setup, y los inputs para
 * sobrescribirlo a mano.
 * Uso interno del equipo: nada de esto se le muestra al cliente ni sale en el PDF.
 */
export function DesgloseCostos({ desglose, preciosManuales, guardando, onAplicar }: Props) {
  const niveles = desglose.niveles ?? []
  const [editado, setEditado] = useState<Record<string, { setup: string; mant: string }>>({})

  function valorDe(nivel: string, campo: 'setup' | 'mant', calculado: number): string {
    const tocado = editado[nivel]?.[campo]
    if (tocado !== undefined) return tocado
    const manual = preciosManuales?.find((p) => p.nivel === nivel)
    const previo = campo === 'setup' ? manual?.setup : manual?.mantenimiento
    return String(previo ?? calculado)
  }

  function editar(nivel: string, campo: 'setup' | 'mant', valor: string) {
    setEditado((prev) => ({
      ...prev,
      [nivel]: {
        setup: campo === 'setup' ? valor : (prev[nivel]?.setup ?? ''),
        mant: campo === 'mant' ? valor : (prev[nivel]?.mant ?? ''),
      },
    }))
  }

  function aplicar() {
    onAplicar(
      niveles.map((n) => ({
        nivel: n.nivel,
        setup: num(valorDe(n.nivel, 'setup', n.precio_setup)),
        mantenimiento: num(valorDe(n.nivel, 'mant', n.precio_mantenimiento)),
      })),
    )
  }
  if (niveles.length === 0) {
    return (
      <p className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
        Este borrador no tiene desglose de costos. Regeneralo para calcularlo.
      </p>
    )
  }

  return (
    <div className="mt-3 rounded-md border bg-muted/30 p-3">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold">Cálculo de precios</span>
        <span className="text-[11px] text-muted-foreground">Interno · no se envía al cliente</span>
      </div>

      <div className="flex flex-col gap-3">
        {niveles.map((n) => {
          const costoImplementacion = n.horas_implementacion * n.tarifa_hora
          const costoSoporteMes = n.horas_soporte_mes * n.tarifa_hora
          // El margen se mide contra el precio que se va a publicar, no contra
          // el que calculó la IA: es lo que hay que mirar al fijarlo a mano.
          const setupElegido = num(valorDe(n.nivel, 'setup', n.precio_setup)) ?? n.precio_setup
          const mantElegido =
            num(valorDe(n.nivel, 'mant', n.precio_mantenimiento)) ?? n.precio_mantenimiento
          const margenSetup = setupElegido - costoImplementacion
          const margenMes = mantElegido - costoSoporteMes - n.costos_recurrentes_mes
          const cambiado =
            setupElegido !== n.precio_setup || mantElegido !== n.precio_mantenimiento

          return (
            <div key={n.nivel} className="rounded-md border bg-background p-3">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-xs font-bold">{n.nivel}</span>
                <span className="text-xs text-muted-foreground">
                  IA: {fm(n.precio_setup)} setup · {fm(n.precio_mantenimiento)}/mes
                </span>
              </div>

              <div className="mb-2 flex flex-wrap items-end gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">Setup €</span>
                  <Input
                    type="number"
                    min={0}
                    step={10}
                    inputMode="numeric"
                    className="h-8 w-28 text-xs"
                    value={valorDe(n.nivel, 'setup', n.precio_setup)}
                    onChange={(e) => editar(n.nivel, 'setup', e.target.value)}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] text-muted-foreground">Mantenimiento €/mes</span>
                  <Input
                    type="number"
                    min={0}
                    step={5}
                    inputMode="numeric"
                    className="h-8 w-28 text-xs"
                    value={valorDe(n.nivel, 'mant', n.precio_mantenimiento)}
                    onChange={(e) => editar(n.nivel, 'mant', e.target.value)}
                  />
                </label>
                {cambiado && (
                  <span className="pb-1.5 text-[11px] text-primary">modificado</span>
                )}
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] sm:grid-cols-4">
                <Dato label="Implementación" valor={`${n.horas_implementacion} h × ${fm(n.tarifa_hora)}`} />
                <Dato label="Coste implementación" valor={fm(costoImplementacion)} />
                <Dato label="Soporte" valor={`${n.horas_soporte_mes} h/mes`} />
                <Dato label="Recurrentes" valor={`${fm(n.costos_recurrentes_mes)}/mes`} />
                <Dato label="Margen declarado" valor={n.margen_aplicado} />
                <Dato label="Margen setup" valor={fm(margenSetup)} alerta={margenSetup <= 0} />
                <Dato label="Margen mensual" valor={`${fm(margenMes)}/mes`} alerta={margenMes <= 0} />
              </dl>

              <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">
                {n.justificacion_horas}
              </p>
            </div>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-3">
        <Button size="sm" disabled={guardando} onClick={aplicar}>
          {guardando ? 'Regenerando…' : 'Aplicar precios y regenerar PDF'}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          Reescribe solo los importes del PDF. El resto del informe no cambia.
        </span>
      </div>
    </div>
  )
}

function Dato({ label, valor, alerta }: { label: string; valor: string; alerta?: boolean }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={alerta ? 'font-semibold text-amber-500' : 'font-medium'}>
        {alerta && <span title="Margen nulo o negativo">⚠︎ </span>}
        {valor}
      </dd>
    </div>
  )
}
