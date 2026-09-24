import { useEffect, useRef, useState } from 'react';
import { release } from '@/core/data/catalog';
const managers = ['npm', 'pnpm', 'yarn', 'bun'] as const;

export default function InstallCommand({ compact = false }: { compact?: boolean } = {}) {
  const [manager, setManager] = useState<typeof managers[number]>('npm');
  const [status, setStatus] = useState('');
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const request = useRef(0);
  useEffect(() => () => { clearTimeout(timeout.current); request.current++; }, []);
  const command = `${manager} ${manager === 'npm' ? 'install' : 'add'} ${release.name} gsap`;
  const reset = () => { request.current++; clearTimeout(timeout.current); setStatus(''); };
  const copy = async () => {
    clearTimeout(timeout.current);
    const current = ++request.current;
    try {
      await navigator.clipboard.writeText(command);
      if (current !== request.current) return;
      setStatus('Copied');
      timeout.current = setTimeout(() => setStatus(''), 2500);
    } catch {
      if (current === request.current) setStatus('Select the command to copy');
    }
  };
  return <div className={`install-command${compact ? ' is-compact' : ''}`}>
    <div className="install-toolbar"><div className="segmented" aria-label="Package manager">{managers.map(m => <button type="button" key={m} aria-pressed={manager === m} onClick={() => { reset(); setManager(m); }}>{m}</button>)}</div>{!compact && <span>v{release.version}</span>}</div>
    <div className="install-code"><code>{command}</code><button type="button" className="copy-button" onClick={copy}>{status === 'Copied' ? <><span aria-hidden="true">✓</span> Copied</> : 'Copy'}</button></div>
    <span className="sr-only" role="status">{status}</span>
    {status && status !== 'Copied' && <small className="copy-feedback">{status}</small>}
  </div>;
}
