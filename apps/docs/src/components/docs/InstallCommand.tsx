import { useState } from 'react';
import { release } from '@/core/data/catalog';
const managers = ['npm', 'pnpm', 'yarn', 'bun'] as const;

/**
 * `compact` keeps the manager tabs but drops the caption, since the hero says it
 * in its own words. Every manager installs the same package from the same
 * registry, so the choice is only about which line you paste.
 */
export default function InstallCommand({ compact = false }: { compact?: boolean } = {}) {
  const [manager, setManager] = useState<typeof managers[number]>('npm');
  const [status, setStatus] = useState('');
  const command = `${manager} ${manager === 'npm' ? 'install' : 'add'} ${release.name} gsap`;
  const copy = async () => { try { await navigator.clipboard.writeText(command); setStatus('Copied'); } catch { setStatus('Select the command to copy'); } };
  return <div className={`install-command${compact ? ' is-compact' : ''}`}>
    <div className="install-toolbar"><div className="segmented" aria-label="Package manager">{managers.map(m => <button type="button" key={m} aria-pressed={manager === m} onClick={() => {setManager(m);setStatus('');}}>{m}</button>)}</div>{!compact && <span>v{release.version}</span>}</div>
    <div className="install-code"><code>{command}</code><button type="button" className="copy-button" onClick={copy}>Copy</button></div>
    <span className="sr-only" role="status">{status}</span>
    {status && <small className="copy-feedback">{status}</small>}
  </div>;
}
