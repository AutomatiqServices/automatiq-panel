# AutomatiQ · Panel

Single React app serving both dashboards on one login:

- **Comercial** — dashboard, ventas, comisiones, clientes, ranking, logros (shown to any authenticated `seller`).
- **Interno** — cola de revisión de diagnósticos (shown to `perfiles.rol = 'ceo'`; a CEO who is also a seller gets a switcher in the nav).

Role resolution happens once after login by calling both `get_my_seller()` and `get_mi_perfil()` RPCs (see `src/stores/auth.ts`).

## Stack

Vite + React + TypeScript, Tailwind CSS v4, shadcn/ui, Zustand, deployed to Netlify.

## Development

```bash
pnpm install
cp .env.example .env   # fill in real values
pnpm dev
```

## Required env vars

| Var | Purpose |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key — safe to expose client-side |
| `VITE_N8N_BASE` | Base URL of the n8n instance (webhook host) |
| `VITE_INTERNAL_PANEL_KEY` | Shared header value (`X-Internal-Key`) so WF-E1/WF-E2 webhooks only respond to this panel. Not a strong secret — it ships in the built client bundle like the rest of this static site — it only guards against accidental/bot triggers, not a determined attacker. |

## Build

```bash
pnpm build   # tsc -b && vite build, output in dist/
```

Netlify config lives in `netlify.toml` at this directory's root (base directory = `panel/`).
