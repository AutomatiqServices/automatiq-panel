import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { Seller } from '@/lib/types'

export function SettingsDialog({
  open,
  onOpenChange,
  seller,
  email,
  onWhatsappSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  seller: Seller
  email: string
  onWhatsappSaved: (whatsapp: string) => void
}) {
  const [whatsapp, setWhatsapp] = useState(seller.whatsapp ?? '')
  const [pass, setPass] = useState('')
  const [pass2, setPass2] = useState('')
  const [passErr, setPassErr] = useState('')

  async function saveWhatsapp() {
    const { error } = await supabase.from('sellers').update({ whatsapp: whatsapp || null }).eq('id', seller.id)
    if (error) {
      toast.error('No se pudo guardar el WhatsApp')
      return
    }
    onWhatsappSaved(whatsapp)
    toast.success('WhatsApp actualizado')
  }

  async function changePassword() {
    if (pass.length < 8) {
      setPassErr('Mínimo 8 caracteres.')
      return
    }
    if (pass !== pass2) {
      setPassErr('Las contraseñas no coinciden.')
      return
    }
    setPassErr('')
    const { error } = await supabase.auth.updateUser({ password: pass })
    if (error) {
      setPassErr('No se pudo actualizar: ' + error.message)
      return
    }
    setPass('')
    setPass2('')
    toast.success('Contraseña actualizada')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajustes de cuenta</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-2 text-[10px] tracking-wide text-muted-foreground uppercase">Sesión</div>
            <p className="text-sm text-muted-foreground">
              Conectado como <strong className="text-foreground">{email}</strong>
            </p>
          </div>
          <div>
            <div className="mb-2 text-[10px] tracking-wide text-muted-foreground uppercase">
              WhatsApp para avisos de venta
            </div>
            <Input
              type="tel"
              placeholder="+34 600 000 000"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="mb-2"
            />
            <Button className="w-full" onClick={saveWhatsapp}>
              Guardar WhatsApp
            </Button>
          </div>
          <div>
            <div className="mb-2 text-[10px] tracking-wide text-muted-foreground uppercase">Cambiar contraseña</div>
            <Input
              type="password"
              placeholder="Nueva contraseña (mín. 8)"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="mb-2"
            />
            <Input
              type="password"
              placeholder="Repite la nueva contraseña"
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
              className="mb-2"
            />
            {passErr && <p className="mb-2 text-xs text-destructive">{passErr}</p>}
            <Button className="w-full" onClick={changePassword}>
              Actualizar contraseña
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
