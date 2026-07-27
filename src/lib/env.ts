export const N8N_BASE = import.meta.env.VITE_N8N_BASE
export const INTERNAL_PANEL_KEY = import.meta.env.VITE_INTERNAL_PANEL_KEY

if (!N8N_BASE || !INTERNAL_PANEL_KEY) {
  throw new Error('Missing VITE_N8N_BASE or VITE_INTERNAL_PANEL_KEY env vars')
}
