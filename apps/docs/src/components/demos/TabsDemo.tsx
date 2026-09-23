import { MorphTabs } from '@lestradavaz/morph-ui';
import './demo.css';

export default function TabsDemo() {
  return (
    <MorphTabs
      label="Component details"
      tabs={[
        {
          label: 'Overview',
          content: <p className="demo-copy">The panel changes at once. The pill takes its own time, because the pill is only the record of where you are.</p>,
        },
        {
          label: 'Motion',
          content: <p className="demo-copy">One curve for arriving, one for travelling. The same pair every component in the library is built on.</p>,
        },
        {
          label: 'Keys',
          content: <p className="demo-copy">Arrow keys move and select together, without the slide: a keyboard is held down, and a pill that lags behind is a pill that is somewhere else when you stop.</p>,
        },
      ]}
    />
  );
}
