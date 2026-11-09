/**
 * Guardado de archivos de texto en el disco.
 *
 * Lo usa el servicio de contenido (`./content-service.ts`) para leer y guardar
 * el contenido publicado del manual y el registro de llaves de edición. Los
 * archivos viven en la carpeta de datos del usuario (ver `../ipc/register.ts`).
 */
import { readFile, rename, rm, writeFile } from 'node:fs/promises';

import type { TextStorage } from './content-service';

// Indica si el error significa "el archivo no existe".
function isNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

/** Un único archivo de texto, que se guarda de forma segura ("atómica"). */
export function createFileStorage(filePath: string): TextStorage {
  return {
    // Si el archivo todavía no existe, devuelve `null` en vez de fallar.
    async read() {
      try {
        return await readFile(filePath, 'utf8');
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },
    // Escribe primero en un archivo temporal y luego lo renombra: así, si el
    // computador se apaga a mitad de camino, el archivo anterior no se corrompe.
    async write(data) {
      const temporary = `${filePath}.tmp`;
      await writeFile(temporary, data, 'utf8');
      await rename(temporary, filePath);
    },
    async remove() {
      await rm(filePath, { force: true });
    },
  };
}
