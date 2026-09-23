import { useState } from 'react';
import { release } from '@/core/data/catalog';
const managers = ['npm', 'pnpm', 'yarn', 'bun'] as const;
export default function InstallCommand() {
  const [manager, setManager] = useState<typeof managers[number]>('npm');
  const [status, setStatus] = useState('');
  const command = `${manager} ${manager === 'npm' ? 'install' : 'add'} ./${release.filename} gsap`;
  return <div className="install-command">
    <div className="install-toolbar"><div className="segmented" aria-label="Package manager">{managers.map(m => <button type="button" key={m} aria-pressed={manager === m} onClick={() => {setManager(m);setStatus('');}}>{m}</button>)}</div><span>Local package</span></div>
    <div className="install-code"><code>{command}</code><button type="button" className="copy-button" onClick={async () => { try { await navigator.clipboard.writeText(command); setStatus('Copied'); } catch { setStatus('Select the command to copy'); } }}>Copy</button></div>
    <span className="sr-only" role="status">{status}</span>
    {status && <small className="copy-feedback">{status}</small>}
  </div>;
}
