# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Dev server on localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

## Testing

```bash
npm run test:run          # Run all unit tests (one-shot)
npm run test              # Unit tests in watch mode
npm run test:coverage     # Unit tests + coverage report
npm run test:e2e          # E2E tests with Playwright (starts dev server automatically)
npm run test:e2e:ui       # E2E with interactive Playwright UI
```

Unit tests live in `src/lib/__tests__/`. E2E tests live in `e2e/`.

The backend Rails API runs separately on `localhost:3010`. Set `NEXT_PUBLIC_API_URL` to override.

## Architecture

### Two separate apps
- **Frontend** (this repo): Next.js 15 App Router — `localhost:3000`
- **Backend**: Rails 7.2 API — `localhost:3010` (repo at `../RAILS/clinica_api`)
- **API routes:** All under `/api/v1/` — Superadmin under `/api/superadmin/`
- **Swagger UI** available at `/api-docs` on the backend

### Auth flow
`src/lib/AuthContext.js` runs `fetchMe()` once on mount if a `token` cookie exists. Exposes `{ user, organization, loading, login, logout, fetchMe }`. After any mutation that changes the user or org (e.g., settings save, logo upload), call `fetchMe()` explicitly to sync state.

For post-login redirects or logout, always use `window.location.href` (not `router.push`) to force a full re-init of AuthContext.

**Login sequence:**
1. `GET /api/v1/lookup?email=` → get the org `slug`
2. `POST /api/v1/auth/sign_in` with `X-Organization-Slug` header → returns `token` + `refresh_token` + `user` + `organization`
3. Access token expires in **1 hour** — use `POST /api/v1/auth/refresh` with `refresh_token` to rotate
4. `DELETE /api/v1/auth/sign_out` requires `refresh_token` in body to revoke both tokens

**Login response key fields:**
```json
{
  "token": "...",
  "refresh_token": "...",
  "user": { "id", "email", "full_name", "role", "status" },
  "organization": {
    "slug", "plan", "features", "on_trial",
    "trial_expired", "trial_days_remaining", "status"
  }
}
```

**Public endpoints (no auth or slug required):**
- `GET /health`
- `GET /api/v1/lookup?email=`

### API client (`src/lib/api.js`)
Axios instance that auto-attaches `Authorization: Bearer <token>` and `X-Organization-Slug` headers on every request. Handles silent token refresh on 401 (queues concurrent requests while refreshing). Also intercepts 402 (license issues) and 429 (rate limiting).

A separate `src/lib/superadminApi.js` exists for superadmin-only requests (different cookie set).

**Error codes to handle:**
| HTTP | `code` in body | Frontend action |
|------|----------------|-----------------|
| 401 | — | Redirect to login |
| 401 | `refresh_expired` | Session expired, logout |
| 402 | `license_suspended` | Show suspended license screen |
| 402 | `trial_expired` | Read-only — block write actions in UI |
| 403 | — | Role lacks permission |

### Route structure
- `/` — public landing
- `/login`, `/register`, `/forgot-password`, `/reset-password` — unauthenticated
- `/dashboard/*` — requires auth (any non-superadmin role); layout in `src/app/dashboard/layout.js`
- `/superadmin/*` — requires `role === "superadmin"`

### RBAC in the frontend
Navigation is filtered in `getNavGroups()` inside `dashboard/layout.js`. Per-page guards use `<AccessDenied />` from `src/components/AccessDenied.js` — always render it **after** all hooks. Feature locks (plan gating) use `useFeature(featureName)` / `useFeatures()` from `src/lib/useFeature.js`, which reads `organization.features[]` from AuthContext.

| Route | Who can access |
|---|---|
| `/dashboard/users` | admin only |
| `/dashboard/settings` | admin only |
| `/dashboard/reports` | admin + doctor |
| `/dashboard/medical-records` | admin + doctor |
| `/dashboard/inventory` | admin only (Enterprise plan) |
| `/dashboard/inventory/new` | admin only (Enterprise plan) |
| `/dashboard/inventory/[id]` | admin only (Enterprise plan) |
| `/dashboard/inventory/alerts` | admin only (Enterprise plan) |

### Multitenancy
All API requests include `Authorization: Bearer <token>`, `X-Organization-Slug`, and `Content-Type: application/json` headers on every request. The backend resolves the tenant from `X-Organization-Slug`. **Never assume a single-tenant context** — the only exception is superadmin requests, which use `src/lib/superadminApi.js` and do not require `X-Organization-Slug`.

### Pagination
List endpoints return Pagy-formatted responses:
```json
{
  "data": [...],
  "meta": { "current_page", "total_pages", "total_count", "per_page" }
}
```
Query params: `?page=1&per_page=20`

### Plans & Feature Flags
Plans: `trial` → `basic` → `professional` → `enterprise`. Trial lasts 15 days (`organization.trial_ends_at`).

| Feature | Trial | Basic | Professional | Enterprise |
|---------|:-----:|:-----:|:------------:|:----------:|
| reports | ❌ | ✅ | ✅ | ✅ |
| multi_doctor | ❌ | ❌ | ✅ | ✅ |
| whatsapp_notifications | ❌ | ❌ | ✅ | ✅ |
| inventory | ❌ | ❌ | ❌ | ✅ |
| custom_branding | ❌ | ❌ | ❌ | ✅ |

### Key Backend Models
- **Organization** — Tenant. Has `plan`, `trial_ends_at`, `suspended_at`, `timezone`.
- **User** — Auth entity with roles (`admin`, `doctor`, `receptionist`, `patient`, `superadmin`).
- **Doctor** — Extends user; has `consultation_duration` (default 30 min), `schedules` (weekly hours), `schedule_blocks` (blocked times), `inventory_movements` (boolean — allows stock deduction during consultations).
- **Appointment** — Status machine: `pending → confirmed → in_progress → completed / cancelled / no_show`. API response includes `doctor.inventory_movements`.
- **MedicalRecord** — SOAP notes + vitals. Linked to appointment. Accepts `used_products` array to deduct inventory.
- **Patient** — Supports `human` and `animal` types (veterinary support).
- **Product** — Inventory item. Has `name`, `category`, `sku`, `current_stock`, `min_stock`, `unit`, `active`. `low_stock?` returns true when `current_stock <= min_stock`.
- **StockMovement** — Records each inventory change (`entry`/`exit`). Has `stock_before`, `stock_after`, `lot_number`, `expiration_date`, `notes`, `doctor_id`, `medical_record_id`.

### Clinic type polymorphism
`src/lib/clinicConfig.js` exports `getConfig(clinicType)` which returns labels and field visibility flags per clinic type (veterinary, pediatric, general, dental, etc.). Always use this config to determine whether to show fields like species/breed (veterinary) or blood type (human clinics), and to get the correct label for "patient" or "owner".

### Datetime handling
The API returns `scheduled_at` and `ends_at` **already in the org's local timezone**, formatted as `"YYYY-MM-DDTHH:MM:SS"` (no `Z` suffix). Do **not** pass these through `new Date()` for display — use `.slice(11, 16)` for time and construct the Date from parsed parts for dates to avoid timezone shifting:

```js
// Correct
const formatTime = (iso) => iso ? iso.slice(11, 16) : "—";

// Correct date formatting
const [y, m, d] = iso.split("T")[0].split("-").map(Number);
new Date(y, m - 1, d).toLocaleDateString("es-GT", { ... });
```

### Images from the backend
Use `<img>` tags, not `next/image`. The backend serves ActiveStorage URLs that are not in the Next.js allowed domains list.

### No external date library
The project uses only native `Date` and string slicing — no moment, dayjs, or date-fns.

### Styling
Tailwind CSS v4 + inline styles (no CSS modules). Radix UI primitives + shadcn components. Sonner for toasts (`toast.success`, `toast.error`).

**Sidebar** (`src/app/dashboard/layout.js`) — active nav item uses a light tinted background (`${brandColor}12`) with colored text, not a filled gradient. Group labels are replaced by thin `1px` separator lines between groups. Footer is a single compact row with avatar + name/role + logout icon. The org header uses the brand gradient (`brandGradient`) always.

**Toggle inputs** — use `overflow-hidden` on the button and `left-0.5` on the thumb span. translateX values: off=`0px`, on=`20px` (for `w-11 h-6` toggles).

### Inventory module
Gated behind `useFeature("inventory")` (Enterprise plan only). Pages in `src/app/dashboard/inventory/`.

**Product categories** — defined as a constant `CATEGORIES` in both `new/page.js` and `[id]/page.js`. `min_stock` is always an integer (`step="1"`).

**Inventory deduction during consultations** — in `src/app/dashboard/medical-records/new/page.js`:
- `doctorHasInventory` = `appointment?.doctor?.inventory_movements === true`
- When true, the medications section becomes a unified inventory search + free-text fallback:
  - `usedProducts` state: `[{ product_id, name, unit, quantity, dose, frequency, duration }]`
  - `freeTextMeds` state: `[{ id, name, dose, frequency, duration }]`
  - On submit: sends `used_products: [{ product_id, quantity }]` to the API
  - Auto-builds `medications` text from both arrays for the PDF
- When false: plain textarea for medications

**Global search (⌘K)** — `src/components/GlobalSearch.js` includes products when `hasInventory` is true. Products navigate to `/dashboard/inventory/:id`. The search backend (`GET /api/v1/search`) returns a `products` array (empty array for non-Enterprise plans).

### PDF generation
`src/components/MedicalRecordPDF.js` uses `@react-pdf/renderer` for client-side PDF export of medical records.

### CSV export
`src/lib/exportCSV.js` defines column schemas and `downloadCSV()`. Time fields use `.slice(11, 16)` directly on ISO strings.

## Key conventions

- All dashboard pages are `"use client"` — data fetching happens client-side after hydration
- `export const dynamic = "force-dynamic"` is set on the dashboard layout to prevent static prerendering
- Guards (`<AccessDenied />`) must come after all hook calls to avoid violating Rules of Hooks
- After mutations affecting user/org → call `fetchMe()` to keep AuthContext in sync
