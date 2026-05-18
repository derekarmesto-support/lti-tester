export default function StepCard({ step, totalSteps = 5, onBack, onNext, nextLabel, nextDisabled, children, hideActions }) {
  return (
    <div className="step-card">
      {children}
      {!hideActions && (
        <div className="step-actions">
          {step > 1 ? (
            <button className="btn-secondary" onClick={onBack}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          <div className="step-actions-right">
            <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
              Step {step} of {totalSteps}
            </span>
            {step < totalSteps && (
              <button
                className="btn-secondary"
                onClick={onNext}
                disabled={nextDisabled}
                style={{ fontWeight: 700 }}
              >
                {nextLabel || 'Next →'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
