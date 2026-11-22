import { useState } from 'react';
import { PageHeader } from '../components/ui';
import { exportBackup, importBackup, saveSettings } from '../data/db';
import { usePlayerName } from '../data/hooks';

export function SettingsPage() {
  const playerName = usePlayerName();
  return (
    <>
      <PageHeader title="Ajustes" />
      <PlayerNameForm key={playerName} initial={playerName} />
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
        Los datos se guardan solo en este navegador. Si borras los datos del navegador se pierden,
        así que descarga una copia de vez en cuando.
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
