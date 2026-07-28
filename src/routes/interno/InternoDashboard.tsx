import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DiagnosticosTab } from '@/routes/interno/DiagnosticosTab'
import { ComercialesTab } from '@/routes/interno/ComercialesTab'
import { FacturacionTab } from '@/routes/interno/FacturacionTab'

export function InternoDashboard() {
  return (
    <Tabs defaultValue="facturacion">
      <TabsList className="mb-7 h-11 flex-wrap">
        <TabsTrigger value="facturacion">Facturación</TabsTrigger>
        <TabsTrigger value="comerciales">Comerciales</TabsTrigger>
        <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
      </TabsList>
      <TabsContent value="facturacion">
        <FacturacionTab />
      </TabsContent>
      <TabsContent value="comerciales">
        <ComercialesTab />
      </TabsContent>
      <TabsContent value="diagnosticos">
        <DiagnosticosTab />
      </TabsContent>
    </Tabs>
  )
}
