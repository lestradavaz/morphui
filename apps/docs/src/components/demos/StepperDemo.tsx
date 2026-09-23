import { useState } from 'react';
import { MorphStepper } from '@lestradavaz/morph-ui';
import './demo.css';

export default function StepperDemo() {
  const [seats, setSeats] = useState(1);

  return (
    <div className="demo-stack">
      <MorphStepper label="Seats" value={seats} onChange={setSeats} min={0} max={3} />
      <p className="demo-notice">
        {seats === 0 ? 'No seats. The minus is gone.' : seats === 3 ? 'Three seats. The plus is gone.' : `${seats} of 3 seats.`}
      </p>
    </div>
  );
}
