import { fm } from '@/lib/format'
import type { Desglose } from '@/lib/types'

/**
 * Cómo la IA llegó al precio de cada nivel de Setup.
 * Uso interno del equipo: nada de esto se le muestra al cliente ni sale en el PDF.
 */
export function DesgloseCostos({ desglose }: { desglose: Desglose }) {
  const niveles = desglose.niveles ?? []
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
          const margenSetup = n.precio_setup - costoImplementacion
          const margenMes = n.precio_mantenimiento - costoSoporteMes - n.costos_recurrentes_mes

          return (
            <div key={n.nivel} className="rounded-md border bg-background p-3">
              <div className="mb-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="text-xs font-bold">{n.nivel}</span>
                <span className="text-xs">
                  <span className="font-semibold">{fm(n.precio_setup)}</span>
                  <span className="text-muted-foreground"> setup · </span>
                  <span className="font-semibold">{fm(n.precio_mantenimiento)}</span>
                  <span className="text-muted-foreground">/mes</span>
                </span>
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
