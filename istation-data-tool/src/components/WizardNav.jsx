const STEPS = [
  { label: 'Account\nSetup' },
  { label: 'Connection' },
  { label: 'Reports' },
  { label: 'Generate' },
  { label: 'Schedule' },
];

export default function WizardNav({ step }) {
  return (
    <div className="wizard-nav">
      {STEPS.map((s, i) => {
        const num    = i + 1;
        const isDone = num < step;
        const isActive = num === step;
        const circleClass = isDone ? 'done' : isActive ? 'active' : 'upcoming';
        const labelClass  = isDone ? 'done'  : isActive ? 'active'   : '';

        return (
          <div key={num} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? '1' : undefined }}>
            <div className="wizard-step">
              <div className={`wizard-step-circle ${circleClass}`}>
                {isDone ? '✓' : num}
              </div>
              <span className={`wizard-step-label ${labelClass}`}>
                {s.label.replace('\n', ' ')}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`wizard-connector${isDone ? ' done' : ''}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
