import { MorphCard, MorphClose } from 'morphui';
import './demo.css';

export default function CardDemo() {
  return (
    <MorphCard aria-label="A study in motion" card={
      <button className="demo-card" type="button" aria-label="Open A study in motion">
        <span className="demo-art" data-morph-item="art" />
        <span className="demo-card-caption">A study in motion<span aria-hidden="true">↗</span></span>
      </button>
    }>
      <article className="demo-feature">
        <span className="demo-art demo-art-wide" data-morph-item="art" />
        <MorphClose><button className="demo-close" type="button" aria-label="Close story">×</button></MorphClose>
        <div className="demo-story">
          <p className="demo-note">A study in motion</p>
          <h2>The detail becomes<br />the whole picture.</h2>
          <p>The image stays with you as the card opens. It follows its own path, separate from the content coming into focus around it.</p>
          <p>Close this view and watch it find its way home.</p>
          <MorphClose><button className="demo-primary" type="button">Back to the card</button></MorphClose>
        </div>
      </article>
    </MorphCard>
  );
}
