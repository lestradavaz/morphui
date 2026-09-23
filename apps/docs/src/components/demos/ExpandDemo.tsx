import { MorphExpand } from '@lestradavaz/morph-ui';
import './demo.css';

export default function ExpandDemo() {
  return (
    <div className="demo-stack">
      <MorphExpand actions={['Copy link', 'Send email', 'Save']} label="Share" />
      <p className="demo-note">Open it, choose one, and the control keeps the choice.</p>
    </div>
  );
}
