import { useState } from 'react';
import { generateUUID } from '../../utils/oauth.js';
import DebugLog from '../DebugLog.jsx';

const INIT_URL = 'https://sso.app.amiralearning.com/dwe-lti-sso/Launch/lti/1.3/init';
const REG_URL  = 'https://sso.app.amiralearning.com/dwe-lti-sso/Registration/Init';

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch (_) { return false; }
}

function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

export default function Lti13Tab() {
  const [clientId, setClientId]             = useState('');
  const [deploymentId, setDeploymentId]     = useState('');
  const [issuerId, setIssuerId]             = useState('');
  const [userIdField, setUserIdField]       = useState('user_id');
  const [userIdValue, setUserIdValue]       = useState('');
  const [roles, setRoles]                   = useState('Learner');
  const [targetLinkUri, setTargetLinkUri]   = useState('');
  const [ltiMessageHint, setLtiMessageHint] = useState('');
  const [resourceLinkId, setResourceLinkId] = useState('');

  // key pair state
  const [keyStatus, setKeyStatus]       = useState('none');
  const [keyStatusText, setKeyStatusText] = useState('No key pair generated yet.');
  const [keyPair, setKeyPair]           = useState(null);
  const [jwksUrl, setJwksUrl]           = useState('—');
  const [showJwksRow, setShowJwksRow]   = useState(false);
  const [showSaveBtn, setShowSaveBtn]   = useState(false);
  const [genBtnLabel, setGenBtnLabel]   = useState('⚙ Generate New Key Pair');
  const [genBtnDisabled, setGenBtnDisabled] = useState(false);
  const [saveBtnLabel, setSaveBtnLabel] = useState('☁ Save Public Key to Server');
  const [saveBtnDisabled, setSaveBtnDisabled] = useState(false);
  const [copyJwksLabel, setCopyJwksLabel] = useState('Copy');

  // validation
  const [errors, setErrors]   = useState({});
  const [touched, setTouched] = useState({});

  // status / log
  const [statusType, setStatusType] = useState(null);
  const [statusMsg, setStatusMsg]   = useState('');
  const [logEntries, setLogEntries] = useState([]);
  const [launching, setLaunching]   = useState(false);

  function validate(f) {
    const errs = {};
    if (!f.clientId.trim()) errs.clientId = 'Client ID is required.';
    if (!f.deploymentId.trim()) errs.deploymentId = 'Deployment ID is required.';
    if (!f.issuerId.trim()) {
      errs.issuerId = 'Issuer ID is required.';
    } else if (!isValidUrl(f.issuerId)) {
      errs.issuerId = 'Must be a valid URL starting with https://';
    }
    if (!f.userIdValue.trim()) {
      errs.userIdValue = 'ID Value is required.';
    } else if (f.userIdField === 'lis_person_contact_email_primary' && !isValidEmail(f.userIdValue)) {
      errs.userIdValue = 'Looks like an invalid email address.';
    }
    return errs;
  }

  function getFields() {
    return { clientId, deploymentId, issuerId, userIdField, userIdValue, roles,
             targetLinkUri, ltiMessageHint, resourceLinkId };
  }

  function handleBlur(field) {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validate(getFields()));
  }

  function handleChange(field, value, setter) {
    setter(value);
    if (touched[field]) {
      setErrors(validate({ ...getFields(), [field]: value }));
    }
  }

  async function handleGenerateKeys() {
    setGenBtnDisabled(true); setGenBtnLabel('⏳ Generating…');
    setKeyStatus('working'); setKeyStatusText('Generating 2048-bit RSA key pair…');
    try {
      const kp = await crypto.subtle.generateKey(
        { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048,
          publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' },
        true, ['sign', 'verify']
      );
      const privateKeyJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
      const publicKeyJwk  = await crypto.subtle.exportKey('jwk', kp.publicKey);
      const kid = 'lti-key-' + Date.now();
      privateKeyJwk.kid = kid; publicKeyJwk.kid = kid;
      const publicJwks = JSON.stringify({ keys: [{ ...publicKeyJwk, use: 'sig', alg: 'RS256' }] });
      const newKeyPair = { privateKeyJwk, publicKeyJwk, publicJwks, kid };
      setKeyPair(newKeyPair);
      sessionStorage.setItem('lti13_private_key', JSON.stringify(privateKeyJwk));
      setKeyStatus('ready'); setKeyStatusText('Key pair ready. Public key staged for server.');
      const url = (issuerId.trim() || '') + '?action=jwks';
      setJwksUrl(url);
      setShowJwksRow(true);
      setShowSaveBtn(true);
      setGenBtnDisabled(false); setGenBtnLabel('⚙ Regenerate Key Pair');
    } catch (err) {
      setKeyStatus('none'); setKeyStatusText('Key generation failed: ' + err.message);
      setGenBtnDisabled(false); setGenBtnLabel('⚙ Generate New Key Pair');
    }
  }

  function handleSaveJwks() {
    if (!keyPair) return;
    setSaveBtnDisabled(true); setSaveBtnLabel('⏳ Saving…');
    // No Apps Script in React context — show informational message
    setKeyStatus('ready');
    setKeyStatusText('Not running in Apps Script — key save skipped. Copy the JWKS URL to share manually.');
    setSaveBtnDisabled(false);
  }

  function handleCopyJwks() {
    navigator.clipboard.writeText(jwksUrl).then(() => {
      setCopyJwksLabel('Copied!');
      setTimeout(() => setCopyJwksLabel('Copy'), 2000);
    });
  }

  async function handleLaunch() {
    setStatusType(null); setStatusMsg('');
    const fields = getFields();
    const allTouched = { clientId: true, deploymentId: true, issuerId: true, userIdValue: true };
    setTouched(allTouched);
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!keyPair) {
      setStatusType('error');
      setStatusMsg('Generate and save an RSA key pair before launching.');
      return;
    }

    setLaunching(true);

    const resolvedResourceLinkId = resourceLinkId.trim() || generateUUID();
    const resolvedTargetLinkUri  = targetLinkUri.trim() || INIT_URL;
    const authCallback = issuerId.trim() + '?action=auth';

    const launchParams = {
      issuerId: issuerId.trim(), clientId: clientId.trim(),
      deploymentId: deploymentId.trim(),
      userId: userIdValue, userIdField,
      role: roles, resourceLinkId: resolvedResourceLinkId,
      targetLinkUri: resolvedTargetLinkUri, keyId: keyPair.kid,
    };
    sessionStorage.setItem('lti13_launch_params', JSON.stringify(launchParams));
    sessionStorage.setItem('lti13_private_key',   JSON.stringify(keyPair.privateKeyJwk));

    const oidcParams = {
      iss:               issuerId.trim(),
      login_hint:        userIdValue,
      target_link_uri:   resolvedTargetLinkUri,
      lti_deployment_id: deploymentId.trim(),
      client_id:         clientId.trim(),
      redirect_uri:      authCallback,
    };
    if (ltiMessageHint.trim()) oidcParams['lti_message_hint'] = ltiMessageHint.trim();

    const ts = new Date().toLocaleTimeString();
    const paramRows = Object.entries(oidcParams).map(([k, v]) =>
      `  <span class="log-key">${k}</span><span class="log-sep"> = </span><span class="log-val">${v}</span>`
    ).join('\n');

    const entryHtml = [
      `<span class="log-head">▶ OIDC Initiation  ${ts}</span>`,
      `<span class="log-url">${INIT_URL}</span>`,
      ``,
      `<span class="log-key">── OIDC Login Init Parameters ───────────────</span>`,
      paramRows,
      ``,
      `<span class="log-key">── Auth Callback (our endpoint) ────────────</span>`,
      `  <span class="log-url">${authCallback}</span>`,
      ``,
      `<span class="log-dim">Amira will redirect back to our auth callback with nonce, state, and redirect_uri.</span>`,
    ].join('\n');

    setLogEntries(prev => [entryHtml, ...prev]);
    setStatusType('success'); setStatusMsg('Initiating OIDC flow with Amira…');

    setTimeout(() => {
      const form = document.createElement('form');
      form.method = 'POST'; form.action = INIT_URL; form.style.display = 'none';
      for (const [name, value] of Object.entries(oidcParams)) {
        const inp = document.createElement('input');
        inp.type = 'hidden'; inp.name = name; inp.value = value;
        form.appendChild(inp);
      }
      document.body.appendChild(form);
      form.submit();
      setLaunching(false);
    }, 600);
  }

  return (
    <div className="tab-content active">
      {/* Setup info banner */}
      <div className="setup-info">
        <div className="setup-info-icon">ℹ</div>
        <div>
          <strong>First time?</strong> Complete LTI 1.3 registration with Amira before launching.
          Give this URL to the customer to start registration:{' '}
          <span className="setup-reg-url">{REG_URL}</span>
          <br />After registration, Amira will confirm your <strong>Client ID</strong> and <strong>Deployment ID</strong>.
        </div>
      </div>

      <div className="section">
        <div className="section-title">Connection</div>
        <div className="field-group">
          <label htmlFor="init-url-13">Init URL (Amira&apos;s OIDC Endpoint)</label>
          <input type="text" id="init-url-13" value={INIT_URL}
            readOnly className="field-locked" autoComplete="off" spellCheck="false" />
        </div>
        <div className="two-col">
          <div className="field-group">
            <label htmlFor="client-id-13">Client ID</label>
            <input type="text" id="client-id-13" placeholder="e.g. admin.1000243642.ia"
              autoComplete="off" spellCheck="false"
              value={clientId}
              onChange={e => handleChange('clientId', e.target.value, setClientId)}
              onBlur={() => handleBlur('clientId')}
              className={touched.clientId ? (errors.clientId ? 'field-invalid' : 'field-valid') : ''}
            />
            {touched.clientId && errors.clientId && (
              <div className="field-hint visible">{errors.clientId}</div>
            )}
            <div className="hint-text">
              Provided after LTI 1.3 registration. Identifies your LMS to Amira — may follow the{' '}
              <em>admin.&#123;districtId&#125;.&#123;state&#125;</em> format.
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="deployment-id-13">Deployment ID</label>
            <input type="text" id="deployment-id-13" placeholder="e.g. 1"
              autoComplete="off" spellCheck="false"
              value={deploymentId}
              onChange={e => handleChange('deploymentId', e.target.value, setDeploymentId)}
              onBlur={() => handleBlur('deploymentId')}
              className={touched.deploymentId ? (errors.deploymentId ? 'field-invalid' : 'field-valid') : ''}
            />
            {touched.deploymentId && errors.deploymentId && (
              <div className="field-hint visible">{errors.deploymentId}</div>
            )}
            <div className="hint-text">
              Provided after registration. Typically <em>1</em> for a single deployment per Client ID.
            </div>
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="issuer-id-13">Issuer ID (Your Platform URL)</label>
          <input type="text" id="issuer-id-13"
            placeholder="https://script.google.com/macros/s/…/exec"
            autoComplete="off" spellCheck="false"
            value={issuerId}
            onChange={e => handleChange('issuerId', e.target.value, setIssuerId)}
            onBlur={() => handleBlur('issuerId')}
            className={touched.issuerId ? (errors.issuerId ? 'field-invalid' : 'field-valid') : ''}
          />
          {touched.issuerId && errors.issuerId && (
            <div className="field-hint visible">{errors.issuerId}</div>
          )}
          <div className="hint-text">
            Your Apps Script web app URL. This is the URL you give Amira as your platform.
          </div>
        </div>
        <div className="two-col">
          <div className="field-group">
            <label htmlFor="target-link-uri-13">
              Target Link URI <span className="optional-tag">optional</span>
            </label>
            <input type="text" id="target-link-uri-13"
              placeholder="e.g. https://amiralearning.com"
              autoComplete="off" spellCheck="false"
              value={targetLinkUri}
              onChange={e => setTargetLinkUri(e.target.value)}
            />
            <div className="hint-text">
              The resource URL Amira should land on after login. Defaults to the Init URL if left blank.
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="lti-message-hint-13">
              LTI Message Hint <span className="optional-tag">optional</span>
            </label>
            <input type="text" id="lti-message-hint-13"
              placeholder="e.g. 123456"
              autoComplete="off" spellCheck="false"
              value={ltiMessageHint}
              onChange={e => setLtiMessageHint(e.target.value)}
            />
            <div className="hint-text">
              Passed through the OIDC redirect to identify the resource being launched.
            </div>
          </div>
        </div>
      </div>

      <div className="section shaded">
        <div className="section-title">RSA Key Pair</div>
        <div className={`key-status ${keyStatus}`}>
          <div className="key-dot"></div>
          <span>{keyStatusText}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button type="button" className="btn-secondary"
            disabled={genBtnDisabled} onClick={handleGenerateKeys}>
            {genBtnLabel}
          </button>
          {showSaveBtn && (
            <button type="button" className="btn-secondary"
              disabled={saveBtnDisabled} onClick={handleSaveJwks}>
              {saveBtnLabel}
            </button>
          )}
        </div>
        {showJwksRow && (
          <div>
            <label>
              JWKS URL{' '}
              <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                (share with Amira)
              </span>
            </label>
            <div className="jwks-row">
              <div className="jwks-url">{jwksUrl}</div>
              <button
                type="button"
                className={`btn-copy${copyJwksLabel === 'Copied!' ? ' copied' : ''}`}
                onClick={handleCopyJwks}
              >
                {copyJwksLabel}
              </button>
            </div>
            <div className="hint-text">
              Amira uses this URL to fetch your public key and verify the JWT you sign.
            </div>
          </div>
        )}
      </div>

      <div className="section">
        <div className="section-title">User Identity</div>
        <div className="two-col">
          <div className="field-group">
            <label htmlFor="user-id-field-13">ID Field</label>
            <div className="select-wrapper">
              <select id="user-id-field-13" value={userIdField}
                onChange={e => {
                  setUserIdField(e.target.value);
                  if (touched.userIdValue) {
                    setErrors(validate({ ...getFields(), userIdField: e.target.value }));
                  }
                }}
              >
                <option value="user_id">School Assigned ID</option>
                <option value="lis_person_contact_email_primary">E-mail Address</option>
                <option value="ext_user_username">3rd Party ID</option>
              </select>
            </div>
          </div>
          <div className="field-group">
            <label htmlFor="user-id-value-13">ID Value</label>
            <input type="text" id="user-id-value-13" placeholder="t9447"
              autoComplete="off" spellCheck="false"
              value={userIdValue}
              onChange={e => handleChange('userIdValue', e.target.value, setUserIdValue)}
              onBlur={() => handleBlur('userIdValue')}
              className={touched.userIdValue ? (errors.userIdValue ? 'field-invalid' : 'field-valid') : ''}
            />
            {touched.userIdValue && errors.userIdValue && (
              <div className="field-hint visible">{errors.userIdValue}</div>
            )}
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="roles-13">Role</label>
          <div className="select-wrapper">
            <select id="roles-13" value={roles} onChange={e => setRoles(e.target.value)}>
              <option value="Learner">Student (Learner)</option>
              <option value="Instructor">Teacher (Instructor)</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>
        </div>
        <div className="field-group">
          <label htmlFor="resource-link-id-13">
            Resource Link ID <span className="optional-tag">optional</span>
          </label>
          <input type="text" id="resource-link-id-13" placeholder="Auto-generated"
            autoComplete="off" spellCheck="false"
            value={resourceLinkId}
            onChange={e => setResourceLinkId(e.target.value)}
          />
          <div className="hint-text">Leave blank to auto-generate a UUID each launch.</div>
        </div>
      </div>

      <div className="launch-section">
        <button type="button" className="btn-primary" disabled={launching} onClick={handleLaunch}>
          {launching ? 'Initiating…' : <span>&#9658;&nbsp; Start LTI 1.3 Launch</span>}
        </button>
        {statusType && (
          <div className={`message ${statusType}`}>{statusMsg}</div>
        )}
      </div>

      <DebugLog
        entries={logEntries}
        onClear={() => setLogEntries([])}
        title="OIDC Flow Log"
        copyId={false}
      />
    </div>
  );
}
