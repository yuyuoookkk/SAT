import { Check } from 'lucide-react';

const STEPS = ['Identitas', 'Informasi', 'Evaluasi', 'Selesai'];

interface Props {
  /** 1-based index of the step currently being filled in. */
  current: number;
}

/** Four-step progress rail — Figma node 3435:193. */
const StepIndicator = ({ current }: Props) => {
  // Fills up to the centre of the active bullet, as in Figma node 3435:203.
  const fill = ((current - 0.5) / STEPS.length) * 100;

  return (
    <div className="steps" role="list" aria-label="Progres pengisian">
      <div className="steps__track" aria-hidden="true" />
      <div className="steps__fill" style={{ width: `${fill}%` }} aria-hidden="true" />

      {STEPS.map((label, i) => {
        const index = i + 1;
        const state = index < current ? 'done' : index === current ? 'active' : 'todo';

        return (
          <div
            key={label}
            role="listitem"
            className={`step step--${state}`}
            aria-current={state === 'active' ? 'step' : undefined}
          >
            <span className="step__bullet">
              {state === 'done' ? <Check size={20} strokeWidth={3} /> : index}
            </span>
            <span className="step__label">{label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default StepIndicator;
