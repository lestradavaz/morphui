import { useState } from 'react';
import { MorphContextMenu, type MorphMenuItem } from '@lestradavaz/morph-ui';
import './demo.css';

export default function ContextMenuDemo() {
  const [name, setName] = useState('Project brief');
  const [copies, setCopies] = useState(0);
  const [favourite, setFavourite] = useState(false);
  const [notice, setNotice] = useState('Click, right-click, long-press, or press Shift+F10.');

  const items: MorphMenuItem[] = [
    {
      id: 'rename',
      label: 'Rename',
      icon: '✎',
      onSelect: () => {
        const next = name === 'Project brief' ? 'Project brief (edited)' : 'Project brief';
        setName(next);
        setNotice(`Renamed to ${next}.`);
      },
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: '▣',
      onSelect: () => {
        setCopies(count => count + 1);
        setNotice('A copy was created.');
      },
    },
    {
      id: 'favourite',
      label: favourite ? 'Favourite' : 'Add to favourites',
      icon: favourite ? '★' : '☆',
      checked: favourite,
      onSelect: () => {
        setFavourite(value => !value);
        setNotice(favourite ? 'Removed from favourites.' : 'Added to favourites.');
      },
    },
    { id: 'details', label: 'Show details', icon: 'ⓘ', onSelect: () => setNotice('Last edited today · Shared with 3 people.') },
  ];

  return (
    <div className="demo-stack demo-context">
      <MorphContextMenu
        label="File actions"
        items={items}
        trigger={
          <div className="demo-file" tabIndex={0} role="button" aria-label={`Actions for ${name}`}>
            <span className="demo-file-icon" aria-hidden="true">▤</span>
            <span>
              <strong>{name}</strong>
              <small>Document · {copies ? `${copies} ${copies === 1 ? 'copy' : 'copies'}` : 'No copies'}</small>
            </span>
            <span className="demo-file-favourite" aria-hidden="true">{favourite ? '★' : '⋯'}</span>
          </div>
        }
      />
      <p className="demo-notice" aria-live="polite">{notice}</p>
    </div>
  );
}
