import type { ApartadosLead as ApartadosLeadData } from '@/lib/types'
import { fmtDate } from '@/lib/format'

// Los apartados de calificación son los mismos en el panel del comercial y en
// la vista de interno (ver ApartadosLead en lib/types.ts), así que la forma de
// mostrarlos vive en un solo sitio: si un campo nuevo se agrega a la RPC,
// se agrega aquí una vez y aparece en los dos paneles.

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string | number | null }) {
    if (valor === null || valor === '') return null
    return (
          <div className="min-w-0">
                <div className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">{etiqueta}</div>
                <div className="truncate text-xs">{valor}</div>
          </div>
        )
}

/** Si no hay nada que mostrar, el que llama puede saltarse el bloque entero. */
export function tieneApartados(lead: ApartadosLeadData): boolean {
    return (
          Boolean(
                  lead.nombre_contacto ||
                    lead.cargo ||
                    lead.linkedin ||
                    lead.rol_compra ||
                    lead.tamano_empresa ||
                    lead.tecnologia_stack ||
                    lead.senal_compra ||
                    lead.pain_point ||
                    lead.producto_interes ||
                    lead.prioridad ||
                    lead.fuente_lead ||
                    lead.etapa ||
                    lead.estado_lead ||
                    lead.respuesta ||
                    lead.resultado_motivo ||
                    lead.notas ||
                    lead.fecha_alta ||
                    lead.ultimo_contacto ||
                    lead.proximo_followup,
                ) || Boolean(lead.intentos)
        )
}

export function ApartadosLead({ lead }: { lead: ApartadosLeadData }) {
    const fecha = (d: string | null) => (d ? fmtDate(d) : null)
      
        return (
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 rounded-md bg-muted/40 p-3 sm:grid-cols-3 lg:grid-cols-4">
                    <Campo etiqueta="Contacto" valor={lead.nombre_contacto} />
                    <Campo etiqueta="Cargo" valor={lead.cargo} />
                    <Campo etiqueta="Rol de compra" valor={lead.rol_compra} />
                    <Campo etiqueta="Tamaño de empresa" valor={lead.tamano_empresa} />
                    <Campo etiqueta="Stack tecnológico" valor={lead.tecnologia_stack} />
                    <Campo etiqueta="Señal de compra" valor={lead.senal_compra} />
                    <Campo etiqueta="Pain point" valor={lead.pain_point} />
                    <Campo etiqueta="Producto de interés" valor={lead.producto_interes} />
                    <Campo etiqueta="Prioridad" valor={lead.prioridad} />
                    <Campo etiqueta="Fuente del lead" valor={lead.fuente_lead} />
                    <Campo etiqueta="Etapa" valor={lead.etapa} />
                    <Campo etiqueta="Estado de calificación" valor={lead.estado_lead} />
                    <Campo etiqueta="Intentos de contacto" valor={lead.intentos} />
                    <Campo etiqueta="Última respuesta" valor={lead.respuesta} />
                    <Campo etiqueta="Resultado / motivo" valor={lead.resultado_motivo} />
                    <Campo etiqueta="Alta del lead" valor={fecha(lead.fecha_alta)} />
                    <Campo etiqueta="Último contacto" valor={fecha(lead.ultimo_contacto)} />
                    <Campo etiqueta="Próximo seguimiento" valor={fecha(lead.proximo_followup)} />
                {lead.linkedin && (
                        <div className="min-w-0">
                                  <div className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">LinkedIn</div>
                                  <a
                                                href={lead.linkedin.startsWith('http') ? lead.linkedin : `https://${lead.linkedin}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="truncate text-xs text-primary hover:underline"
                                              >
                                    {lead.linkedin}
                                  </a>
                        </div>
                    )}
                {lead.notas && (
                        <div className="col-span-full">
                                  <div className="text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Notas</div>
                                  <div className="text-xs whitespace-pre-wrap">{lead.notas}</div>
                        </div>
                    )}
              </div>
            )
}
