import { useState } from 'react';
import { oauthEncode, hmacSha1Base64 } from '../../utils/oauth.js';

const LAUNCH_URL = 'https://sso.app.amiralearning.com/dwe-lti-sso/Launch/lti';

// ── Platform definitions ────────────────────────────────────────────────────
const PLATFORMS = [
  { value: 'canvas',       label: 'Canvas',            icon: '🖼' },
  { value: 'schoology',    label: 'Schoology',          icon: '📚' },
  { value: 'classlink',    label: 'ClassLink',          icon: '🔗' },
  { value: 'clever',       label: 'Clever',             icon: '🧠' },
  { value: 'blackboard',   label: 'Blackboard',         icon: '📋' },
  { value: 'moodle',       label: 'Moodle',             icon: '🎓' },
  { value: 'powerschool',  label: 'PowerSchool',        icon: '⚡' },
  { value: 'generic',      label: 'Other LMS',          icon: '🌐' },
];

function buildConfig(platform, key, secret) {
  switch (platform) {
    case 'canvas':
      return `<?xml version="1.0" encoding="UTF-8"?>
<cartridge_basiclti_link
  xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0"
  xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0"
  xmlns:lticm="http://www.imsglobal.org/xsd/imslticm_v1p0"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <blti:title>Amira Learning</blti:title>
  <blti:description>Amira Learning LTI Integration</blti:description>
  <blti:launch_url>${LAUNCH_URL}</blti:launch_url>
  <blti:extensions platform="canvas.instructure.com">
    <lticm:property name="tool_id">amira_learning</lticm:property>
    <lticm:property name="privacy_level">public</lticm:property>
    <lticm:property name="domain">sso.app.amiralearning.com</lticm:property>
  </blti:extensions>
</cartridge_basiclti_link>`;
    case 'schoology':
      return `Tool Name:        Amira Learning\nConsumer Key:     ${key}\nConsumer Secret:  ${secret}\nLaunch URL:       ${LAUNCH_URL}\nPrivacy:          Send Name and Email/Username`;
    case 'classlink':
      return `Tool Name:        Amira Learning\nConsumer Key:     ${key}\nShared Secret:    ${secret}\nLaunch URL:       ${LAUNCH_URL}\nLTI Version:      LTI 1.1\nPrivacy:          Share name and email`;
    case 'clever':
      return `⚠  Clever uses its own SSO protocol — not standard LTI.\n\nAmira integrates with Clever via Instant Login, not a consumer\nkey/secret. The key and secret fields above do not apply here.\n\nFor Clever setup, contact Amira support to enable the Clever\nintegration for this district.`;
    case 'blackboard':
      return `Provider Domain:      sso.app.amiralearning.com\nTool Provider Key:    ${key}\nTool Provider Secret: ${secret}\nLaunch URL:           ${LAUNCH_URL}\nSend User Data:       Send user data only over SSL\nUser Fields:          Role in Course, Name, Email Address`;
    case 'moodle':
      return `Tool Name:        Amira Learning\nTool URL:         ${LAUNCH_URL}\nConsumer Key:     ${key}\nShared Secret:    ${secret}\nDefault Container: New Window\nShare Name:       Always\nShare Email:      Always`;
    case 'powerschool':
      return `App Name:         Amira Learning\nConsumer Key:     ${key}\nConsumer Secret:  ${secret}\nLaunch URL:       ${LAUNCH_URL}\nShare User Data:  Yes`;
    default:
      return `Launch URL:       ${LAUNCH_URL}\nConsumer Key:     ${key}\nConsumer Secret:  ${secret}\nLTI Version:      LTI 1.1 (OAuth 1.0 / HMAC-SHA1)\nPrivacy:          Send name and email`;
  }
}

function getNote(platform, key) {
  switch (platform) {
    case 'canvas':
      return `Paste this XML into Canvas → Admin → Developer Keys → + LTI Key → Paste XML. Enter the Consumer Key (${key || '{KEY}'}) and Consumer Secret separately in the tool configuration.`;
    case 'schoology':
      return 'In Schoology: App Center → Add App → External Learning Tools → Add External Tool Provider.';
    case 'classlink':
      return 'In ClassLink: Admin Console → App Library → Add Custom App → LTI 1.1.';
    case 'blackboard':
      return 'In Blackboard: Admin Panel → Building Blocks → LTI Tool Providers → Register Provider Domain.';
    case 'moodle':
      return 'In Moodle: Site Administration → Plugins → Activity Modules → External Tool → Manage Tools → Add preconfigured tool.';
    case 'powerschool':
      return 'In PowerSchool Learning: School Settings → Apps → LTI Apps → Add App.';
    case 'clever':
      return null;
    default:
      return "Enter these values in your LMS's external tool / LTI configuration.";
  }
}

// ── Signature Validator ─────────────────────────────────────────────────────
function SignatureValidatorTool() {
  const [sigUrl, setSigUrl]       = useState('');
  const [rawBody, setRawBody]     = useState('');
  const [sigSecret, setSigSecret] = useState('');
  const [result, setResult]       = useState(null);

  function handleValidate() {
    setResult(null);
    if (!rawBody.trim())   return setResult({ type: 'error', msg: 'Paste a raw POST body to validate.', pre: null });
    if (!sigUrl.trim())    return setResult({ type: 'error', msg: 'Enter the Launch URL the request was sent to.', pre: null });
    if (!sigSecret.trim()) return setResult({ type: 'error', msg: 'Enter the consumer secret.', pre: null });

    let parsedUrl;
    try { parsedUrl = new URL(sigUrl.trim()); }
    catch (_) { return setResult({ type: 'error', msg: 'Launch URL is not valid.', pre: null }); }

    const usp = new URLSearchParams(rawBody.trim());
    const allParams = {};
    for (const [k, v] of usp.entries()) allParams[k] = v;

    const receivedSig = allParams['oauth_signature'];
    if (!receivedSig) return setResult({ type: 'error', msg: 'No oauth_signature found in the POST body.', pre: null });

    const sigParams = { ...allParams };
    delete sigParams['oauth_signature'];
    for (const [k, v] of parsedUrl.searchParams.entries()) {
      if (!(k in sigParams)) sigParams[k] = v;
    }

    const normalizedUrl = parsedUrl.protocol.toLowerCase() + '//' + parsedUrl.host.toLowerCase() + parsedUrl.pathname;
    const sortedEncoded = Object.entries(sigParams)
      .map(([k, v]) => [oauthEncode(k), oauthEncode(v)])
      .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
    const paramString = sortedEncoded.map(([k, v]) => `${k}=${v}`).join('&');
    const baseString  = 'POST&' + oauthEncode(normalizedUrl) + '&' + oauthEncode(paramString);
    const signingKey  = oauthEncode(sigSecret.trim()) + '&';
    const computedSig = hmacSha1Base64(signingKey, baseString);
    const match       = computedSig === receivedSig;

    setResult(match
      ? { type: 'success', msg: '✓ Signature is valid', pre: `signing_key  = ${signingKey}\nbase_string  = ${baseString}` }
      : { type: 'error',   msg: '✗ Signature mismatch', pre: `expected     = ${computedSig}\nreceived     = ${receivedSig}\n\nsigning_key  = ${signingKey}\nbase_string  = ${baseString}` }
    );
  }

  return (
    <div className="tool-card">
      <div className="tool-card-header">
        <div className="tool-card-icon">🔏</div>
        <div>
          <div className="tool-card-title">Signature Validator</div>
          <div className="tool-card-desc">
            Verify whether a failing LTI launch has a valid OAuth signature. Paste the raw POST body from a network capture and check if the signature matches.
          </div>
        </div>
      </div>

      <div className="tool-guidance">
        <div className="tool-guidance-title">How to capture the POST body</div>
        <ol className="tool-guidance-steps">
          <li>Open the LMS in Chrome and press <kbd>F12</kbd> to open DevTools</li>
          <li>Go to the <strong>Network</strong> tab and check <strong>Preserve log</strong></li>
          <li>Trigger the LTI launch from the LMS (click the Amira link/assignment)</li>
          <li>Find the <strong>POST</strong> request to <code>sso.app.amiralearning.com</code></li>
          <li>Click it → <strong>Payload</strong> tab → copy everything under <em>Form Data (view source)</em></li>
        </ol>
      </div>

      <div className="tool-card-body">
        <div className="field-group">
          <label htmlFor="sig-url">Launch URL</label>
          <input type="text" id="sig-url"
            placeholder="https://sso.app.amiralearning.com/dwe-lti-sso/Launch/lti"
            autoComplete="off" spellCheck="false"
            value={sigUrl} onChange={e => setSigUrl(e.target.value)}
          />
          <div className="hint-text">The URL the POST was sent to — visible in the Network tab request URL.</div>
        </div>
        <div className="field-group">
          <label htmlFor="sig-raw-body">Raw POST Body</label>
          <textarea id="sig-raw-body" rows="5"
            placeholder={"oauth_consumer_key=abc&oauth_signature=xyz%3D&lti_version=LTI-1p0&roles=Learner&..."}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', resize: 'vertical' }}
            value={rawBody} onChange={e => setRawBody(e.target.value)}
          />
          <div className="hint-text">Paste the URL-encoded form data exactly as copied from DevTools Payload tab.</div>
        </div>
        <div className="field-group">
          <label htmlFor="sig-secret">Consumer Secret</label>
          <input type="text" id="sig-secret"
            placeholder="The consumer secret Amira provided"
            autoComplete="off" spellCheck="false"
            value={sigSecret} onChange={e => setSigSecret(e.target.value)}
          />
          <div className="hint-text">Found in Amira Admin → SSO Settings for the district.</div>
        </div>
        <div className="launch-section" style={{ paddingTop: 0 }}>
          <button type="button" className="btn-primary" onClick={handleValidate}>
            🔑&nbsp; Validate Signature
          </button>
        </div>
        {result && (
          <div style={{ margin: '0 28px 20px' }}>
            <div className={`status-bar ${result.type}`}>
              <strong>{result.msg}</strong>
              {result.pre && <pre>{result.pre}</pre>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── LMS Config Generator ────────────────────────────────────────────────────
function LmsConfigTool() {
  const [consumerKey, setConsumerKey]     = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [platform, setPlatform]           = useState('canvas');
  const [output, setOutput]               = useState(null);
  const [copied, setCopied]               = useState(false);

  function handleGenerate() {
    const config = buildConfig(platform, consumerKey || '{KEY}', consumerSecret || '{SECRET}');
    setOutput({ platform, config, note: getNote(platform, consumerKey) });
    setCopied(false);
  }

  function handleCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output.config).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="tool-card">
      <div className="tool-card-header">
        <div className="tool-card-icon">⚙️</div>
        <div>
          <div className="tool-card-title">LMS Config Generator</div>
          <div className="tool-card-desc">
            Generate the exact configuration snippet to paste into any LMS when setting up a new Amira LTI integration.
          </div>
        </div>
      </div>

      <div className="tool-guidance">
        <div className="tool-guidance-title">Where to find the credentials</div>
        <ol className="tool-guidance-steps">
          <li>Log in to <strong>Amira Admin</strong> at <code>secure.app.amiralearning.com</code></li>
          <li>Go to <strong>Domains → SSO Settings → [District]</strong></li>
          <li>Copy the <strong>Consumer Key</strong> and <strong>Consumer Secret</strong> shown there</li>
          <li>Select the LMS platform below and click <strong>Generate Config</strong></li>
        </ol>
      </div>

      <div className="tool-card-body">
        <div className="two-col" style={{ marginBottom: 16 }}>
          <div className="field-group" style={{ marginBottom: 0 }}>
            <label htmlFor="lcg-key">Consumer Key</label>
            <input id="lcg-key" type="text" placeholder="admin.1000243642.ia"
              autoComplete="off" spellCheck="false"
              value={consumerKey} onChange={e => setConsumerKey(e.target.value)} />
          </div>
          <div className="field-group" style={{ marginBottom: 0 }}>
            <label htmlFor="lcg-secret">Consumer Secret</label>
            <input id="lcg-secret" type="password" placeholder="your_consumer_secret"
              value={consumerSecret} onChange={e => setConsumerSecret(e.target.value)} />
          </div>
        </div>

        <div className="field-group">
          <label>LMS Platform</label>
          <div className="platform-grid">
            {PLATFORMS.map(p => (
              <button
                key={p.value}
                type="button"
                className={`platform-card${platform === p.value ? ' active' : ''}`}
                onClick={() => { setPlatform(p.value); setOutput(null); }}
              >
                <span className="platform-icon">{p.icon}</span>
                <span className="platform-label">{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="launch-section" style={{ paddingTop: 0 }}>
          <button type="button" className="btn-primary" onClick={handleGenerate}>
            ⚙️&nbsp; Generate Config
          </button>
        </div>

        {output && (
          <div style={{ margin: '0 28px 20px' }}>
            <div className="config-output">
              <div className="config-output-header">
                <span>{PLATFORMS.find(p => p.value === output.platform)?.label ?? output.platform}</span>
                <button className={`btn-copy-log${copied ? ' copied' : ''}`} onClick={handleCopy}>
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <pre className="config-output-body">{output.config}</pre>
              {output.note && <div className="config-note">{output.note}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Tools Tab ───────────────────────────────────────────────────────────────
const TOOL_VIEWS = [
  {
    id: 'validator',
    label: '🔏 Signature Validator',
    tag: 'Debug a failing launch',
  },
  {
    id: 'config',
    label: '⚙️ LMS Config Generator',
    tag: 'Set up a new integration',
  },
];

export default function ToolsTab() {
  const [view, setView] = useState('validator');
  const active = TOOL_VIEWS.find(v => v.id === view);

  return (
    <div className="tab-content active">
      {/* Sub-navigation */}
      <div className="tools-subnav">
        {TOOL_VIEWS.map(v => (
          <button
            key={v.id}
            className={`tools-subnav-btn${view === v.id ? ' active' : ''}`}
            onClick={() => setView(v.id)}
          >
            <span className="tools-subnav-label">{v.label}</span>
            <span className="tools-subnav-tag">{v.tag}</span>
          </button>
        ))}
      </div>

      {/* Active tool */}
      <div className="tool-view" key={view}>
        {view === 'validator' && <SignatureValidatorTool />}
        {view === 'config'    && <LmsConfigTool />}
      </div>
    </div>
  );
}
