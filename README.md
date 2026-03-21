# Clínica Portal — Frontend

Portal web SaaS multitenant para gestión de clínicas médicas, veterinarias y de bienestar. Construido con **Next.js 15 App Router**.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 15 (App Router) |
| Estilos | Tailwind CSS + estilos inline |
| Componentes UI | Radix UI + shadcn/ui |
| HTTP | Axios (`src/lib/api.js`) con interceptores de token y refresh |
| Auth | JWT via cookies (`js-cookie`) + `AuthContext` global |
| Gráficas | Recharts |
| PDF | `@react-pdf/renderer` |
| Notificaciones | Sonner (toasts) |
| Iconos | Lucide React |
| Fuente | Geist |

---

## Estructura de rutas

```
src/app/
├── login/                    # Login en 2 pasos: email → lookup org → contraseña
├── register/                 # Registro de nueva clínica
├── forgot-password/
├── dashboard/
│   ├── layout.js             # Sidebar, header, guards de auth, RBAC de nav
│   ├── page.js               # Dashboard principal con KPIs
│   ├── appointments/         # Listado y detalle de citas
│   ├── waitlist/             # Lista de espera
│   ├── medical-records/      # Expedientes (admin + doctor)
│   ├── patients/             # Pacientes
│   ├── owners/               # Dueños (veterinaria / pediatría)
│   ├── doctors/              # Directorio de doctores
│   ├── reports/              # Reportes y estadísticas (admin + doctor)
│   ├── users/                # Gestión de usuarios (solo admin)
│   ├── settings/             # Configuración de organización (solo admin)
│   └── profile/              # Perfil del usuario actual
└── superadmin/
    ├── login/                # Login exclusivo superadmin
    ├── layout.js             # Guard: solo role = superadmin
    ├── page.js               # Dashboard superadmin con métricas globales
    └── organizations/        # Gestión de clínicas y licencias
```

---

## Autenticación y sesión

- **`src/lib/AuthContext.js`** — contexto global React. Ejecuta `fetchMe()` una sola vez al montar. Expone `user`, `organization`, `loading`, `login`, `logout`, `fetchMe`.
- Cookies: `token` (1 hora), `refresh_token` (30 días), `organization_slug` (30 días).
- **`src/lib/api.js`** — instancia Axios. Interceptor de request agrega `Authorization: Bearer <token>` y `X-Organization-Slug`. Interceptor de response maneja refresh silencioso de token ante 401.
- Para forzar re-inicialización del AuthContext (ej. login superadmin) usar `window.location.href` en lugar de `router.push` — `router.push` no re-monta el contexto.
- Login flujo de 2 pasos: el usuario ingresa su email → frontend llama `GET /api/v1/lookup?email=` → backend resuelve el org slug → frontend hace login con slug resuelto (el usuario nunca escribe el slug).

---

## Control de acceso por rol (RBAC)

### Menú lateral (`dashboard/layout.js` → `getNavGroups`)
| Sección | Admin | Doctor | Recepcionista |
|---------|:-----:|:------:|:-------------:|
| Dashboard | ✅ | ✅ | ✅ |
| Citas | ✅ | ✅ | ✅ |
| Lista de espera | ✅ | ✅ | ✅ |
| Expedientes | ✅ | ✅ | ❌ |
| Pacientes / Dueños / Doctores | ✅ | ✅ | ✅ |
| Reportes | ✅ | ✅ | ❌ |
| Usuarios | ✅ | ❌ | ❌ |
| Configuración | ✅ | ❌ | ❌ |

### Guards de página
Cada página protegida importa `<AccessDenied />` (`src/components/AccessDenied.js`).
El guard se coloca **después de todos los hooks** para respetar las Rules of Hooks de React.

---

## Features por plan de licencia

`useFeatures()` (`src/lib/useFeature.js`) retorna `organization.features` desde el AuthContext.

| Feature key | Trial | Basic | Professional | Enterprise |
|-------------|:-----:|:-----:|:------------:|:----------:|
| `appointments` | ✅ | ✅ | ✅ | ✅ |
| `medical_records` | ✅ | ✅ | ✅ | ✅ |
| `notifications` | ✅ | ✅ | ✅ | ✅ |
| `reports` | ❌ | ✅ | ✅ | ✅ |
| `multi_doctor` | ❌ | ❌ | ✅ | ✅ |
| `whatsapp_notifications` | ❌ | ❌ | ✅ | ✅ |
| `inventory` | ❌ | ❌ | ❌ | ✅ |
| `custom_branding` | ❌ | ❌ | ❌ | ✅ |

Items bloqueados en el sidebar muestran ícono de candado y no son navegables.

---

## Componentes globales clave

| Componente | Descripción |
|-----------|-------------|
| `GlobalSearch` | Búsqueda universal con `⌘K` |
| `NotificationBell` | Feed de notificaciones de sistema (eventos de citas) |
| `AccessDenied` | Pantalla de acceso denegado por rol |
| `TableSkeleton` | Skeleton loader para tablas |
| `EmptyState` | Estado vacío genérico |
| `ExportCSVButton` | Exportación de datos a CSV |

---

## Librerías de clinic config

- **`src/lib/clinicConfig.js`** — devuelve etiquetas y configuración según `clinic_type` (veterinary, pediatric, general, dental, psychology, etc.)

---

## Variables de entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3010
```

---

## Comandos

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm run start
```

---

## Convenciones

- Usar `<img>` en lugar de `next/image` para imágenes del backend (logos, avatares) — evita configurar dominios externos.
- Todos los hooks deben declararse antes de cualquier `return` condicional (Rules of Hooks).
- Estilos: `style={{}}` inline para control visual fino; Tailwind para layout y utilidades.
- Después de cualquier mutación que afecte `user` u `organization`, llamar `fetchMe()` para sincronizar el contexto.
