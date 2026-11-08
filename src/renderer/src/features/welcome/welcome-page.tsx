import { type SubmitEvent, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { invoke } from '@/lib/ipc';
import type { IpcResponse } from '@shared/ipc/contract';

type AppInfo = IpcResponse<'app:get-info'>;

export function WelcomePage() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    invoke('app:get-info')
      .then(setInfo)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err));
      });
  }, []);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await invoke('app:ping', { message });
      setReply(response.reply);
    } catch (err) {
      setReply(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Desktop Guide</h1>
        <p className="text-muted-foreground">
          Electron + React + TypeScript scaffold. Edit{' '}
          <code className="rounded bg-muted px-1 py-0.5 text-sm">src/renderer/src/app.tsx</code> to
          get started.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Runtime</CardTitle>
          <CardDescription>Fetched from the main process via typed IPC.</CardDescription>
        </CardHeader>
        <CardContent>
          {info ? (
            <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Version</dt>
              <dd>{info.version}</dd>
              <dt className="text-muted-foreground">Platform</dt>
              <dd>{info.platform}</dd>
              <dt className="text-muted-foreground">Electron</dt>
              <dd>{info.versions.electron}</dd>
              <dt className="text-muted-foreground">Chrome</dt>
              <dd>{info.versions.chrome}</dd>
              <dt className="text-muted-foreground">Node</dt>
              <dd>{info.versions.node}</dd>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IPC round-trip</CardTitle>
          <CardDescription>Send a message; the main process validates and replies.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="flex gap-2" onSubmit={(e) => void handleSubmit(e)}>
            <Input
              aria-label="Message"
              placeholder="Type a message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
            />
            <Button type="submit" disabled={pending}>
              Ping
            </Button>
          </form>
          {reply && <p className="text-sm">{reply}</p>}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
