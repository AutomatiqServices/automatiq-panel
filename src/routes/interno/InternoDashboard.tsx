import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DiagnosticosTab } from '@/routes/interno/DiagnosticosTab'
import { ComercialesTab } from '@/routes/interno/ComercialesTab'
import { CeoTab } from '@/routes/interno/CeoTab'
import { AgentesTab } from '@/routes/interno/AgentesTab'
import { FacturacionTab } from '@/routes/interno/FacturacionTab'
import { LeadsAdminTab } from '@/routes/interno/LeadsAdminTab'

export function InternoDashboard() {
  return (
    <Tabs defaultValue="ceo">
      <TabsList className="mb-7 h-11">
        <TabsTrigger value="ceo">CEO</TabsTrigger>
        <TabsTrigger value="facturacion">Facturación</TabsTrigger>
        <TabsTrigger value="comerciales">Comerciales</TabsTrigger>
        <TabsTrigger value="leads">Leads</TabsTrigger>
        <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
        <TabsTrigger value="agentes">Agentes</TabsTrigger>
      </TabsList>
      <TabsContent value="ceo">
        <CeoTab />
      </TabsContent>
      <TabsContent value="facturacion">
        <FacturacionTab />
      </TabsContent>
      <TabsContent value="comerciales">
        <ComercialesTab />
      </TabsContent>
      <TabsContent value="leads">
        <LeadsAdminTab />
      </TabsContent>
      <TabsContent value="diagnosticos">
        <DiagnosticosTab />
      </TabsContent>
      <TabsContent value="agentes">
        <AgentesTab />
      </TabsContent>
    </Tabs>
  )
}
