import {
  Download,
  KeyRound,
  Lock,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Upload,
} from 'lucide-react';
import { type ReactNode, useState } from 'react';

import { Notice } from '@/components/notice';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { type ActionResult, useContent } from '@/features/content/content-context';

const dateFormatter = new Intl.DateTimeFormat('es-VE', { dateStyle: 'long', timeStyle: 'short' });

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border bg-card p-6">
      <h2 className="text-lg font-semibold text-brand">{title}</h2>
      <div className="mt-3 space-y-4 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function Feedback({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  return (
    <p
      role="status"
      className={result.ok ? 'font-medium text-success' : 'font-medium text-warning'}
    >
      {result.message}
    </p>
  );
}

export function ContentAdminPage() {
  const { state, importPackage, exportPackage, reset, unlock, lock } = useContent();
  const [result, setResult] = useState<ActionResult | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<ActionResult | null>) {
    setBusy(true);
    setResult(null);
    try {
      setResult(await action());
    } catch (error) {
      setResult({ ok: false, message: error instanceof Error ? error.message : String(error) });
    } finally {
      setBusy(false);
    }
  }

  const official = state.source === 'signed-package' && state.publishedAt;

  return (
    <>
      <PageHeader
        title="Contenido del manual"
        description="Actualiza la información del manual con un archivo oficial publicado por la Escuela de Ingeniería de Sistemas."
      />
      {state.warning && <Notice className="mb-5">{state.warning}</Notice>}

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Versión actual">
          <p className="flex items-start gap-2 text-foreground">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-success" aria-hidden />
            {official
              ? `Contenido oficial publicado el ${dateFormatter.format(new Date(official))}`
              : 'Contenido original incluido en el instalador'}
          </p>
          <p>
            La app solo acepta archivos firmados con la llave de la escuela. Si un archivo fue
            modificado por otra persona, se rechaza automáticamente.
          </p>
        </Panel>

        <Panel title="Actualizar esta computadora">
          <p>
            Importa el archivo .psm que te entregó la Escuela para ver la información más reciente.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button disabled={busy} onClick={() => void run(importPackage)}>
              <Upload />
              Importar archivo oficial
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => void run(exportPackage)}>
              <Download />
              Exportar para otra computadora
            </Button>
            {state.source === 'signed-package' && (
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await reset();
                    return { ok: true, message: 'Se restauró el contenido original.' };
                  })
                }
              >
                <RotateCcw />
                Restaurar original
              </Button>
            )}
          </div>
        </Panel>

        <Panel title="Edición (solo personal autorizado)">
          {!state.signingConfigured ? (
            <p className="flex gap-2">
              <ShieldAlert className="size-5 shrink-0 text-warning" aria-hidden />
              Esta instalación no tiene configurada la llave de la escuela.
            </p>
          ) : state.editorUnlocked ? (
            <>
              <p className="text-foreground">
                La edición está desbloqueada. En cada página verás el botón «Editar esta página». Al
                guardar, el contenido queda firmado; luego expórtalo para las demás computadoras.
              </p>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() =>
                  void run(async () => {
                    await lock();
                    return { ok: true, message: 'Edición bloqueada.' };
                  })
                }
              >
                <Lock />
                Bloquear edición
              </Button>
            </>
          ) : (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void run(async () => {
                  const outcome = await unlock(passphrase);
                  if (outcome?.ok) setPassphrase('');
                  return outcome;
                });
              }}
            >
              <p>
                Escribe la contraseña de la llave y luego selecciona el archivo de la llave de la
                escuela (.pem).
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="key-passphrase">Contraseña de la llave</Label>
                <Input
                  id="key-passphrase"
                  type="password"
                  autoComplete="off"
                  value={passphrase}
                  onChange={(e) => {
                    setPassphrase(e.target.value);
                  }}
                />
              </div>
              <Button type="submit" disabled={busy || passphrase.length === 0}>
                <KeyRound />
                Desbloquear con la llave
              </Button>
            </form>
          )}
        </Panel>
      </div>
      <div className="mt-5">
        <Feedback result={result} />
      </div>
    </>
  );
}
