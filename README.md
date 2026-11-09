# Manual de Inducción · IUPSM

Manual interactivo de la **Escuela de Ingeniería de Sistemas (47)** del
Instituto Universitario Politécnico "Santiago Mariño", Extensión Maracay, para
estudiantes que inscriben el 2º semestre y docentes de nuevo ingreso.
Aplicación de escritorio para Windows hecha con **Electron + React + TypeScript**.

> Las convenciones de desarrollo y la arquitectura están en
> [`CLAUDE.md`](./CLAUDE.md).

## Contenido editable y protegido

Todo el texto del manual (pasos, materias, avisos…) está en un único documento
de contenido, sin base de datos:

- El instalador trae el contenido original.
- La **jefatura** desbloquea la edición desde _Contenido del manual_ con la
  **llave de la escuela** (archivo `.pem` + contraseña). Cada página muestra
  entonces el botón «Editar esta página».
- Al guardar, el contenido se **firma digitalmente**. Con «Exportar» se obtiene
  un archivo `.psm` que se importa en las demás computadoras.
- Cada copia de la app solo acepta contenido firmado con la llave de la
  escuela: un archivo modificado por otra persona se rechaza y se sigue
  mostrando el contenido oficial.

### Crear la llave de la escuela

```bash
pnpm content:keygen ruta/fuera/del/repo/llave-escuela-47.pem
```

El comando pide una contraseña, guarda la llave privada cifrada en la ruta
indicada y escribe la llave pública en `src/main/content/public-key.ts`. Haz
commit de ese archivo y genera un instalador nuevo. **Nunca subas la llave
privada al repositorio** (`*.pem` está en `.gitignore`). Si se pierde, hay que
generar otra y distribuir un instalador nuevo.

> La llave pública que trae el repositorio hoy es **de prueba**. Genera la
> definitiva antes de distribuir la app.

## Requisitos

- Node.js 24 (ver `.nvmrc`)
- pnpm 10 (`corepack enable` instala la versión fijada en `package.json`)

## Primeros pasos

```bash
corepack enable
pnpm install
pnpm dev
```

La primera ejecución de `pnpm dev` descarga el binario de Electron.

## Scripts

| Comando                      | Descripción                                            |
| ---------------------------- | ------------------------------------------------------ |
| `pnpm dev`                   | Modo desarrollo con HMR                                |
| `pnpm build`                 | Build de producción en `out/`                          |
| `pnpm preview`               | Ejecuta el build de producción                         |
| `pnpm typecheck`             | Verificación de tipos                                  |
| `pnpm lint`                  | ESLint                                                 |
| `pnpm format`                | Formatea con Prettier                                  |
| `pnpm test`                  | Tests con Vitest                                       |
| `pnpm check`                 | typecheck + lint + format + tests (igual que CI)       |
| `pnpm package:win`           | Genera el instalador NSIS en `release/<version>/`      |
| `pnpm content:keygen <ruta>` | Genera la llave de la escuela para firmar el contenido |

## Stack

- **Electron**: proceso principal y preload aislado (`sandbox`, `contextIsolation`)
- **electron-vite**: build y servidor de desarrollo
- **React 19**, **Tailwind CSS v4** y **shadcn/ui** en la interfaz
- **Zod** para validar el contrato IPC entre procesos
- **Vitest**, **ESLint** y **Prettier** para la calidad del código
- **electron-builder** para el instalador de Windows
- **GitHub Actions** como CI (Windows)

## Estructura

```
src/
├── main/       # Proceso principal de Electron
├── preload/    # Puente seguro (contextBridge) hacia el renderer
├── shared/     # Contrato IPC, esquema y contenido original del manual
└── renderer/   # Interfaz React
```

## Flujo de trabajo

El proyecto sigue **GitFlow**: las ramas `feature/*`, `fix/*`, `release/*` y
`hotfix/*` salen de `develop` (o de `main` en el caso de los hotfix), y todos
los Pull Requests van contra `main`. Después de cada merge, `develop` se
sincroniza con `main` mediante un fast-forward (ver `CLAUDE.md`). Los commits siguen
[Conventional Commits](https://www.conventionalcommits.org/).

## Licencia

Privado. Todos los derechos reservados.
