import StepCard from '../StepCard.jsx';

const PW_SOURCE_INFO = {
  keyring: {
    text: 'Password is stored in your OS keychain (most secure). After downloading the script, run:',
    code: 'python downloader.py --store-password',
  },
  env: {
    text: 'Set an environment variable before running the script:',
    code: 'export ISTATION_PASSWORD="your-password"   # macOS/Linux\nset ISTATION_PASSWORD=your-password         # Windows',
  },
  credfile: {
    text: 'Credentials are stored in credentials.env alongside the script. Enter your password below — it will be included in the ZIP.',
    code: null,
    warning: true,
  },
  prompt: {
    text: 'The script will ask for your password each time it runs. Best for manual/one-off use.',
    code: null,
  },
};

export default function Step2Connection({ config, setConfig, step, onBack, onNext }) {
  const oidValid = /^\d{8,11}$/.test(config.districtOid);
  const emailValid = config.email && config.email.includes('@');
  const credFileValid = config.passwordSource !== 'credfile' || (config.credentialPassword && config.credentialPassword.length > 0);
  const canNext = oidValid && emailValid && credFileValid;

  function set(key, val) {
    setConfig(prev => ({ ...prev, [key]: val }));
  }

  const pwInfo = PW_SOURCE_INFO[config.passwordSource] || PW_SOURCE_INFO.keyring;

  return (
    <StepCard step={step} onBack={onBack} onNext={onNext} nextDisabled={!canNext}>
      <div className="section">
        <div className="section-title">District Information</div>

        <div className="field-group">
          <label htmlFor="districtOid">District OID</label>
          <input
            id="districtOid"
            type="text"
            value={config.districtOid}
            onChange={e => set('districtOid', e.target.value.trim())}
            placeholder="e.g. 35360917"
            className={config.districtOid ? (oidValid ? 'field-valid' : 'field-invalid') : ''}
          />
          <div className="field-hint">
            {config.districtOid && !oidValid
              ? <span style={{ color: 'var(--error)', fontWeight: 500 }}>Must be 8–11 digits (numbers only)</span>
              : '8–11 digit number from the Istation Browser/Generic URL'
            }
          </div>
        </div>

        <div className="field-group">
          <label htmlFor="email">District Manager Email</label>
          <input
            id="email"
            type="text"
            value={config.email}
            onChange={e => set('email', e.target.value.trim())}
            placeholder="manager@district.org"
            className={config.email ? (emailValid ? 'field-valid' : 'field-invalid') : ''}
          />
          <div className="field-hint">The email you used to create the district manager account</div>
        </div>

        <div className="field-group">
          <label htmlFor="outputDir">Output Directory</label>
          <input
            id="outputDir"
            type="text"
            value={config.outputDir}
            onChange={e => set('outputDir', e.target.value)}
            placeholder="~/Documents/Istation Data"
          />
          <div className="field-hint">
            Where downloaded files will be saved. Use <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>~</code> for home directory on macOS/Linux, or a full path like <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>C:\Users\you\Documents\Istation</code> on Windows.
          </div>
        </div>
      </div>

      <div className="section shaded">
        <div className="section-title">Password Storage</div>
        <div className="field-group">
          <label>How should the script access your password?</label>
          <div className="seg-control" style={{ flexWrap: 'wrap' }}>
            {[
              { value: 'keyring',  label: '🔐 Keychain (Recommended)' },
              { value: 'env',      label: '🌿 Env Variable' },
              { value: 'credfile', label: '📄 Credentials File' },
              { value: 'prompt',   label: '⌨️  Prompt each time' },
            ].map(opt => (
              <button
                key={opt.value}
                className={`seg-option${config.passwordSource === opt.value ? ' active' : ''}`}
                onClick={() => set('passwordSource', opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {pwInfo.warning && (
          <div style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', color: 'var(--warn-text)', fontSize: '0.8rem', lineHeight: 1.55, marginBottom: 10 }}>
            <span style={{ flexShrink: 0 }}>⚠️</span>
            <span>
              <strong>Security notice:</strong> The credentials file stores your password in plain text.
              Keep it out of version control (<code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>.gitignore</code> is included in the ZIP).
              On macOS/Linux, restrict file access with <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>chmod 600 credentials.env</code>.
            </span>
          </div>
        )}

        <div className="pw-source-info">
          <div style={{ marginBottom: pwInfo.code ? 8 : 0 }}>{pwInfo.text}</div>
          {pwInfo.code && (
            <pre style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: 'rgba(0,0,0,0.06)', padding: '8px 10px', borderRadius: 6, whiteSpace: 'pre-wrap' }}>
              {pwInfo.code}
            </pre>
          )}
        </div>

        {config.passwordSource === 'credfile' && (
          <div className="field-group" style={{ marginTop: 12 }}>
            <label htmlFor="credentialPassword">Password</label>
            <input
              id="credentialPassword"
              type="password"
              value={config.credentialPassword || ''}
              onChange={e => set('credentialPassword', e.target.value)}
              placeholder="Enter your district manager password"
              className={config.credentialPassword ? 'field-valid' : ''}
              autoComplete="new-password"
            />
            <div className="field-hint">
              This will be written to <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>credentials.env</code> inside the downloaded ZIP.
            </div>
          </div>
        )}
      </div>
    </StepCard>
  );
}
