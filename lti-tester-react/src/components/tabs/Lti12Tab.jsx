import { useState } from 'react';
import { buildLti12Params } from '../../utils/lti.js';
import { usePersistedState } from '../../utils/usePersistedState.js';
import DebugLog from '../DebugLog.jsx';
import SegmentedControl from '../SegmentedControl.jsx';

const LAUNCH_URL = 'https://sso.app.amiralearning.com/dwe-lti-sso/Launch/lti';

function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

function buildLogEntryHtml(postUrl, postParams, meta, ts) {
  const paramRows = Object.entries(postParams).map(([k, v]) => {
    const dim = k === 'oauth_signature' || k === 'oauth_consumer_key';
    return `  <span class="log-key">${k}</span><span class="log-sep"> = </span><span class="${dim ? 'log-dim' : 'log-val'}">${v}</span>`;
  }).join('\n');
  return [
    `<span class="log-head">▶ POST  ${ts}</span>`,
    `<span class="log-url">${postUrl}</span>`,
    ``,
    `<span class="log-key">── Parameters ──────────────────────────────</span>`,
    paramRows,
    ``,
    `<span class="log-key">── OAuth Signature ─────────────────────────</span>`,
    `  <span class="log-key">method</span><span class="log-sep">        = </span><span class="log-val">HMAC-SHA1</span>`,
    `  <span class="log-key">signing_key</span><span class="log-sep">   = </span><span class="log-dim">${meta.signingKey}</span>`,
    `  <span class="log-key">base_string</span><span class="log-sep">   = </span><span class="log-dim">${meta.baseString}</span>`,
    `  <span class="log-key">signature</span><span class="log-sep">     = </span><span class="log-val">${meta.signature}</span>`,
    `<span class="log-sep">────────────────────────────────────────────</span>`,
  ].join('\n');
}

function buildResponsePendingHtml() {
  return `\n\n<span class="log-key">── Response ────────────────────────────────</span>\n  <span class="log-dim">⏳ Awaiting response...</span>`;
}
function buildResponseHtml(status, statusText, finalUrl) {
  return `\n\n<span class="log-key">── Response ────────────────────────────────</span>\n` +
    `  <span class="log-key">status</span><span class="log-sep"> = </span><span class="log-val">${status} ${statusText}</span>\n` +
    `  <span class="log-key">final_url</span><span class="log-sep"> = </span><span class="log-url">${finalUrl}</span>\n` +
    `<span class="log-sep">────────────────────────────────────────────</span>`;
}
function buildResponseCorsHtml() {
  return `\n\n<span class="log-key">── Response ────────────────────────────────</span>\n` +
    `  <span class="log-dim">⚠ Response blocked by browser CORS policy — check the opened tab</span>\n` +
    `<span class="log-sep">────────────────────────────────────────────</span>`;
}

export default function Lti12Tab() {
  const [consumerKey, setConsumerKey]       = usePersistedState('lti12_consumer_key', '');
  const [consumerSecret, setConsumerSecret] = usePersistedState('lti12_consumer_secret', '');
  const [userIdField, setUserIdField]       = useState('user_id');
  const [userIdValue, setUserIdValue]       = useState('');
  const [roles, setRoles]                   = useState('Learner');
  const [givenName, setGivenName]           = useState('');
  const [familyName, setFamilyName]         = useState('');
  const [responseFormat, setResponseFormat] = useState('');
  const [outcomesUrl, setOutcomesUrl]       = useState('');

  const [errors, setErrors]     = useState({});
  const [touched, setTouched]   = useState({});
  const [statusType, setStatusType] = useState(null);
  const [statusMsg, setStatusMsg]   = useState('');
  const [logEntries, setLogEntries] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  function validate(f) {
    const errs = {};
    if (!f.consumerKey.trim()) errs.consumerKey = 'Consumer Key is required.';
    if (!f.consumerSecret.trim()) errs.consumerSecret = 'Consumer Secret is required.';
    if (!f.userIdValue.trim()) {
      errs.userIdValue = 'ID Value is required.';
    } else if (f.userIdField === 'lis_person_contact_email_primary' && !isValidEmail(f.userIdValue)) {
      errs.userIdValue = 'Looks like an invalid email address.';
    }
    return errs;
  }

  function getFields() {
    return { consumerKey, consumerSecret, userIdField, userIdValue, roles,
             givenName, familyName, responseFormat, outcomesUrl };
  }

  function handleBlur(field) {
    setTouched(t => ({ ...t, [field]: true }));
    setErrors(validate(getFields()));
  }

  function handleChange(field, value, setter) {
    setter(value);
    if (touched[field]) {
      const next = { ...getFields(), [field]: value };
      setErrors(validate(next));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatusType(null); setStatusMsg('');
    const fields = getFields();
    setTouched({ consumerKey: true, consumerSecret: true, userIdValue: true });
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const tabName = 'lti_launch_' + Date.now();
    let newTab;
    try { newTab = window.open('about:blank', tabName); } catch(_) {}
    if (!newTab) {
      setStatusType('error');
      setStatusMsg('Pop-ups are blocked. Please allow pop-ups for this page, or open the tester directly in its own tab.');
      return;
    }

    setSubmitting(true);
    try {
      const { postParams, baseString, signingKey, signature } =
        buildLti12Params({ launchUrl: LAUNCH_URL, ...fields });

      const ts = new Date().toLocaleTimeString();
      const entryHtml = buildLogEntryHtml(LAUNCH_URL, postParams, { signingKey, baseString, signature }, ts)
        + buildResponsePendingHtml();

      setLogEntries(prev => [entryHtml, ...prev]);
      const parsedUrl = new URL(LAUNCH_URL);
      setStatusType('success');
      setStatusMsg(`Launching to ${parsedUrl.hostname} in a new tab…`);

      const form = document.createElement('form');
      form.method = 'POST'; form.action = LAUNCH_URL; form.target = tabName;
      form.enctype = 'application/x-www-form-urlencoded';
      form.style.display = 'none';
      for (const [name, value] of Object.entries(postParams)) {
        const inp = document.createElement('input');
        inp.type = 'hidden'; inp.name = name; inp.value = value;
        form.appendChild(inp);
      }
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);

      fetch(LAUNCH_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(postParams).toString()
      }).then(res => {
        const responseHtml = buildResponseHtml(res.status, res.statusText, res.url || LAUNCH_URL);
        setLogEntries(prev => {
          const next = [...prev];
          next[0] = buildLogEntryHtml(LAUNCH_URL, postParams, { signingKey, baseString, signature }, ts) + responseHtml;
          return next;
        });
      }).catch(() => {
        setLogEntries(prev => {
          const next = [...prev];
          next[0] = buildLogEntryHtml(LAUNCH_URL, postParams, { signingKey, baseString, signature }, ts) + buildResponseCorsHtml();
          return next;
        });
      });
    } catch (err) {
      if (newTab) newTab.close();
      setStatusType('error'); setStatusMsg('Signature error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="tab-content active">
      <form onSubmit={handleSubmit} noValidate>
        <div className="section">
          <div className="section-title">Credentials</div>
          <div className="field-group">
            <label htmlFor="launch-url-12">Launch URL</label>
            <input type="text" id="launch-url-12" value={LAUNCH_URL}
              readOnly className="field-locked" autoComplete="off" spellCheck="false" />
          </div>
          <div className="two-col">
            <div className="field-group">
              <label htmlFor="consumer-key-12">Consumer Key</label>
              <input type="text" id="consumer-key-12" placeholder="your_consumer_key"
                autoComplete="off" spellCheck="false"
                value={consumerKey}
                onChange={e => handleChange('consumerKey', e.target.value, setConsumerKey)}
                onBlur={() => handleBlur('consumerKey')}
                className={touched.consumerKey ? (errors.consumerKey ? 'field-invalid' : 'field-valid') : ''}
              />
              {touched.consumerKey && errors.consumerKey && (
                <div className="field-hint visible">{errors.consumerKey}</div>
              )}
            </div>
            <div className="field-group">
              <label htmlFor="consumer-secret-12">Consumer Secret</label>
              <input type="password" id="consumer-secret-12" placeholder="your_consumer_secret"
                autoComplete="off"
                value={consumerSecret}
                onChange={e => handleChange('consumerSecret', e.target.value, setConsumerSecret)}
                onBlur={() => handleBlur('consumerSecret')}
                className={touched.consumerSecret ? (errors.consumerSecret ? 'field-invalid' : 'field-valid') : ''}
              />
              {touched.consumerSecret && errors.consumerSecret && (
                <div className="field-hint visible">{errors.consumerSecret}</div>
              )}
            </div>
          </div>
        </div>

        <div className="section shaded">
          <div className="section-title">User Identity</div>
          <div className="two-col">
            <div className="field-group">
              <label>ID Field</label>
              <SegmentedControl
                options={[
                  { value: 'user_id',                          label: 'School ID' },
                  { value: 'lis_person_contact_email_primary', label: 'Email' },
                  { value: 'ext_user_username',                label: '3rd Party' },
                ]}
                value={userIdField}
                onChange={val => {
                  setUserIdField(val);
                  if (touched.userIdValue) {
                    setErrors(validate({ ...getFields(), userIdField: val }));
                  }
                }}
              />
            </div>
            <div className="field-group">
              <label htmlFor="user-id-value-12">ID Value</label>
              <input type="text" id="user-id-value-12" placeholder="t9447"
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
          <div className="two-col">
            <div className="field-group">
              <label htmlFor="person-name-given-12">
                First Name <span className="optional-tag">optional</span>
              </label>
              <input type="text" id="person-name-given-12" placeholder="Jane"
                autoComplete="off" spellCheck="false"
                value={givenName} onChange={e => setGivenName(e.target.value)} />
            </div>
            <div className="field-group">
              <label htmlFor="person-name-family-12">
                Last Name <span className="optional-tag">optional</span>
              </label>
              <input type="text" id="person-name-family-12" placeholder="Smith"
                autoComplete="off" spellCheck="false"
                value={familyName} onChange={e => setFamilyName(e.target.value)} />
            </div>
          </div>
          <div className="field-group">
            <label>Role</label>
            <SegmentedControl
              options={[
                { value: 'Learner',       label: 'Student' },
                { value: 'Instructor',    label: 'Teacher' },
                { value: 'Administrator', label: 'Admin' },
              ]}
              value={roles}
              onChange={setRoles}
            />
          </div>
          <div className="two-col">
            <div className="field-group">
              <label htmlFor="response-format-12">Response Format</label>
              <div className="select-wrapper">
                <select id="response-format-12" value={responseFormat}
                  onChange={e => setResponseFormat(e.target.value)}>
                  <option value="">None</option>
                  <option value="xml">XML</option>
                </select>
              </div>
            </div>
            {responseFormat === 'xml' && (
              <div className="field-group">
                <label htmlFor="outcomes-url-12">Outcomes Service URL</label>
                <input type="text" id="outcomes-url-12" placeholder="https://your-lms/outcomes"
                  autoComplete="off" spellCheck="false"
                  value={outcomesUrl} onChange={e => setOutcomesUrl(e.target.value)} />
              </div>
            )}
          </div>
        </div>

        <div className="launch-section">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Signing…' : <span>&#9658;&nbsp; Launch LTI Tool</span>}
          </button>
          {statusType && (
            <div className={`message ${statusType}`}>{statusMsg}</div>
          )}
        </div>

        <DebugLog
          entries={logEntries}
          onClear={() => setLogEntries([])}
          title="Request Log"
        />
      </form>
    </div>
  );
}
