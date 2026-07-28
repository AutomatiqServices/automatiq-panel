import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/stores/auth'
import type { Seller } from '@/lib/types'
import { loadSales, type Sale } from '@/routes/comercial/data'
import { DashboardTab } from '@/routes/comercial/DashboardTab'
import { VentasTab } from '@/routes/comercial/VentasTab'
import { ComisionesTab } from '@/routes/comercial/ComisionesTab'
import { ClientesTab } from '@/routes/comercial/ClientesTab'
import { RankingTab } from '@/routes/comercial/RankingTab'
import { LogrosTab } from '@/routes/comercial/LogrosTab'
import { SettingsDialog } from '@/routes/comercial/SettingsDialog'

export function ComercialDashboard({
  seller,
  settingsOpen,
  onSettingsOpenChange,
}: {
  seller: Seller
  settingsOpen: boolean
  onSettingsOpenChange: (open: boolean) => void
}) {
  const email = useAuth((s) => s.email)
  const [sales, setSales] = useState<Sale[]>([])
  const [whatsapp, setWhatsapp] = useState(seller.whatsapp)

  useEffect(() => {
    loadSales(seller.id).then(setSales)
  }, [seller.id])

  const refUrl = `tally.so/r/2E768g?ref=${seller.ref_code}`

  return (
    <div>
      <Tabs defaultValue="dashboard">
        <TabsList className="mb-7 h-11 flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="ventas">Mis ventas</TabsTrigger>
          <TabsTrigger value="comisiones">Comisiones</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="logros">Logros</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard">
          <DashboardTab sales={sales} refUrl={refUrl} />
        </TabsContent>
        <TabsContent value="ventas">
          <VentasTab sales={sales} />
        </TabsContent>
        <TabsContent value="comisiones">
          <ComisionesTab sales={sales} comercialId={seller.id} />
        </TabsContent>
        <TabsContent value="clientes">
          <ClientesTab comercialId={seller.id} />
        </TabsContent>
        <TabsContent value="ranking">
          <RankingTab sellerId={seller.id} />
        </TabsContent>
        <TabsContent value="logros">
          <LogrosTab sales={sales} />
        </TabsContent>
      </Tabs>
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={onSettingsOpenChange}
        seller={{ ...seller, whatsapp }}
        email={email ?? ''}
        onWhatsappSaved={setWhatsapp}
      />
    </div>
  )
}
