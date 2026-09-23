import { useState } from 'react';
import { MorphButton } from '@lestradavaz/morph-ui';
import './demo.css';

export default function ButtonDemo() {
  const [loading, setLoading] = useState(false);
  return (
    <div className="demo-stack">
      <div className="demo-row">
        <MorphButton>Publish</MorphButton>
        <MorphButton variant="ghost">Preview</MorphButton>
        <MorphButton variant="chip">Draft</MorphButton>
        <MorphButton variant="icon" aria-label="Add to favourites">★</MorphButton>
      </div>
      <div className="demo-row">
        <MorphButton size="sm">Small pill</MorphButton>
        <MorphButton variant="ghost" size="sm">Small ghost</MorphButton>
        <MorphButton disabled>Disabled</MorphButton>
      </div>
      <div className="demo-row">
        <MorphButton loading={loading} onClick={() => setLoading(!loading)}>
          {loading ? 'Saving…' : 'Press to load'}
        </MorphButton>
      </div>
    </div>
  );
}
