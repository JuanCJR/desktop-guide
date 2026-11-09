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
- La **jefatura** desbloquea la edición desde _Contenido del manual_ con su
  **llave de edición** (archivo `.psmkey` + contraseña). Cada página muestra
  entonces el botón «Editar esta página».
- Al guardar, el contenido se **firma digitalmente**. Con «Exportar» se obtiene
  un archivo `.psm` que se importa en las demás computadoras.
- Cada copia de la app solo acepta contenido firmado por la escuela: un
  archivo modificado por otra persona se rechaza y se sigue mostrando el
  contenido oficial.

### Las dos llaves

| Llave                      | Quién la guarda                     | Para qué sirve                                 |
| -------------------------- | ----------------------------------- | ---------------------------------------------- |
| **Maestra** (`.pem`)       | Dirección, en un lugar seguro       | Solo para crear llaves de edición nuevas       |
| **De edición** (`.psmkey`) | Jefatura de Escuela (con una copia) | Editar y publicar el contenido en el día a día |

**Si se pierde o roban la llave de edición**, la jefatura crea otra sin ayuda
del programador: _Contenido del manual → «¿Se perdió o robaron la llave de
edición?»_, con la llave maestra y su contraseña. La llave anterior deja de
servir en esa computadora y, en las demás, cuando importan el siguiente `.psm`
publicado con la llave nueva. El contenido ya publicado se sigue mostrando.

Solo si se pierde **la llave maestra** hace falta el programador: generar una
maestra nueva y distribuir un instalador nuevo.

### Crear la llave maestra (una sola vez, antes de distribuir)

Hazlo **en tu propia computadora**, no en un servidor ni en un entorno
compartido, para que la llave privada y su contraseña no salgan de ella:

```bash
pnpm content:master-key E:/llave-maestra-escuela-47.pem
```

1. El comando pide la contraseña dos veces, sin mostrarla en pantalla. Usa 12
   caracteres o más. Se niega a guardar la llave dentro del repositorio.
2. Guarda la llave maestra cifrada en la ruta indicada (por ejemplo, un
   pendrive) y escribe su parte pública en `src/main/content/public-key.ts`.
3. Haz commit **solo** de `public-key.ts` (la parte pública no es secreta) y
   genera el instalador.
4. En la app, ve a _Contenido del manual → «¿Se perdió o robaron la llave de
   edición?»_ y crea la primera llave de edición con la maestra. Entrégala a
   la jefatura con su propia contraseña.
5. Guarda la llave maestra en dos lugares seguros (por ejemplo, la Dirección)
   y su contraseña por separado. **Nunca subas llaves privadas al
   repositorio** (`*.pem` y `*.psmkey` están en `.gitignore`).

> La llave maestra que trae el repositorio hoy es **de prueba**. Genera la
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

| Comando                          | Descripción                                          |
| -------------------------------- | ---------------------------------------------------- |
| `pnpm dev`                       | Modo desarrollo con HMR                              |
| `pnpm build`                     | Build de producción en `out/`                        |
| `pnpm preview`                   | Ejecuta el build de producción                       |
| `pnpm typecheck`                 | Verificación de tipos                                |
| `pnpm lint`                      | ESLint                                               |
| `pnpm format`                    | Formatea con Prettier                                |
| `pnpm test`                      | Tests con Vitest                                     |
| `pnpm check`                     | typecheck + lint + format + tests (igual que CI)     |
| `pnpm package:win`               | Genera el instalador NSIS en `release/<version>/`    |
| `pnpm content:master-key <ruta>` | Genera la llave maestra de la escuela (una sola vez) |

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
