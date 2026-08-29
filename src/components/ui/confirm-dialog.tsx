import { useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

type ConfirmDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** Acciones irreversibles pintan el botón en rojo. */
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}

// Sustituye a window.confirm: el nativo no se puede estilar, se bloquea en
// algunos navegadores y no distingue una acción destructiva de una rutinaria.
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [ejecutando, setEjecutando] = useState(false)

  async function confirmar() {
    setEjecutando(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } finally {
      setEjecutando(false)
    }
  }

  return (
    <Dialog
      open={open}
      // Mientras la acción está en vuelo no se puede cerrar por fuera: cerrar
      // no la cancelaría y el usuario creería que no ha pasado nada.
      onOpenChange={(next) => {
        if (!ejecutando) onOpenChange(next)
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose
            render={<Button variant="outline" disabled={ejecutando} />}
          >
            {cancelLabel}
          </DialogClose>
          <Button
            variant={destructive ? 'destructive' : 'default'}
            disabled={ejecutando}
            onClick={confirmar}
          >
            {ejecutando ? 'Procesando…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
