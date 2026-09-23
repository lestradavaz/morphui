import { useState } from 'react';
import { release } from '@/core/data/catalog';
const managers = ['npm', 'pnpm', 'yarn', 'bun'] as const;

/**
 * `compact` drops the toolbar so the command can sit in the hero, where the
 * first thing a developer looks for is the line they can paste. The manager
 * choice stays on the installation page.
 */
export default function InstallCommand({ compact = false }: { compact?: boolean } = {}) {
  const [manager, setManager] = useState<typeof managers[number]>('npm');
  const [status, setStatus] = useState('');
  const command = `${manager} ${manager === 'npm' ? 'install' : 'add'} ./${release.filename} gsap`;
  const copy = async () => { try { await navigator.clipboard.writeText(command); setStatus('Copied'); } catch { setStatus('Select the command to copy'); } };
  return <div className={`install-command${compact ? ' is-compact' : ''}`}>
    {!compact && <div className="install-toolbar"><div className="segmented" aria-label="Package manager">{managers.map(m => <button type="button" key={m} aria-pressed={manager === m} onClick={() => {setManager(m);setStatus('');}}>{m}</button>)}</div><span>Local package</span></div>}
    <div className="install-code"><code>{command}</code><button type="button" className="copy-button" onClick={copy}>Copy</button></div>
    <span className="sr-only" role="status">{status}</span>
    {status && <small className="copy-feedback">{status}</small>}
  </div>;
}
