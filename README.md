# Desktop Guide

Aplicación de escritorio para Windows hecha con **Electron + React + TypeScript**.

> Este repositorio es el scaffold inicial. Las convenciones de desarrollo y la
> arquitectura están en [`CLAUDE.md`](./CLAUDE.md).

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

| Comando            | Descripción                                       |
| ------------------ | ------------------------------------------------- |
| `pnpm dev`         | Modo desarrollo con HMR                           |
| `pnpm build`       | Build de producción en `out/`                     |
| `pnpm preview`     | Ejecuta el build de producción                    |
| `pnpm typecheck`   | Verificación de tipos                             |
| `pnpm lint`        | ESLint                                            |
| `pnpm format`      | Formatea con Prettier                             |
| `pnpm test`        | Tests con Vitest                                  |
| `pnpm check`       | typecheck + lint + format + tests (igual que CI)  |
| `pnpm package:win` | Genera el instalador NSIS en `release/<version>/` |

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
├── shared/     # Contrato IPC y tipos compartidos
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
