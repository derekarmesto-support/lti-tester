import { useState, useRef } from 'react';
import { buildLti10Params } from '../../utils/lti.js';
import DebugLog from '../DebugLog.jsx';
import SegmentedControl from '../SegmentedControl.jsx';

const LAUNCH_URL = 'https://sso.app.amiralearning.com/dwe-lti-sso/Launch/lti';

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch (_) { return false; }
}

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

export default function Lti10Tab() {
  const [consumerKey, setConsumerKey]   = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [userIdField, setUserIdField]   = useState('user_id');
  const [userIdValue, setUserIdValue]   = useState('');
  const [roles, setRoles]               = useState('Learner');

  // validation errors
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // status message
  const [statusType, setStatusType]     = useState(null);
  const [statusMsg, setStatusMsg]       = useState('');

  // log entries (array of HTML strings, newest first)
  const [logEntries, setLogEntries]     = useState([]);
  const [submitting, setSubmitting]     = useState(false);

  function validate(fields) {
    const errs = {};
    if (!fields.consumerKey.trim()) errs.consumerKey = 'Consumer Key is required.';
    if (!fields.consumerSecret.trim()) errs.consumerSecret = 'Consumer Secret is required.';
    if (!fields.userIdValue.trim()) {
      errs.userIdValue = 'ID Value is required.';
    } else if (fields.userIdField === 'lis_person_contact_email_primary' && !isValidEmail(fields.userIdValue)) {
      errs.userIdValue = 'Looks like an invalid email address.';
    }
    return errs;
  }

  function handleBlur(field) {
    setTouched(t => ({ ...t, [field]: true }));
    const errs = validate({ consumerKey, consumerSecret, userIdField, userIdValue, roles });
    setErrors(errs);
  }

  function handleChange(field, value, setter) {
    setter(value);
    if (touched[field]) {
      const next = { consumerKey, consumerSecret, userIdField, userIdValue, roles, [field]: value };
      setErrors(validate(next));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatusType(null); setStatusMsg('');
    const fields = { consumerKey, consumerSecret, userIdField, userIdValue, roles };
    const allTouched = { consumerKey: true, consumerSecret: true, userIdValue: true };
    setTouched(allTouched);
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (!isValidUrl(LAUNCH_URL)) {
      setStatusType('error'); setStatusMsg('Launch URL is not valid.');
      return;
    }

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
        buildLti10Params({ launchUrl: LAUNCH_URL, consumerKey, consumerSecret, userIdField, userIdValue, roles });

      const ts = new Date().toLocaleTimeString();
      const entryHtml = buildLogEntryHtml(LAUNCH_URL, postParams, { signingKey, baseString, signature }, ts)
        + buildResponsePendingHtml();

      setLogEntries(prev => [entryHtml, ...prev]);
      const parsedUrl = new URL(LAUNCH_URL);
      setStatusType('success');
      setStatusMsg(`Launching to ${parsedUrl.hostname} in a new tab…`);

      // Submit form to new tab
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

      // Fetch for response viewer
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
            <label htmlFor="launch-url-10">Launch URL</label>
            <input
              type="text" id="launch-url-10"
              value={LAUNCH_URL}
              readOnly className="field-locked"
              autoComplete="off" spellCheck="false"
            />
          </div>
          <div className="two-col">
            <div className="field-group">
              <label htmlFor="consumer-key-10">Consumer Key</label>
              <input
                type="text" id="consumer-key-10"
                placeholder="your_consumer_key"
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
              <label htmlFor="consumer-secret-10">Consumer Secret</label>
              <input
                type="password" id="consumer-secret-10"
                placeholder="your_consumer_secret"
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
                    const errs = validate({ consumerKey, consumerSecret, userIdField: val, userIdValue, roles });
                    setErrors(errs);
                  }
                }}
              />
            </div>
            <div className="field-group">
              <label htmlFor="user-id-value-10">ID Value</label>
              <input
                type="text" id="user-id-value-10"
                placeholder="t9447"
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
