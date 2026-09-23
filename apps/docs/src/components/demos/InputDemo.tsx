import { useState } from 'react';
import { MorphInput, type MorphInputStatus } from '@lestradavaz/morph-ui';
import './demo.css';

export default function InputDemo() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const status: MorphInputStatus = !touched || !email ? 'idle' : valid ? 'success' : 'error';

  return (
    <div className="demo-fields">
      <MorphInput
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="name@example.com"
        value={email}
        status={status}
        onChange={(event) => { setEmail(event.target.value); setTouched(true); }}
        onBlur={() => setTouched(true)}
        message={status === 'error' ? 'Enter a valid email address.' : status === 'success' ? 'Address looks good.' : undefined}
      />
      <MorphInput label="Workspace" defaultValue="Morph" message="This one cannot be changed." disabled />
    </div>
  );
}
