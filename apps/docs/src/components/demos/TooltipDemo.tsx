import { MorphButton, MorphTooltip } from '@lestradavaz/morph-ui';
import './demo.css';

export default function TooltipDemo() {
  return (
    <div className="demo-row">
      <MorphTooltip tip="The same curve, at every scale">
        <MorphButton variant="ghost" size="sm">Inspect motion</MorphButton>
      </MorphTooltip>
      <MorphTooltip side="bottom" tip="Focus reveals this hint too">
        <MorphButton variant="ghost" size="sm">Keyboard focus</MorphButton>
      </MorphTooltip>
    </div>
  );
}
