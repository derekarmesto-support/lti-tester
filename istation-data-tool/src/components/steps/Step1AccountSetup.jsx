import StepCard from '../StepCard.jsx';

export default function Step1AccountSetup({ step, onNext }) {
  return (
    <StepCard step={step} onNext={onNext} nextLabel="I've set up my account →">
      <div className="setup-info">
        <span className="setup-info-icon">ℹ️</span>
        <span>
          This is a <strong>one-time setup</strong> — once your district manager account is created and
          your password is set, skip straight to Step 2 on future runs.
        </span>
      </div>

      <div className="section">
        <div className="section-title">Step 1 — Create your district manager account</div>
        <div className="tool-guidance">
          <div className="tool-guidance-title">Follow these steps in order</div>
          <ol className="tool-guidance-steps">
            <li>
              Log in to the <strong>Istation admin portal</strong> for the target district at{' '}
              <code>secure.istation.com</code> using an existing administrator account.
            </li>
            <li>
              Navigate to <strong>User Management</strong> and create a new user.
              Assign the role <strong>District Manager</strong> and enter the email address
              you want to use for automated downloads.
            </li>
            <li>
              Wait for an invite email from{' '}
              <code>noreply@amiralearning.com</code> — this is the account activation message.
              Check your spam folder if it doesn't arrive within 5 minutes.
            </li>
            <li>
              Open the email and click the <strong>"Set your password"</strong> link.
              Choose a strong, unique password — you will store it securely in the next steps.
            </li>
            <li>
              Log in to <code>secure.istation.com</code> once with your new credentials
              to confirm the account is active, then come back here and click <strong>Next</strong>.
            </li>
          </ol>
        </div>
      </div>

      <div className="section shaded">
        <div className="section-title">Finding your District OID</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          You'll need your district's OID (Object ID) in Step 2. After logging in, navigate to your
          district's page. The OID is the <strong>8–11 digit number</strong> in the URL:
        </p>
        <div style={{ marginTop: 10, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-mono)', fontSize: '0.73rem', color: 'var(--primary)' }}>
          {'secure.istation.com/Browser/Generic/'}
          <strong style={{ color: '#059669' }}>35360917</strong>
          {'?className=IGroup'}
        </div>
        <p style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
          Copy that number — you'll paste it into the District OID field on the next screen.
        </p>
      </div>
    </StepCard>
  );
}
