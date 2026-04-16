import { useState } from 'react';
import { oauthEncode, hmacSha1Base64 } from '../utils/oauth.js';
import CollapsibleSection from './CollapsibleSection.jsx';

export default function SignatureValidator({ defaultOpen = false }) {
  const [sigUrl, setSigUrl]       = useState('');
  const [rawBody, setRawBody]     = useState('');
  const [sigSecret, setSigSecret] = useState('');
  const [result, setResult]       = useState(null); // { type, html }

  function handleValidate() {
    setResult(null);

    if (!rawBody.trim()) {
      setResult({ type: 'error', msg: 'Please paste a raw POST body to validate.', pre: null });
      return;
    }
    if (!sigUrl.trim()) {
      setResult({ type: 'error', msg: 'Please enter the Launch URL the request was sent to.', pre: null });
      return;
    }
    if (!sigSecret.trim()) {
      setResult({ type: 'error', msg: 'Please enter the consumer secret.', pre: null });
      return;
    }

    let parsedUrl;
    try { parsedUrl = new URL(sigUrl.trim()); }
    catch (_) {
      setResult({ type: 'error', msg: 'Launch URL is not valid.', pre: null });
      return;
    }

    const usp = new URLSearchParams(rawBody.trim());
    const allParams = {};
    for (const [k, v] of usp.entries()) allParams[k] = v;

    const receivedSig = allParams['oauth_signature'];
    if (!receivedSig) {
      setResult({ type: 'error', msg: 'No oauth_signature found in the POST body.', pre: null });
      return;
    }

    const sigParams = Object.assign({}, allParams);
    delete sigParams['oauth_signature'];

    for (const [k, v] of parsedUrl.searchParams.entries()) {
      if (!(k in sigParams)) sigParams[k] = v;
    }

    const normalizedUrl =
      parsedUrl.protocol.toLowerCase() + '//' + parsedUrl.host.toLowerCase() + parsedUrl.pathname;

    const sortedEncoded = Object.entries(sigParams)
      .map(([k, v]) => [oauthEncode(k), oauthEncode(v)])
      .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
    const paramString = sortedEncoded.map(([k, v]) => `${k}=${v}`).join('&');
    const baseString  = 'POST&' + oauthEncode(normalizedUrl) + '&' + oauthEncode(paramString);
    const signingKey  = oauthEncode(sigSecret.trim()) + '&';
    const computedSig = hmacSha1Base64(signingKey, baseString);

    const match = computedSig === receivedSig;

    if (match) {
      setResult({
        type: 'success',
        msg: '\u2713 Signature is valid',
        pre: `signing_key  = ${signingKey}\nbase_string  = ${baseString}`,
      });
    } else {
      setResult({
        type: 'error',
        msg: '\u2717 Signature mismatch',
        pre: `expected     = ${computedSig}\nreceived     = ${receivedSig}\n\nsigning_key  = ${signingKey}\nbase_string  = ${baseString}`,
      });
    }
  }

  return (
    <CollapsibleSection
      title="Signature Validator"
      tag="paste any LTI 1.0 / 1.2 request"
      shaded
      defaultOpen={defaultOpen}
    >
      <div className="field-group">
        <label htmlFor="sig-url">Launch URL</label>
        <input type="text" id="sig-url"
          placeholder="https://sso.app.amiralearning.com/dwe-lti-sso/Launch/lti"
          autoComplete="off" spellCheck="false"
          value={sigUrl} onChange={e => setSigUrl(e.target.value)}
        />
        <div className="hint-text">The URL the POST was sent to (required for signature verification).</div>
      </div>
      <div className="field-group">
        <label htmlFor="sig-raw-body">Raw POST Body</label>
        <textarea id="sig-raw-body" rows="5"
          placeholder={"Paste URL-encoded POST params here\ne.g. oauth_consumer_key=abc&oauth_signature=xyz%3D&lti_version=LTI-1p0&..."}
          style={{ fontFamily: 'monospace', fontSize: '0.75rem', resize: 'vertical' }}
          value={rawBody} onChange={e => setRawBody(e.target.value)}
        />
        <div className="hint-text">Paste the raw URL-encoded POST body from a network capture or LMS log.</div>
      </div>
      <div className="field-group">
        <label htmlFor="sig-secret">Consumer Secret</label>
        <input type="text" id="sig-secret"
          placeholder="The consumer secret used to sign the request"
          autoComplete="off" spellCheck="false"
          value={sigSecret} onChange={e => setSigSecret(e.target.value)}
        />
      </div>
      <div className="launch-section" style={{ paddingTop: 0 }}>
        <button type="button" className="btn-primary" onClick={handleValidate}>
          &#128273;&nbsp; Validate Signature
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
    </CollapsibleSection>
  );
}
