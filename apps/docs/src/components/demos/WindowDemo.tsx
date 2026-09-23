import { MorphWindow, MorphClose } from '@lestradavaz/morph-ui';
import './demo.css';

export default function WindowDemo() {
  return (
    <MorphWindow
      aria-label="A little context"
      panelClassName="demo-window-panel"
      trigger={<button className="demo-chip" type="button">A little context</button>}
      chrome={<MorphClose><button className="demo-close" type="button" aria-label="Close window">×</button></MorphClose>}
    >
      <div className="demo-sheet">
        <h2>A little context</h2>
        <p>Some things need a little more room, without losing your place.</p>
        <p>The button you pressed is still there, untouched. This window grew out beside it, and it will go back the same way.</p>
        <div className="demo-detail"><span>Opening</span><span>700 ms</span></div>
        <div className="demo-detail"><span>Closing</span><span>500 ms</span></div>
        <MorphClose><button className="demo-primary" type="button">Got it</button></MorphClose>
      </div>
    </MorphWindow>
  );
}
