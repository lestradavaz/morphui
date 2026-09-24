import { useEffect, useRef, useState } from 'react';
import { navigate } from 'astro:transitions/client';
import { navigation } from '@/core/data/catalog';
const entries = navigation.flatMap(section => section.links);
export default function Search() {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const open = () => { setQuery(''); dialog.current?.showModal(); input.current?.focus(); };
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); if (dialog.current?.open) dialog.current.close(); else open(); } };
    document.addEventListener('keydown', keydown); return () => document.removeEventListener('keydown', keydown);
  }, []);
  const results = entries.filter(entry => entry.label.toLowerCase().includes(query.toLowerCase().trim()));
  return <>
    <button type="button" className="search-trigger" onClick={open} aria-label="Search documentation"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg><span>Search docs</span><kbd>⌘ K</kbd></button>
    <dialog className="search-dialog" ref={dialog} aria-label="Search documentation" onClick={event => {if(event.target === dialog.current) dialog.current.close();}}>
      <div className="search-panel"><div className="search-input-row"><input ref={input} type="search" aria-label="Search documentation pages" placeholder="Find a component or guide…" value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event=>{if(event.key === 'Escape'){event.preventDefault();event.stopPropagation();dialog.current?.close();}else if(event.key === 'Enter' && results[0]) { dialog.current?.close(); navigate(results[0].href); }}}/><button type="button" onClick={()=>dialog.current?.close()} aria-label="Close search">Esc</button></div>
      <nav aria-label="Search results">{results.map(entry=><a key={entry.href} href={entry.href}>{entry.label}<span aria-hidden="true">↗</span></a>)}</nav>
      {!results.length && <p className="search-empty">No pages match “{query}”. Try “dialog”, “themes” or “installation”.</p>}
      <span className="sr-only" role="status">{results.length} results</span></div>
    </dialog>
  </>;
}
