# CLAUDE.md

Guía para Claude Code (y cualquier colaborador) al trabajar en este repositorio.
Léela completa antes de hacer cambios.

## Proyecto

**Desktop Guide**: aplicación de escritorio para **Windows** construida con
**Electron + React + TypeScript**. Este repositorio es el scaffold base: todavía
no tiene lógica de dominio, solo una pantalla de bienvenida y un ejemplo de IPC
de punta a punta.

## Stack

| Área           | Herramienta                                                     |
| -------------- | --------------------------------------------------------------- |
| Runtime        | Electron (main + preload sandboxed + renderer)                  |
| Lenguaje       | TypeScript estricto (sin `any`, sin JS en `src/`)               |
| Build / dev    | electron-vite (Vite) con HMR                                    |
| UI             | React 19, Tailwind CSS v4, shadcn/ui (Radix), lucide-react      |
| Validación IPC | Zod                                                             |
| Tests          | Vitest                                                          |
| Calidad        | ESLint (typescript-eslint `strict-type-checked`) + Prettier     |
| Empaquetado    | electron-builder → instalador NSIS para Windows x64             |
| Paquetes       | pnpm (versión fijada en `packageManager`), Node 24 (`.nvmrc`)   |
| CI             | GitHub Actions en `windows-latest` (`.github/workflows/ci.yml`) |

## Comandos

```bash
pnpm install          # instalar dependencias
pnpm dev              # app en modo desarrollo con HMR
pnpm build            # build de producción en out/
pnpm preview          # ejecuta el build de producción
pnpm typecheck        # tsc para main/preload (node) y renderer (web)
pnpm lint             # ESLint, 0 warnings permitidos
pnpm lint:fix         # ESLint con autofix
pnpm format           # Prettier --write
pnpm format:check     # Prettier --check
pnpm test             # Vitest (una pasada)
pnpm test:watch       # Vitest en modo watch
pnpm check            # typecheck + lint + format:check + test (lo mismo que CI)
pnpm package:win      # build + instalador NSIS en release/<version>/
```

## Arquitectura

```
src/
├── main/                    # Proceso principal (Node + Electron)
│   ├── index.ts             # Ciclo de vida de la app, single-instance, registro de IPC
│   ├── window.ts            # Creación de BrowserWindow (webPreferences seguras)
│   ├── security.ts          # Endurecimiento de WebContents, URLs confiables
│   └── ipc/
│       ├── create-handler.ts  # Wrapper: valida sender, request y response; serializa errores
│       ├── register.ts        # Mapa canal → handler (obligatorio para todos los canales)
│       └── handlers/          # Handlers agrupados por dominio (app.ts, …)
├── preload/
│   ├── index.ts             # contextBridge: expone `window.api` (solo `invoke` con allow-list)
│   └── index.d.ts           # Tipado global de `window.api`
├── shared/                  # Código importable desde main, preload y renderer
│   └── ipc/
│       ├── channels.ts      # Lista de canales (sin dependencias de runtime)
│       ├── contract.ts      # Schemas Zod de request/response por canal
│       ├── result.ts        # Envoltorio `IpcResult` { ok, data } | { ok, error }
│       └── api.ts           # Tipo `DesktopApi` expuesto al renderer
└── renderer/                # UI React (contexto de navegador, sin Node)
    ├── index.html           # Incluye la Content-Security-Policy
    └── src/
        ├── main.tsx / app.tsx
        ├── components/ui/   # Componentes shadcn/ui (generados, editables)
        ├── features/<feature>/  # Pantallas y componentes por funcionalidad
        ├── lib/             # Utilidades (cn, invoke tipado)
        └── styles/globals.css   # Tailwind v4 + tokens de tema
```

Alias de imports:

- `@/…` → `src/renderer/src/…` (solo en el renderer)
- `@shared/…` → `src/shared/…` (en todos los procesos)

Hay dos proyectos TypeScript: `tsconfig.node.json` (main, preload, shared y
configs) y `tsconfig.web.json` (renderer y shared). `shared/` debe compilar en
ambos, así que **no puede usar APIs de Node ni del DOM**.

## Flujo IPC (cómo agregar un canal)

Toda la comunicación renderer ↔ main pasa por `invoke` sobre canales declarados
en el contrato. Para agregar uno, por ejemplo `settings:get`:

1. **`src/shared/ipc/channels.ts`**: añade `'settings:get'` a `IPC_CHANNELS`.
2. **`src/shared/ipc/contract.ts`**: define sus schemas `request` y `response`
   con Zod. Usa `z.undefined()` si no recibe payload. El `satisfies` hace que el
   compilador falle si falta alguno.
3. **`src/main/ipc/handlers/<dominio>.ts`**: implementa el handler tipado como
   `IpcHandler<'settings:get'>`. Recibe el request **ya validado**.
4. **`src/main/ipc/register.ts`**: agrégalo al mapa `handlers`. El tipo
   también obliga a hacerlo.
5. **Renderer**: llámalo con `invoke('settings:get')` desde `@/lib/ipc`. Esa
   función devuelve los datos o lanza `IpcError` con un `code`.
6. **Tests**: casos válidos e inválidos del schema y del handler.

Reglas:

- Nunca uses `ipcMain.handle` directamente. Pasa siempre por `createIpcHandler`.
- Los handlers no hacen `throw` para comunicar errores esperados: valida con
  Zod. Los errores inesperados se registran en main y llegan al renderer como
  `INTERNAL_ERROR` sin detalles internos.
- Eventos main → renderer (push): si hacen falta, agrégalos con el mismo
  patrón (contrato tipado + allow-list en el preload). Nunca expongas
  `ipcRenderer.on` genérico.

## Reglas de seguridad de Electron (no negociables)

- `contextIsolation: true`, `sandbox: true`, `nodeIntegration: false` y
  `webSecurity: true` en todas las ventanas.
- El preload expone **solo** funciones concretas mediante `contextBridge`.
  Nunca expongas `ipcRenderer`, `require`, `process` ni objetos de Electron.
- El renderer no importa `electron` ni módulos `node:*`. ESLint lo bloquea.
- El main valida **el origen** (`isTrustedUrl`) y **el payload** (Zod) de cada
  mensaje IPC.
- `window.open` está bloqueado. Los enlaces externos se abren en el navegador
  del sistema, solo con `https:` o `mailto:`. La navegación fuera de la app
  está bloqueada.
- Mantén la CSP de `src/renderer/index.html`. No agregues `unsafe-eval` ni
  orígenes remotos sin justificarlo en el PR.
- No cargues contenido remoto en la ventana principal.
- Los secretos nunca van en el renderer ni en el repositorio.

## Convenciones de código

- **Idioma**: identificadores, comentarios de código, commits y textos de la UI
  en **inglés**. La documentación (`README.md`, `CLAUDE.md`, PRs) en
  **español**.
- Archivos en `kebab-case` (`welcome-page.tsx`). Componentes en `PascalCase`.
  Hooks con prefijo `useX`.
- Exports nombrados (no `export default`), salvo en archivos de configuración.
- Imports de tipos con `import type`/`type` (ESLint lo corrige con `lint:fix`).
- Componentes de función. El estado local va con hooks. Agrega librerías de
  estado o router solo cuando una funcionalidad lo necesite y documéntalo aquí.
- Estilos solo con clases de Tailwind y `cn()`. Los colores salen de los tokens
  de `globals.css`, no de valores hex sueltos.
- Componentes shadcn/ui: agrégalos con `pnpm dlx shadcn@latest add <componente>`.
  Quedan en `components/ui/` y se pueden editar.
- Tests junto al código (`foo.ts` → `foo.test.ts`). Prioriza la lógica pura:
  extrae la lógica de los módulos que dependen de Electron, como se hizo con
  `create-handler.ts`, para poder testearla.
- Dependencias: todo va en `devDependencies` porque Vite empaqueta el código.
  Usa `dependencies` solo para módulos que deban existir en runtime sin
  empaquetarse (por ejemplo, nativos), y explica el motivo en el PR.

## Git: GitFlow

Ramas:

| Rama        | Origen    | Propósito                                |
| ----------- | --------- | ---------------------------------------- |
| `main`      | —         | Código estable y publicable              |
| `develop`   | `main`    | Integración continua de trabajo          |
| `feature/*` | `develop` | Nueva funcionalidad (`feature/login`)    |
| `fix/*`     | `develop` | Corrección no urgente                    |
| `release/*` | `develop` | Preparación de versión (`release/1.2.0`) |
| `hotfix/*`  | `main`    | Corrección urgente en producción         |

- **Todos los Pull Requests van contra `main`.**
- Nombres de rama descriptivos en `kebab-case`: `feature/settings-screen`,
  `fix/ipc-timeout`.
- Commits con **Conventional Commits** en inglés: `feat:`, `fix:`, `refactor:`,
  `test:`, `docs:`, `chore:`, `ci:`, `build:`. Opcionalmente con scope:
  `feat(ipc): add settings channel`.
- No hagas push directo a `main` ni a `develop`.

## Definición de "terminado"

Antes de dar una tarea por terminada:

1. `pnpm check` pasa sin errores ni warnings.
2. `pnpm build` compila.
3. La funcionalidad nueva tiene tests. Para la lógica de main/shared son
   obligatorios.
4. Si hubo cambios de UI, se revisaron con `pnpm dev`.
5. Si cambió la arquitectura, los comandos o las convenciones, se actualizaron
   `CLAUDE.md` y `README.md`.

## Notas

- Electron descarga su binario la primera vez que se ejecuta (`pnpm dev`), no
  en `pnpm install`.
- TypeScript está fijado en `~6.0` porque `typescript-eslint` todavía no
  soporta TypeScript 7. Revisa la compatibilidad antes de actualizarlo.
- Ícono: coloca `build/icon.ico` (256×256) para personalizar el ejecutable y
  el instalador. Mientras no exista, se usa el ícono de Electron.
- Firma de código: el instalador no está firmado. Ver comentarios en
  `electron-builder.yml`.
