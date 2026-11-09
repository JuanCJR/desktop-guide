# CLAUDE.md

Guía para Claude Code (y cualquier colaborador) al trabajar en este repositorio.
Léela completa antes de hacer cambios.

## Proyecto

**Manual de Inducción · IUPSM** (paquete `desktop-guide`): manual interactivo
de la Escuela de Ingeniería de Sistemas (47) del IUPSM, Extensión Maracay, para
estudiantes que inscriben el 2º semestre y docentes de nuevo ingreso.
Aplicación de escritorio para **Windows** construida con
**Electron + React + TypeScript**.

Requisitos del cliente: debe ser **sencilla y sin base de datos**, y **todo el
contenido debe poder editarse** sin tocar código, pero **solo por la escuela**.

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
pnpm content:keygen <ruta.pem>  # genera la llave de la escuela (ver abajo)
```

## Arquitectura

```
src/
├── main/                    # Proceso principal (Node + Electron)
│   ├── index.ts             # Ciclo de vida de la app, single-instance, registro de IPC
│   ├── content/             # Contenido firmado: firma/verificación, servicio, archivo
│   │   ├── content-service.ts # Qué contenido se muestra; edición solo con la llave
│   │   ├── signing.ts         # Ed25519: firmar, verificar y abrir paquetes .psm
│   │   ├── file-storage.ts    # Paquete activo en userData (escritura atómica)
│   │   └── public-key.ts      # Llave pública de la escuela (generada con content:keygen)
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
│   ├── content/
│   │   ├── schema.ts        # Esquema Zod de TODO el contenido editable del manual
│   │   ├── default-content.ts # Contenido original (el que trae el instalador)
│   │   ├── package.ts       # Formato del paquete firmado .psm
│   │   ├── pages.ts         # Ids de las pantallas
│   │   └── prerequisites.ts # Lógica del simulador de prelaciones
│   └── ipc/
│       ├── channels.ts      # Lista de canales (sin dependencias de runtime)
│       ├── contract.ts      # Schemas Zod de request/response por canal
│       ├── result.ts        # Envoltorio `IpcResult` { ok, data } | { ok, error }
│       └── api.ts           # Tipo `DesktopApi` expuesto al renderer
└── renderer/                # UI React (contexto de navegador, sin Node)
    ├── index.html           # Incluye la Content-Security-Policy
    └── src/
        ├── main.tsx / app.tsx
        ├── assets/          # Logos del IUPSM
        ├── components/ui/   # Componentes shadcn/ui (generados, editables)
        ├── components/      # Componentes propios reutilizables (Notice, AudienceTag…)
        ├── features/<feature>/  # Pantallas por funcionalidad, cada una con su editor
        │   ├── content/     # ContentProvider + useContent (estado del contenido)
        │   ├── editor/      # Kit de edición: EditablePage, EditorFrame, campos
        │   └── shell/       # Barra lateral y barra superior con buscador
        ├── hooks/           # Hooks reutilizables (usePersistedSet)
        ├── lib/             # Utilidades (cn, invoke tipado, navegación, búsqueda)
        └── styles/globals.css   # Tailwind v4 + tokens de tema
```

Alias de imports:

- `@/…` → `src/renderer/src/…` (solo en el renderer)
- `@shared/…` → `src/shared/…` (en todos los procesos)

La navegación es un `useState<PageId>` en `app.tsx` (sin router). Agrega un
router solo si hace falta enlazar o recordar rutas.

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

## Contenido del manual (editable y firmado)

- **Todo texto que la escuela pueda querer cambiar va en el contenido**, no en
  el código: `src/shared/content/schema.ts` (esquema) y
  `default-content.ts` (valores originales). La navegación y las etiquetas
  de la interfaz sí viven en el código (`lib/navigation.ts`).
- Las pantallas leen el contenido con `useContent().content`. Cada pantalla
  editable se envuelve en `EditablePage` y tiene su `<feature>-editor.tsx`,
  que edita su sección con `useSectionDraft('<sección>')`.
- Para agregar una sección: agrégala al esquema y a `default-content.ts`,
  crea la página y su editor, y añade tests del esquema.
- Cambiar el esquema de forma incompatible invalida los paquetes ya
  publicados (la app vuelve al contenido original). Si hace falta, sube
  `schemaVersion` y escribe una migración.
- **Seguridad del contenido**: la app solo muestra contenido original o
  paquetes `.psm` con firma Ed25519 válida, verificada en main con la llave
  pública de `src/main/content/public-key.ts`. La edición se desbloquea en
  memoria (no se guarda) cargando la llave privada cifrada con su
  contraseña. **La llave privada nunca va al repositorio** (`*.pem` está
  ignorado). La llave pública actual es **de prueba**: genera la definitiva
  con `pnpm content:keygen` antes de distribuir.
- Las preferencias locales (casillas marcadas) se guardan en `localStorage`
  con `usePersistedSet`; nunca guardes contenido ahí.

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

- **Idioma**: identificadores, comentarios de código y commits en **inglés**.
  Los textos de la UI y del contenido van en **español**, porque la app es
  para la comunidad del IUPSM. La documentación (`README.md`, `CLAUDE.md`,
  PRs) también va en **español**.
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
- No hagas push directo a `main` ni a `develop`. La única excepción es la
  sincronización de `develop` descrita abajo.

### Sincronizar `develop` después de cada merge a `main`

Como los PR van a `main`, `develop` se queda atrás después de cada merge. Si no
se sincroniza, las ramas nuevas salen sin los últimos cambios. Después de
**cada** merge a `main`:

```bash
git fetch origin main develop
git checkout develop
git merge --ff-only origin/main
git push origin develop
```

- Usa siempre `--ff-only`: la sincronización no puede crear commits ni
  reescribir historial.
- Si el fast-forward falla, `develop` tiene commits que no están en `main`.
  No fuerces el push: avisa al usuario y resuélvelo con un PR de `develop` a
  `main`.
- Crea las ramas nuevas desde `develop` solo después de sincronizarla.

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
