/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_N8N_BASE: string
  readonly VITE_INTERNAL_PANEL_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
