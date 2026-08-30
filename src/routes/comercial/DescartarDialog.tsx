import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MOTIVOS_DESCARTE, MOTIVO_EXIGE_NOTA, type MotivoDescarte } from '@/lib/motivos-descarte'

type DescartarDialogProps = {
  /** Nombre de la empresa, o null cuando el diálogo está cerrado. */
  empresa: string | null
  onOpenChange: (open: boolean) => void
  onConfirm: (motivo: MotivoDescarte, nota: string) => void | Promise<void>
}

/**
 * Pide el porqué antes de descartar un lead.
 *
 * No usa ConfirmDialog porque esto no es una confirmación: el valor está en lo
 * que el comercial explica, no en el sí/no. El motivo es obligatorio — un
 * descarte sin motivo es justo el vacío que este panel viene a llenar.
 */
export function DescartarDialog({ empresa, onOpenChange, onConfirm }: DescartarDialogProps) {
  const [motivo, setMotivo] = useState<MotivoDescarte | null>(null)
  const [nota, setNota] = useState('')
  const [guardando, setGuardando] = useState(false)

  const abierto = empresa !== null

  // Cada lead empieza en blanco: heredar el motivo del anterior invitaría a
  // descartar en cadena sin mirar.
  useEffect(() => {
    if (abierto) {
      setMotivo(null)
      setNota('')
    }
  }, [abierto])

  const faltaNota = motivo === MOTIVO_EXIGE_NOTA && nota.trim() === ''
  const puedeGuardar = motivo !== null && !faltaNota && !guardando

  async function confirmar() {
    if (!motivo || faltaNota) return
    setGuardando(true)
    try {
      await onConfirm(motivo, nota.trim())
      onOpenChange(false)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Dialog
      open={abierto}
      onOpenChange={(next) => {
        if (!guardando) onOpenChange(next)
      }}
    >
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Descartar el lead</DialogTitle>
          <DialogDescription>
            <strong className="text-foreground">{empresa}</strong> desaparece de tu lista. Cuéntanos
            por qué: es lo que nos dice si la captación te está trayendo lo que sirve.
          </DialogDescription>
        </DialogHeader>

        <fieldset className="flex flex-col gap-1" disabled={guardando}>
          <legend className="mb-2 text-xs font-semibold">¿Por qué lo descartas?</legend>
          {MOTIVOS_DESCARTE.map((m) => (
            <label
              key={m.valor}
              className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                motivo === m.valor ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <input
                type="radio"
                name="motivo-descarte"
                value={m.valor}
                checked={motivo === m.valor}
                onChange={() => setMotivo(m.valor)}
                className="accent-primary"
              />
              {m.etiqueta}
            </label>
          ))}
        </fieldset>

        <div>
          <label htmlFor="nota-descarte" className="mb-1.5 block text-xs font-semibold">
            Nota {motivo === MOTIVO_EXIGE_NOTA ? '(obligatoria)' : '(opcional)'}
          </label>
          <Textarea
            id="nota-descarte"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            disabled={guardando}
            maxLength={500}
            aria-invalid={faltaNota || undefined}
            placeholder={
              motivo === MOTIVO_EXIGE_NOTA
                ? 'Explica qué pasó con este lead'
                : 'Algo que convenga saber (opcional)'
            }
          />
          {faltaNota && (
            <div className="mt-1.5 text-xs text-destructive">
              Con «Otro» hace falta que expliques el motivo.
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" disabled={guardando} onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={!puedeGuardar} onClick={confirmar}>
            {guardando ? 'Descartando…' : 'Descartar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
