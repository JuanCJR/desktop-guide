/**
 * Formulario para crear una llave de edición nueva (dentro de "Contenido del
 * manual", en `./content-admin-page.tsx`).
 *
 * Sirve cuando la llave de edición se pierde o la roban: con la llave maestra
 * de la escuela se crea una nueva, y las anteriores dejan de funcionar. La
 * creación real ocurre en el proceso principal
 * (`src/main/content/content-service.ts`).
 */
import { KeySquare } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type ActionResult, useContent } from '@/features/content/content-context';

const MIN_LENGTH = 8;

/**
 * Permite que la escuela reemplace por su cuenta una llave de edición perdida
 * o robada, usando la llave maestra. Va dentro de un bloque plegable
 * (<details>) para no distraer al resto de los usuarios.
 */
export function NewEditorKeyForm({
  busy,
  run,
}: {
  busy: boolean;
  run: (action: () => Promise<ActionResult | null>) => Promise<void>;
}) {
  const { createEditorKey } = useContent();
  const [masterPassphrase, setMasterPassphrase] = useState('');
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmation, setConfirmation] = useState('');

  // Revisiones antes de enviar: contraseña nueva con el largo mínimo y confirmación igual.
  const tooShort = newPassphrase.length > 0 && newPassphrase.length < MIN_LENGTH;
  const mismatch = confirmation.length > 0 && confirmation !== newPassphrase;
  const ready =
    masterPassphrase.length > 0 &&
    newPassphrase.length >= MIN_LENGTH &&
    confirmation === newPassphrase;

  return (
    <details className="group rounded-lg border bg-muted/40 p-4">
      <summary className="cursor-pointer font-medium text-brand marker:text-brand-accent">
        ¿Se perdió o robaron la llave de edición?
      </summary>
      {/* Al enviar, se pide la llave maestra y dónde guardar la nueva; si sale bien, se limpian los campos. */}
      <form
        className="mt-4 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          void run(async () => {
            const outcome = await createEditorKey(masterPassphrase, newPassphrase);
            if (outcome?.ok) {
              setMasterPassphrase('');
              setNewPassphrase('');
              setConfirmation('');
            }
            return outcome;
          });
        }}
      >
        <p>
          Con la <strong>llave maestra</strong> puedes crear una llave de edición nueva. La anterior
          deja de servir en esta computadora y, en las demás, cuando importen el próximo contenido
          que publiques con la llave nueva.
        </p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Escribe la contraseña de la llave maestra y una contraseña nueva.</li>
          <li>Selecciona el archivo de la llave maestra (.pem).</li>
          <li>Elige dónde guardar la llave de edición nueva (.psmkey) y haz una copia.</li>
          <li>
            Desbloquea con la llave nueva, publica un cambio y expórtalo a las demás computadoras.
          </li>
        </ol>
        <div className="space-y-1.5">
          <Label htmlFor="master-passphrase">Contraseña de la llave maestra</Label>
          <Input
            id="master-passphrase"
            type="password"
            autoComplete="off"
            value={masterPassphrase}
            onChange={(e) => {
              setMasterPassphrase(e.target.value);
            }}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-passphrase">Contraseña de la llave nueva</Label>
            <Input
              id="new-passphrase"
              type="password"
              autoComplete="new-password"
              aria-invalid={tooShort}
              value={newPassphrase}
              onChange={(e) => {
                setNewPassphrase(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-passphrase">Repite la contraseña</Label>
            <Input
              id="confirm-passphrase"
              type="password"
              autoComplete="new-password"
              aria-invalid={mismatch}
              value={confirmation}
              onChange={(e) => {
                setConfirmation(e.target.value);
              }}
            />
          </div>
        </div>
        {tooShort && (
          <p className="text-warning">La contraseña debe tener al menos {MIN_LENGTH} caracteres.</p>
        )}
        {mismatch && <p className="text-warning">Las contraseñas no coinciden.</p>}
        <Button type="submit" variant="outline" disabled={busy || !ready}>
          <KeySquare />
          Crear llave de edición nueva
        </Button>
      </form>
    </details>
  );
}
