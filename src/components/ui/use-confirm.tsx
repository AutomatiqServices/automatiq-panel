import { useCallback, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

type ConfirmRequest = {
  title: string
  description: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void | Promise<void>
}

/**
 * Guarda una sola petición de confirmación por pantalla y devuelve el diálogo
 * ya montado, para no duplicar estado por cada acción confirmable.
 */
export function useConfirm() {
  const [peticion, setPeticion] = useState<ConfirmRequest | null>(null)

  const confirmar = useCallback((req: ConfirmRequest) => setPeticion(req), [])

  const dialogo = (
    <ConfirmDialog
      open={peticion !== null}
      onOpenChange={(abierto) => {
        if (!abierto) setPeticion(null)
      }}
      title={peticion?.title ?? ''}
      description={peticion?.description ?? ''}
      confirmLabel={peticion?.confirmLabel}
      cancelLabel={peticion?.cancelLabel}
      destructive={peticion?.destructive}
      onConfirm={() => peticion?.onConfirm()}
    />
  )

  return { confirmar, dialogo }
}
