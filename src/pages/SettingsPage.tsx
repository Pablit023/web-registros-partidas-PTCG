import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { formatDate, PageHeader } from '../components/ui';
import { db, exportBackup, importBackup, saveSettings } from '../data/db';
import { disableDiskSync, enableDiskSync, fetchDiskData, useDiskStatus } from '../data/diskSync';
import { usePlayerName } from '../data/hooks';

export function SettingsPage() {
  const playerName = usePlayerName();
  return (
    <>
      <PageHeader title="Ajustes" />
      <PlayerNameForm key={playerName} initial={playerName} />
      <DiskSection />
      <BackupSection />
    </>
  );
}

function PlayerNameForm({ initial }: { initial: string }) {
  const [name, setName] = useState(initial);
  const [saved, setSaved] = useState(false);
  return (
    <section className="card">
      <h2>Tu nombre en TCG Live</h2>
      <p className="muted">Con él se sabe en el log qué jugador eres tú y cuál es el rival.</p>
      <div className="form-actions start">
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSaved(false);
          }}
        />
        <button
          className="primary"
          disabled={name.trim() === '' || name.trim() === initial}
          onClick={() => void saveSettings({ playerName: name.trim() }).then(() => setSaved(true))}
        >
          Guardar
        </button>
        {saved && <span className="ok">Guardado.</span>}
      </div>
    </section>
  );
}

function DiskSection() {
  const enabled = useLiveQuery(
    async () => (await db.settings.get('settings'))?.saveToDisk ?? false,
  );
  const status = useDiskStatus();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (enabled) {
        await disableDiskSync();
        return;
      }
      const disk = await fetchDiskData();
      const browserGames = await db.games.count();
      let keep: 'disk' | 'browser' = disk ? 'disk' : 'browser';
      if (disk && browserGames > 0) {
        keep = window.confirm(
          `En el ordenador ya hay datos guardados el ${formatDate(disk.exportedAt)} con ` +
            `${disk.games.length} partidas, y en este navegador hay ${browserGames}.\n\n` +
            'Aceptar: usar los del ordenador.\nCancelar: sustituirlos por los de este navegador.',
        )
          ? 'disk'
          : 'browser';
      }
      await enableDiskSync(keep);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card">
      <h2>Guardar en el ordenador</h2>
      <p className="muted">
        Guarda también tus datos en el archivo <code>datos/partidas.json</code> de la carpeta del
        proyecto, que se actualiza solo con cada cambio. Así no dependen del navegador: si cambias
        de navegador o borras su historial, al activarlo otra vez se cargan del archivo. La versión
        anterior queda en <code>datos/partidas.anterior.json</code>.
      </p>
      <label className="toggle">
        <input
          type="checkbox"
          role="switch"
          checked={enabled ?? false}
          disabled={busy || enabled === undefined}
          onChange={() => void toggle()}
        />
        <span className="toggle-track" aria-hidden="true" />
        {enabled ? 'Activado' : 'Desactivado'}
      </label>
      {enabled && status.state === 'saved' && (
        <p className="ok">Último guardado: {formatDate(status.at.toISOString())}.</p>
      )}
      {enabled && status.state === 'error' && <p className="warning">{status.message}</p>}
      {error && <p className="warning">{error}</p>}
    </section>
  );
}

function BackupSection() {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function download() {
    const backup = await exportBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `partidas-ptcg-${backup.exportedAt.slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ ok: true, text: `Copia descargada con ${backup.games.length} partidas.` });
  }

  async function restore(file: File) {
    if (!window.confirm('Esto sustituye todos tus datos por los de la copia. ¿Seguir?')) return;
    try {
      await importBackup(JSON.parse(await file.text()));
      setMessage({ ok: true, text: 'Copia restaurada.' });
    } catch (error) {
      const text =
        error instanceof SyntaxError ? 'El archivo no es un JSON válido.' : String(error);
      setMessage({ ok: false, text: text.replace(/^Error: /, '') });
    }
  }

  return (
    <section className="card">
      <h2>Copia de seguridad</h2>
      <p className="muted">
        Descarga todos tus datos en un archivo para guardarlo donde quieras o llevarlo a otro
        ordenador, y restáuralo cuando lo necesites.
      </p>
      <div className="form-actions start">
        <button className="primary" onClick={() => void download()}>
          Descargar copia
        </button>
        <label className="button">
          Restaurar copia
          <input
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) void restore(file);
            }}
          />
        </label>
      </div>
      {message && <p className={message.ok ? 'ok' : 'warning'}>{message.text}</p>}
    </section>
  );
}
