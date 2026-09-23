import { MorphWindow, MorphClose } from 'morphui';
import './demo.css';

export default function WindowDemo() {
  return (
    <MorphWindow
      aria-label="A little context"
      panelClassName="demo-window-panel"
      trigger={<button className="demo-chip" type="button">A little context</button>}
      /* Chrome, not content: it rides above the panel rather than inside the
         layer that fades, blurs and settles during the transition. */
      chrome={<MorphClose><button className="demo-close" type="button" aria-label="Close window">×</button></MorphClose>}
    >
      <div className="demo-sheet">
        <h2 data-morph-words>A little context</h2>
        <p>Some things need a little more room.</p>
        <p>This window grows from the button you pressed. The words come along, the details come into focus, and everything finds its way back when you close it.</p>
        <div className="demo-detail"><span>Opening</span><span>700 ms</span></div>
        <div className="demo-detail"><span>Closing</span><span>500 ms</span></div>
        <MorphClose><button className="demo-primary" type="button">Got it</button></MorphClose>
      </div>
    </MorphWindow>
  );
}
