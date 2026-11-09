import { readFile, rename, rm, writeFile } from 'node:fs/promises';

import type { PackageStorage } from './content-service';

function isNotFound(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

/** Stores the active package in a single file, written atomically. */
export function createFileStorage(filePath: string): PackageStorage {
  return {
    async read() {
      try {
        return await readFile(filePath, 'utf8');
      } catch (error) {
        if (isNotFound(error)) return null;
        throw error;
      }
    },
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
