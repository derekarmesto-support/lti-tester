import StepCard from '../StepCard.jsx';

const LABELS = { reading: 'English Reading SSH', spanish: 'Spanish SSH' };

function previewFilename(pattern, reportType) {
  const types = reportType === 'both' ? ['reading', 'spanish'] : [reportType];
  return types.map(t => {
    const label = LABELS[t] || t;
    const today = new Date();
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dateStr = `${months[today.getMonth()]} ${today.getDate()} ${today.getFullYear()}`;
    return pattern
      .replace('{student_id}', '1234567')
      .replace('{student_name}', 'Jane Doe')
      .replace('{report_type}', label)
      .replace('{date}', dateStr) + '.pdf';
  });
}

export default function Step3Reports({ config, setConfig, step, onBack, onNext }) {
  function set(key, val) {
    setConfig(prev => ({ ...prev, [key]: val }));
  }

  const previews = previewFilename(config.filenamePattern, config.reportType);

  return (
    <StepCard step={step} onBack={onBack} onNext={onNext}>
      <div className="section">
        <div className="section-title">Report Configuration</div>

        <div className="field-group">
          <label>School Year</label>
          <div className="seg-control">
            {['2024', '2025'].map(y => (
              <button
                key={y}
                className={`seg-option${config.year === y ? ' active' : ''}`}
                onClick={() => set('year', y)}
              >
                {y}–{String(Number(y) + 1).slice(2)}
              </button>
            ))}
          </div>
          <div className="field-hint" style={{ marginTop: 8 }}>
            The academic year for the reports (matches the <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>Year=</code> parameter in Istation URLs)
          </div>
        </div>

        <div className="field-group" style={{ marginTop: 20 }}>
          <label>Report Type</label>
          <div className="seg-control">
            {[
              { value: 'reading', label: 'English Reading' },
              { value: 'spanish', label: 'Spanish (ISIPES)' },
              { value: 'both',    label: 'Both' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`seg-option${config.reportType === opt.value ? ' active' : ''}`}
                onClick={() => set('reportType', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="field-hint" style={{ marginTop: 8 }}>
            {config.reportType === 'reading' && 'Downloads English reading SSH reports (Pid=ISIPEN)'}
            {config.reportType === 'spanish' && 'Downloads Spanish SSH reports (Pid=ISIPES)'}
            {config.reportType === 'both'    && 'Downloads both English (ISIPEN) and Spanish (ISIPES) reports per student'}
          </div>
        </div>
      </div>

      <div className="section shaded">
        <div className="section-title">Filename Pattern</div>

        <div className="field-group">
          <label htmlFor="filenamePattern">Pattern</label>
          <input
            id="filenamePattern"
            type="text"
            value={config.filenamePattern}
            onChange={e => set('filenamePattern', e.target.value)}
          />
          <div className="field-hint">
            Available tokens:{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{'{student_id}'}</code>{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{'{student_name}'}</code>{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{'{report_type}'}</code>{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{'{date}'}</code>
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-subtle)', marginBottom: 6 }}>
            Preview
          </div>
          {previews.map((name, i) => (
            <div key={i} className="filename-preview" style={{ marginBottom: i < previews.length - 1 ? 6 : 0 }}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </StepCard>
  );
}
