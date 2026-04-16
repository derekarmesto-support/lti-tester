// LTI Launch Tester — Amira Learning
// ── Utilities ──────────────────────────────────────────────────────────────────

function oauthEncode(str) {
  return encodeURIComponent(String(str))
    .replace(/!/g,  '%21').replace(/'/g,  '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

function generateNonce() {
  const buf = new Uint8Array(18);
  crypto.getRandomValues(buf);
  return Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
}

function generateUUID() {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  buf[6] = (buf[6] & 0x0f) | 0x40;
  buf[8] = (buf[8] & 0x3f) | 0x80;
  const h = Array.from(buf, b => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}

function base64urlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  return base64urlEncodeBytes(bytes);
}

function base64urlEncodeBytes(bytes) {
  let b = '';
  bytes.forEach(byte => b += String.fromCharCode(byte));
  return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Pure-JS SHA-1 / HMAC-SHA1 ─────────────────────────────────────────────────

function _sha1(msgBytes) {
  let h0=0x67452301,h1=0xEFCDAB89,h2=0x98BADCFE,h3=0x10325476,h4=0xC3D2E1F0;
  const len=msgBytes.length,bitLen=len*8;
  const padLen=((len%64)<56)?(56-len%64):(120-len%64);
  const padded=new Uint8Array(len+padLen+8);
  padded.set(msgBytes); padded[len]=0x80;
  const dv=new DataView(padded.buffer);
  dv.setUint32(padded.length-8,Math.floor(bitLen/0x100000000)>>>0,false);
  dv.setUint32(padded.length-4,bitLen>>>0,false);
  const rotl=(x,n)=>((x<<n)|(x>>>(32-n)))>>>0;
  const w=new Uint32Array(80);
  for(let off=0;off<padded.length;off+=64){
    const blk=new DataView(padded.buffer,off,64);
    for(let i=0;i<16;i++)w[i]=blk.getUint32(i*4,false);
    for(let i=16;i<80;i++)w[i]=rotl(w[i-3]^w[i-8]^w[i-14]^w[i-16],1);
    let a=h0,b=h1,c=h2,d=h3,e=h4;
    for(let i=0;i<80;i++){
      let f,k;
      if(i<20){f=((b&c)|(~b&d))>>>0;k=0x5A827999;}
      else if(i<40){f=(b^c^d)>>>0;k=0x6ED9EBA1;}
      else if(i<60){f=((b&c)|(b&d)|(c&d))>>>0;k=0x8F1BBCDC;}
      else{f=(b^c^d)>>>0;k=0xCA62C1D6;}
      const tmp=(rotl(a,5)+f+e+k+w[i])>>>0;
      e=d;d=c;c=rotl(b,30);b=a;a=tmp;
    }
    h0=(h0+a)>>>0;h1=(h1+b)>>>0;h2=(h2+c)>>>0;h3=(h3+d)>>>0;h4=(h4+e)>>>0;
  }
  const out=new Uint8Array(20),ov=new DataView(out.buffer);
  ov.setUint32(0,h0,false);ov.setUint32(4,h1,false);
  ov.setUint32(8,h2,false);ov.setUint32(12,h3,false);
  ov.setUint32(16,h4,false);
  return out;
}

function hmacSha1Base64(key, message) {
  const enc=new TextEncoder();
  let kb=enc.encode(key);
  const mb=enc.encode(message),B=64;
  if(kb.length>B)kb=_sha1(kb);
  const k=new Uint8Array(B);k.set(kb);
  const ipad=new Uint8Array(B),opad=new Uint8Array(B);
  for(let i=0;i<B;i++){ipad[i]=k[i]^0x36;opad[i]=k[i]^0x5C;}
  const inner=new Uint8Array(B+mb.length);
  inner.set(ipad);inner.set(mb,B);
  const ih=_sha1(inner);
  const outer=new Uint8Array(B+20);
  outer.set(opad);outer.set(ih,B);
  return btoa(String.fromCharCode(..._sha1(outer)));
}

// ── Tab Switching ──────────────────────────────────────────────────────────────

document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const href = tab.getAttribute('href') || '';
    const target = href.replace('#', '');
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    if (target) document.getElementById(target).classList.add('active');
  });
});

// ── Inline Validation ──────────────────────────────────────────────────────────

function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch (_) { return false; }
}

function isValidEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

const VALIDATORS = {
  url: (val, label) => {
    if (!val) return `${label} is required.`;
    if (!isValidUrl(val)) return `Must be a valid URL starting with https://`;
    return null;
  },
  required: (val, label) => {
    if (!val.trim()) return `${label} is required.`;
    return null;
  },
  userid: (val, label, input) => {
    if (!val.trim()) return `${label} is required.`;
    const form = input.closest('.tab-content, form');
    const sel = form && (form.querySelector('[id^="user-id-field"]'));
    if (sel && sel.value === 'lis_person_contact_email_primary' && !isValidEmail(val)) {
      return 'Looks like an invalid email address.';
    }
    return null;
  },
};

function validateInput(input) {
  const vtype = input.dataset.validate;
  if (!vtype) return true;
  const label = input.dataset.label || 'This field';
  const val   = input.value;
  const hintId = 'hint-' + input.id;
  const hintEl = document.getElementById(hintId);
  const error = VALIDATORS[vtype] ? VALIDATORS[vtype](val, label, input) : null;
  if (error) {
    input.classList.add('field-invalid');
    input.classList.remove('field-valid');
    if (hintEl) { hintEl.textContent = error; hintEl.classList.add('visible'); }
    return false;
  } else {
    input.classList.remove('field-invalid');
    if (val.trim()) input.classList.add('field-valid');
    if (hintEl) { hintEl.textContent = ''; hintEl.classList.remove('visible'); }
    return true;
  }
}

document.querySelectorAll('input[data-validate]').forEach(input => {
  let touched = false;
  input.addEventListener('blur', () => { touched = true; validateInput(input); });
  input.addEventListener('input', () => { if (touched) validateInput(input); });
});

['user-id-field', 'user-id-field-12', 'user-id-field-13'].forEach(selId => {
  const sel = document.getElementById(selId);
  if (!sel) return;
  sel.addEventListener('change', () => {
    const suffix = selId.endsWith('-13') ? '-13' : selId.endsWith('-12') ? '-12' : '';
    const valInput = document.getElementById('user-id-value' + suffix);
    if (valInput && valInput.classList.contains('field-invalid')) validateInput(valInput);
  });
});

// ── Status helpers ─────────────────────────────────────────────────────────────

function setStatus(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'message ' + type;
  el.textContent = text;
}

function clearStatus(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = 'message';
  el.textContent = '';
}

// ── LTI 1.0 Log ───────────────────────────────────────────────────────────────

function buildLogEntry(postUrl, postParams, meta, ts) {
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

function showLog(sectionId, boxId, postUrl, postParams, meta) {
  const section = document.getElementById(sectionId);
  const box     = document.getElementById(boxId);
  const entry   = buildLogEntry(postUrl, postParams, meta, new Date().toLocaleTimeString());

  // Build a wrapper span for this log entry so we can append a response div inside it
  const entryWrapper = document.createElement('span');
  entryWrapper.innerHTML = entry;

  // Response placeholder div (updated in place by fetchResponse)
  const responseDiv = document.createElement('div');
  responseDiv.className = 'log-response';
  responseDiv.innerHTML = '\n\n<span class="log-key">── Response ────────────────────────────────</span>\n  <span class="log-dim">⏳ Awaiting response...</span>';
  entryWrapper.appendChild(responseDiv);

  if (box.firstChild) {
    const sep = document.createTextNode('\n\n');
    box.insertBefore(sep, box.firstChild);
    box.insertBefore(entryWrapper, sep);
  } else {
    box.appendChild(entryWrapper);
  }
  section.classList.add('visible');
  return responseDiv;
}

document.getElementById('log-clear-10').addEventListener('click', () => {
  document.getElementById('log-box-10').innerHTML = '';
  document.getElementById('log-section-10').classList.remove('visible');
});

document.getElementById('log-clear-12').addEventListener('click', () => {
  document.getElementById('log-box-12').innerHTML = '';
  document.getElementById('log-section-12').classList.remove('visible');
});

document.getElementById('log-copy-10').addEventListener('click', function () {
  const text = document.getElementById('log-box-10').innerText;
  navigator.clipboard.writeText(text).then(() => {
    this.textContent = 'Copied!';
    setTimeout(() => { this.textContent = 'Copy'; }, 1500);
  });
});

document.getElementById('log-copy-12').addEventListener('click', function () {
  const text = document.getElementById('log-box-12').innerText;
  navigator.clipboard.writeText(text).then(() => {
    this.textContent = 'Copied!';
    setTimeout(() => { this.textContent = 'Copy'; }, 1500);
  });
});

// ── Shared LTI 1.0/1.2 POST helper ────────────────────────────────────────────

function postLtiForm(launchUrl, postParams, btn, originalLabel, tabName) {
  const form = document.createElement('form');
  form.method = 'POST'; form.action = launchUrl; form.target = tabName || '_blank';
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
  btn.disabled = false;
  btn.innerHTML = originalLabel;
}

// ── Fetch response info (in addition to form.submit) ─────────────────────────

function fetchResponse(launchUrl, postParams, responseDiv) {
  fetch(launchUrl, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(postParams).toString()
  })
  .then(res => {
    responseDiv.innerHTML =
      '\n\n<span class="log-key">── Response ────────────────────────────────</span>\n' +
      `  <span class="log-key">status</span><span class="log-sep"> = </span><span class="log-val">${res.status} ${res.statusText}</span>\n` +
      `  <span class="log-key">final_url</span><span class="log-sep"> = </span><span class="log-url">${res.url || launchUrl}</span>\n` +
      `<span class="log-sep">────────────────────────────────────────────</span>`;
  })
  .catch(() => {
    responseDiv.innerHTML =
      '\n\n<span class="log-key">── Response ────────────────────────────────</span>\n' +
      `  <span class="log-dim">⚠ Response blocked by browser CORS policy — check the opened tab</span>\n` +
      `<span class="log-sep">────────────────────────────────────────────</span>`;
  });
}

// ── LTI 1.0 Launch ────────────────────────────────────────────────────────────

document.getElementById('launch-form-10').addEventListener('submit', (e) => {
  e.preventDefault();
  clearStatus('status-msg-10');

  const inputs = document.querySelectorAll('#tab-lti10 input[data-validate]');
  let allValid = true;
  inputs.forEach(inp => { if (!validateInput(inp)) allValid = false; });
  if (!allValid) return;

  const launchUrl      = document.getElementById('launch-url').value.trim();
  const consumerKey    = document.getElementById('consumer-key').value.trim();
  const consumerSecret = document.getElementById('consumer-secret').value.trim();
  const userIdField    = document.getElementById('user-id-field').value;
  const userIdValue    = document.getElementById('user-id-value').value.trim();
  const roles          = document.getElementById('roles').value;

  let parsedUrl;
  try { parsedUrl = new URL(launchUrl); }
  catch (_) { return setStatus('status-msg-10', 'error', 'Launch URL is not valid.'); }

  const tabName = 'lti_launch_' + Date.now();
  let newTab;
  try { newTab = window.open('about:blank', tabName); } catch(_) {}
  if (!newTab) {
    return setStatus('status-msg-10', 'error', 'Pop-ups are blocked. Please allow pop-ups for this page, or open the tester directly in its own tab.');
  }

  const btn = document.getElementById('submit-btn-10');
  btn.disabled = true; btn.textContent = 'Signing…';

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = generateNonce();
    const resourceLinkId = generateUUID();
    const normalizedUrl = parsedUrl.protocol.toLowerCase() + '//' + parsedUrl.host.toLowerCase() + parsedUrl.pathname;

    const params = {};
    for (const [k, v] of parsedUrl.searchParams.entries()) params[k] = v;
    params['lti_message_type']       = 'basic-lti-launch-request';
    params['lti_version']            = 'LTI-1p0';
    params['resource_link_id']       = resourceLinkId;
    params['oauth_consumer_key']     = consumerKey;
    params['oauth_nonce']            = nonce;
    params['oauth_signature_method'] = 'HMAC-SHA1';
    params['oauth_timestamp']        = timestamp;
    params['oauth_version']          = '1.0';
    params['user_id']                = userIdValue;
    if (userIdField !== 'user_id') params[userIdField] = userIdValue;
    params['roles'] = roles;

    const sortedEncoded = Object.entries(params)
      .map(([k, v]) => [oauthEncode(k), oauthEncode(v)])
      .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
    const paramString = sortedEncoded.map(([k, v]) => `${k}=${v}`).join('&');
    const baseString  = 'POST&' + oauthEncode(normalizedUrl) + '&' + oauthEncode(paramString);
    const signingKey  = oauthEncode(consumerSecret) + '&';
    const signature   = hmacSha1Base64(signingKey, baseString);
    const postParams  = Object.assign({}, params, { oauth_signature: signature });

    const responseDiv10 = showLog('log-section-10', 'log-box-10', launchUrl, postParams, { signingKey, baseString, signature });
    setStatus('status-msg-10', 'success', `Launching to ${parsedUrl.hostname} in a new tab…`);
    postLtiForm(launchUrl, postParams, btn, '&#9658;&nbsp; Launch LTI Tool', tabName);
    fetchResponse(launchUrl, postParams, responseDiv10);
  } catch (err) {
    if (newTab) newTab.close();
    setStatus('status-msg-10', 'error', 'Signature error: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = '&#9658;&nbsp; Launch LTI Tool';
  }
});

// ── Collapsible sections ──────────────────────────────────────────────────────

document.getElementById('context-toggle-12').addEventListener('click', function () {
  this.classList.toggle('open');
  document.getElementById('context-body-12').classList.toggle('open');
});

// ── LTI 1.2 — Response Format toggle ─────────────────────────────────────────

document.getElementById('response-format-12').addEventListener('change', function () {
  document.getElementById('outcomes-url-group-12').style.display =
    this.value === 'xml' ? 'block' : 'none';
});

// ── LTI 1.2 Launch ────────────────────────────────────────────────────────────

document.getElementById('launch-form-12').addEventListener('submit', (e) => {
  e.preventDefault();
  clearStatus('status-msg-12');

  const inputs = document.querySelectorAll('#tab-lti12 input[data-validate]');
  let allValid = true;
  inputs.forEach(inp => { if (!validateInput(inp)) allValid = false; });
  if (!allValid) return;

  const launchUrl      = document.getElementById('launch-url-12').value.trim();
  const consumerKey    = document.getElementById('consumer-key-12').value.trim();
  const consumerSecret = document.getElementById('consumer-secret-12').value.trim();
  const userIdField    = document.getElementById('user-id-field-12').value;
  const userIdValue    = document.getElementById('user-id-value-12').value.trim();
  const roles          = document.getElementById('roles-12').value;
  const givenName      = document.getElementById('person-name-given-12').value.trim();
  const familyName     = document.getElementById('person-name-family-12').value.trim();
  const contextId      = document.getElementById('context-id-12').value.trim();
  const contextLabel   = document.getElementById('context-label-12').value.trim();
  const contextTitle   = document.getElementById('context-title-12').value.trim();
  const tcGuid         = document.getElementById('tc-guid-12').value.trim();
  const tcPlatform     = document.getElementById('tc-platform-12').value;
  const responseFormat = document.getElementById('response-format-12').value;
  const outcomesUrl    = document.getElementById('outcomes-url-12').value.trim();

  let parsedUrl;
  try { parsedUrl = new URL(launchUrl); }
  catch (_) { return setStatus('status-msg-12', 'error', 'Launch URL is not valid.'); }

  const tabName = 'lti_launch_' + Date.now();
  let newTab;
  try { newTab = window.open('about:blank', tabName); } catch(_) {}
  if (!newTab) {
    return setStatus('status-msg-12', 'error', 'Pop-ups are blocked. Please allow pop-ups for this page, or open the tester directly in its own tab.');
  }

  const btn = document.getElementById('submit-btn-12');
  btn.disabled = true; btn.textContent = 'Signing…';

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = generateNonce();
    const resourceLinkId = generateUUID();
    const normalizedUrl = parsedUrl.protocol.toLowerCase() + '//' + parsedUrl.host.toLowerCase() + parsedUrl.pathname;

    const params = {};
    for (const [k, v] of parsedUrl.searchParams.entries()) params[k] = v;
    params['lti_message_type']       = 'basic-lti-launch-request';
    params['lti_version']            = 'LTI-1p0';
    params['resource_link_id']       = resourceLinkId;
    params['oauth_consumer_key']     = consumerKey;
    params['oauth_nonce']            = nonce;
    params['oauth_signature_method'] = 'HMAC-SHA1';
    params['oauth_timestamp']        = timestamp;
    params['oauth_version']          = '1.0';
    params['user_id']                = userIdValue;
    if (userIdField !== 'user_id') params[userIdField] = userIdValue;
    params['roles'] = roles;

    if (givenName)  params['lis_person_name_given']  = givenName;
    if (familyName) params['lis_person_name_family'] = familyName;
    if (givenName && familyName) params['lis_person_name_full'] = givenName + ' ' + familyName;
    if (contextId)    params['context_id']    = contextId;
    if (contextLabel) params['context_label'] = contextLabel;
    if (contextTitle) params['context_title'] = contextTitle;
    if (contextId)    params['context_type']  = 'CourseSection';
    if (tcGuid)     params['tool_consumer_instance_guid'] = tcGuid;
    if (tcPlatform) params['tool_consumer_info_product_family_code'] = tcPlatform;
    if (responseFormat === 'xml') {
      params['lis_result_sourcedid'] = generateUUID();
      if (outcomesUrl) params['lis_outcome_service_url'] = outcomesUrl;
    }

    const sortedEncoded = Object.entries(params)
      .map(([k, v]) => [oauthEncode(k), oauthEncode(v)])
      .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
    const paramString = sortedEncoded.map(([k, v]) => `${k}=${v}`).join('&');
    const baseString  = 'POST&' + oauthEncode(normalizedUrl) + '&' + oauthEncode(paramString);
    const signingKey  = oauthEncode(consumerSecret) + '&';
    const signature   = hmacSha1Base64(signingKey, baseString);
    const postParams  = Object.assign({}, params, { oauth_signature: signature });

    const responseDiv12 = showLog('log-section-12', 'log-box-12', launchUrl, postParams, { signingKey, baseString, signature });
    setStatus('status-msg-12', 'success', `Launching to ${parsedUrl.hostname} in a new tab…`);
    postLtiForm(launchUrl, postParams, btn, '&#9658;&nbsp; Launch LTI Tool', tabName);
    fetchResponse(launchUrl, postParams, responseDiv12);
  } catch (err) {
    if (newTab) newTab.close();
    setStatus('status-msg-12', 'error', 'Signature error: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = '&#9658;&nbsp; Launch LTI Tool';
  }
});

// ── LTI 1.3 — Key Management ──────────────────────────────────────────────────

let lti13KeyPair = null;
let scriptUrl    = '';

if (typeof google !== 'undefined' && google.script) {
  google.script.run
    .withSuccessHandler(url => {
      scriptUrl = url;
      document.getElementById('issuer-id').value = url;
      const display = document.getElementById('jwks-url-display');
      if (display.textContent === '—') display.textContent = url + '?action=jwks';
    })
    .withFailureHandler(() => {})
    .getScriptUrl();
}

function setKeyStatus(type, text) {
  const el  = document.getElementById('key-status');
  const txt = document.getElementById('key-status-text');
  el.className    = 'key-status ' + type;
  txt.textContent = text;
}

document.getElementById('btn-generate-keys').addEventListener('click', async () => {
  const btn = document.getElementById('btn-generate-keys');
  btn.disabled = true; btn.textContent = '⏳ Generating…';
  setKeyStatus('working', 'Generating 2048-bit RSA key pair…');

  try {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' },
      true, ['sign', 'verify']
    );
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);
    const publicKeyJwk  = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const kid = 'lti-key-' + Date.now();
    privateKeyJwk.kid = kid; publicKeyJwk.kid = kid;
    const publicJwks = JSON.stringify({ keys: [{ ...publicKeyJwk, use: 'sig', alg: 'RS256' }] });
    lti13KeyPair = { privateKeyJwk, publicKeyJwk, publicJwks, kid };
    sessionStorage.setItem('lti13_private_key', JSON.stringify(privateKeyJwk));
    setKeyStatus('ready', 'Key pair ready. Public key staged for server.');
    const jwksUrl = (scriptUrl || document.getElementById('issuer-id').value.trim()) + '?action=jwks';
    document.getElementById('jwks-url-display').textContent = jwksUrl;
    document.getElementById('jwks-row-wrapper').style.display = 'block';
    document.getElementById('btn-save-jwks').style.display = 'inline-flex';
    btn.disabled = false; btn.textContent = '⚙ Regenerate Key Pair';
  } catch (err) {
    setKeyStatus('none', 'Key generation failed: ' + err.message);
    btn.disabled = false; btn.textContent = '⚙ Generate New Key Pair';
  }
});

document.getElementById('btn-save-jwks').addEventListener('click', () => {
  if (!lti13KeyPair) return;
  const saveBtn = document.getElementById('btn-save-jwks');
  saveBtn.disabled = true; saveBtn.textContent = '⏳ Saving…';
  if (typeof google !== 'undefined' && google.script) {
    google.script.run
      .withSuccessHandler(() => {
        setKeyStatus('ready', '✓ Public key saved to server. Amira can now verify your JWTs.');
        saveBtn.disabled = false; saveBtn.textContent = '✓ Saved';
      })
      .withFailureHandler(err => {
        setKeyStatus('ready', 'Save failed: ' + (err.message || err));
        saveBtn.disabled = false; saveBtn.textContent = '☁ Save Public Key to Server';
      })
      .saveJwks(lti13KeyPair.publicJwks);
  } else {
    setKeyStatus('ready', 'Not running in Apps Script — key save skipped.');
    saveBtn.disabled = false;
  }
});

document.getElementById('btn-copy-jwks').addEventListener('click', () => {
  const url = document.getElementById('jwks-url-display').textContent;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById('btn-copy-jwks');
    btn.textContent = 'Copied!'; btn.classList.add('copied');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
  });
});

// ── LTI 1.3 Log ───────────────────────────────────────────────────────────────

function showLog13(lines) {
  const section = document.getElementById('log-section-13');
  const box     = document.getElementById('log-box-13');
  const ts = new Date().toLocaleTimeString();
  const entry = [`<span class="log-head">▶ OIDC Initiation  ${ts}</span>`, ...lines].join('\n');
  box.innerHTML = entry + (box.innerHTML ? '\n\n' + box.innerHTML : '');
  section.classList.add('visible');
}

document.getElementById('log-clear-13').addEventListener('click', () => {
  document.getElementById('log-box-13').innerHTML = '';
  document.getElementById('log-section-13').classList.remove('visible');
});

// ── LTI 1.3 Launch ────────────────────────────────────────────────────────────

document.getElementById('launch-btn-13').addEventListener('click', async () => {
  clearStatus('status-msg-13');

  const inputs = document.querySelectorAll('#tab-lti13 input[data-validate]');
  let allValid = true;
  inputs.forEach(inp => { if (!validateInput(inp)) allValid = false; });
  if (!allValid) return;

  if (!lti13KeyPair) {
    return setStatus('status-msg-13', 'error', 'Generate and save an RSA key pair before launching.');
  }

  const initUrl        = document.getElementById('init-url').value.trim();
  const clientId       = document.getElementById('client-id').value.trim();
  const deploymentId   = document.getElementById('deployment-id').value.trim();
  const issuerId       = document.getElementById('issuer-id').value.trim();
  const userIdField    = document.getElementById('user-id-field-13').value;
  const userIdValue    = document.getElementById('user-id-value-13').value.trim();
  const roles          = document.getElementById('roles-13').value;
  const targetLinkUri  = document.getElementById('target-link-uri-13').value.trim() || initUrl;
  const ltiMessageHint = document.getElementById('lti-message-hint-13').value.trim();
  const authCallback   = (scriptUrl || issuerId) + '?action=auth';

  let resourceLinkId = document.getElementById('resource-link-id-13').value.trim();
  if (!resourceLinkId) resourceLinkId = generateUUID();

  const launchParams = {
    issuerId, clientId, deploymentId,
    userId: userIdValue, userIdField,
    role: roles, resourceLinkId,
    targetLinkUri, keyId: lti13KeyPair.kid,
  };
  sessionStorage.setItem('lti13_launch_params', JSON.stringify(launchParams));
  sessionStorage.setItem('lti13_private_key',   JSON.stringify(lti13KeyPair.privateKeyJwk));

  const oidcParams = {
    iss:               issuerId,
    login_hint:        userIdValue,
    target_link_uri:   targetLinkUri,
    lti_deployment_id: deploymentId,
    client_id:         clientId,
    redirect_uri:      authCallback,
  };
  if (ltiMessageHint) oidcParams['lti_message_hint'] = ltiMessageHint;

  showLog13([
    `<span class="log-url">${initUrl}</span>`,
    ``,
    `<span class="log-key">── OIDC Login Init Parameters ───────────────</span>`,
    ...Object.entries(oidcParams).map(([k, v]) =>
      `  <span class="log-key">${k}</span><span class="log-sep"> = </span><span class="log-val">${v}</span>`
    ),
    ``,
    `<span class="log-key">── Auth Callback (our endpoint) ────────────</span>`,
    `  <span class="log-url">${authCallback}</span>`,
    ``,
    `<span class="log-dim">Amira will redirect back to our auth callback with nonce, state, and redirect_uri.</span>`,
  ]);

  setStatus('status-msg-13', 'success', 'Initiating OIDC flow with Amira…');

  setTimeout(() => {
    const form = document.createElement('form');
    form.method = 'POST'; form.action = initUrl; form.style.display = 'none';
    for (const [name, value] of Object.entries(oidcParams)) {
      const inp = document.createElement('input');
      inp.type = 'hidden'; inp.name = name; inp.value = value;
      form.appendChild(inp);
    }
    document.body.appendChild(form);
    form.submit();
  }, 600);
});

// ── Signature Validator ────────────────────────────────────────────────────────

document.getElementById('sig-validator-toggle').addEventListener('click', function () {
  this.classList.toggle('open');
  document.getElementById('sig-validator-body').classList.toggle('open');
});

document.getElementById('sig-validate-btn').addEventListener('click', function () {
  const rawBody  = document.getElementById('sig-raw-body').value.trim();
  const secret   = document.getElementById('sig-secret').value.trim();
  const launchUrl = document.getElementById('sig-url').value.trim();
  const resultEl = document.getElementById('sig-result');

  resultEl.style.display = 'none';
  resultEl.innerHTML = '';

  if (!rawBody) {
    resultEl.innerHTML = '<div class="status-bar error">Please paste a raw POST body to validate.</div>';
    resultEl.style.display = 'block';
    return;
  }
  if (!launchUrl) {
    resultEl.innerHTML = '<div class="status-bar error">Please enter the Launch URL the request was sent to.</div>';
    resultEl.style.display = 'block';
    return;
  }
  if (!secret) {
    resultEl.innerHTML = '<div class="status-bar error">Please enter the consumer secret.</div>';
    resultEl.style.display = 'block';
    return;
  }

  // Parse params
  let parsedUrl;
  try { parsedUrl = new URL(launchUrl); }
  catch (_) {
    resultEl.innerHTML = '<div class="status-bar error">Launch URL is not valid.</div>';
    resultEl.style.display = 'block';
    return;
  }

  const usp = new URLSearchParams(rawBody);
  const allParams = {};
  for (const [k, v] of usp.entries()) allParams[k] = v;

  const receivedSig = allParams['oauth_signature'];
  if (!receivedSig) {
    resultEl.innerHTML = '<div class="status-bar error">No <code>oauth_signature</code> found in the POST body.</div>';
    resultEl.style.display = 'block';
    return;
  }

  // Build signing inputs — exclude oauth_signature
  const sigParams = Object.assign({}, allParams);
  delete sigParams['oauth_signature'];

  // Also include any query params from the URL
  for (const [k, v] of parsedUrl.searchParams.entries()) {
    if (!(k in sigParams)) sigParams[k] = v;
  }

  const normalizedUrl = parsedUrl.protocol.toLowerCase() + '//' + parsedUrl.host.toLowerCase() + parsedUrl.pathname;

  const sortedEncoded = Object.entries(sigParams)
    .map(([k, v]) => [oauthEncode(k), oauthEncode(v)])
    .sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0);
  const paramString = sortedEncoded.map(([k, v]) => `${k}=${v}`).join('&');
  const baseString  = 'POST&' + oauthEncode(normalizedUrl) + '&' + oauthEncode(paramString);
  const signingKey  = oauthEncode(secret) + '&';
  const computedSig = hmacSha1Base64(signingKey, baseString);

  const match = computedSig === receivedSig;

  const escapedBase   = baseString.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const escapedKey    = signingKey.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const escapedComp   = computedSig.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const escapedRecv   = receivedSig.replace(/&/g, '&amp;').replace(/</g, '&lt;');

  if (match) {
    resultEl.innerHTML =
      `<div class="status-bar success">` +
        `<strong>&#10003; Signature is valid</strong>` +
        `<pre>signing_key  = ${escapedKey}\nbase_string  = ${escapedBase}</pre>` +
      `</div>`;
  } else {
    resultEl.innerHTML =
      `<div class="status-bar error">` +
        `<strong>&#10007; Signature mismatch</strong>` +
        `<pre>expected     = ${escapedComp}\nreceived     = ${escapedRecv}\n\nsigning_key  = ${escapedKey}\nbase_string  = ${escapedBase}</pre>` +
      `</div>`;
  }
  resultEl.style.display = 'block';
});
