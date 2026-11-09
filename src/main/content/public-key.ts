/**
 * Mitad pública de la llave maestra de la escuela, que certifica las llaves de
 * edición. La usa `../ipc/register.ts` para que la app pueda comprobar que el
 * contenido y las llaves fueron creados por la escuela.
 *
 * Se genera con `pnpm content:master-key` (ver
 * `scripts/generate-master-key.mjs`); reemplazarla invalida todas las llaves de
 * edición y paquetes de contenido creados con la anterior. La llave maestra
 * privada nunca debe guardarse en el repositorio.
 */
export const MASTER_PUBLIC_KEY_PEM: string | null = `-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAQrKtVOUPmB/+YPd6owNCGXs3GNsw0igKSz8I0bXAx0I=
-----END PUBLIC KEY-----`;
