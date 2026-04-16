import { useState } from 'react';
import CollapsibleSection from './CollapsibleSection.jsx';

const LAUNCH_URL = 'https://sso.app.amiralearning.com/dwe-lti-sso/Launch/lti';

const PLATFORMS = [
  { value: 'canvas',       label: 'Canvas' },
  { value: 'schoology',    label: 'Schoology' },
  { value: 'classlink',    label: 'ClassLink' },
  { value: 'clever',       label: 'Clever' },
  { value: 'blackboard',   label: 'Blackboard' },
  { value: 'moodle',       label: 'Moodle' },
  { value: 'powerschool',  label: 'PowerSchool Learning' },
  { value: 'generic',      label: 'Generic / Other' },
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
      return `Tool Name:        Amira Learning
Consumer Key:     ${key}
Consumer Secret:  ${secret}
Launch URL:       ${LAUNCH_URL}
Privacy:          Send Name and Email/Username`;

    case 'classlink':
      return `Tool Name:        Amira Learning
Consumer Key:     ${key}
Shared Secret:    ${secret}
Launch URL:       ${LAUNCH_URL}
LTI Version:      LTI 1.1
Privacy:          Share name and email`;

    case 'clever':
      return `\u26a0  Clever uses its own SSO protocol \u2014 not standard LTI.

Amira integrates with Clever via Instant Login, not a consumer
key/secret. The key and secret fields above do not apply here.

For Clever setup, contact Amira support to enable the Clever
integration for this district.`;

    case 'blackboard':
      return `Provider Domain:      sso.app.amiralearning.com
Tool Provider Key:    ${key}
Tool Provider Secret: ${secret}
Launch URL:           ${LAUNCH_URL}
Send User Data:       Send user data only over SSL
User Fields:          Role in Course, Name, Email Address`;

    case 'moodle':
      return `Tool Name:        Amira Learning
Tool URL:         ${LAUNCH_URL}
Consumer Key:     ${key}
Shared Secret:    ${secret}
Default Container: New Window
Share Name:       Always
Share Email:      Always`;

    case 'powerschool':
      return `App Name:         Amira Learning
Consumer Key:     ${key}
Consumer Secret:  ${secret}
Launch URL:       ${LAUNCH_URL}
Share User Data:  Yes`;

    case 'generic':
    default:
      return `Launch URL:       ${LAUNCH_URL}
Consumer Key:     ${key}
Consumer Secret:  ${secret}
LTI Version:      LTI 1.1 (OAuth 1.0 / HMAC-SHA1)
Privacy:          Send name and email`;
  }
}

function getNote(platform) {
  switch (platform) {
    case 'canvas':
      return null; // note handled separately since it references KEY
    case 'schoology':
      return 'In Schoology: App Center \u2192 Add App \u2192 External Learning Tools \u2192 Add External Tool Provider. Enter these values in the corresponding fields.';
    case 'classlink':
      return 'In ClassLink: Admin Console \u2192 App Library \u2192 Add Custom App \u2192 LTI 1.1. Enter these values in the corresponding fields.';
    case 'clever':
      return null;
    case 'blackboard':
      return 'In Blackboard: Admin Panel \u2192 Building Blocks \u2192 LTI Tool Providers \u2192 Register Provider Domain. Enter these values in the corresponding fields.';
    case 'moodle':
      return 'In Moodle: Site Administration \u2192 Plugins \u2192 Activity Modules \u2192 External Tool \u2192 Manage Tools \u2192 Add preconfigured tool.';
    case 'powerschool':
      return 'In PowerSchool Learning: School Settings \u2192 Apps \u2192 LTI Apps \u2192 Add App.';
    case 'generic':
    default:
      return 'These are the standard LTI 1.1 credentials. Enter them in your LMS\u2019s external tool configuration.';
  }
}

function getPlatformLabel(platform) {
  return PLATFORMS.find(p => p.value === platform)?.label ?? platform;
}

export default function LmsConfigGenerator({ defaultOpen = false }) {
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [platform, setPlatform] = useState('canvas');
  const [output, setOutput] = useState(null);
  const [copied, setCopied] = useState(false);

  function handleGenerate() {
    const config = buildConfig(platform, consumerKey || '{KEY}', consumerSecret || '{SECRET}');
    setOutput({ platform, config, note: platform === 'canvas'
      ? `Paste this XML into Canvas \u2192 Admin \u2192 Developer Keys \u2192 + LTI Key \u2192 Paste XML. Enter the Consumer Key (${consumerKey || '{KEY}'}) and Consumer Secret separately in the tool configuration.`
      : getNote(platform) });
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
    <CollapsibleSection title="LMS Config Generator" tag="LTI 1.0 / 1.1" defaultOpen={defaultOpen}>
      <div className="field-group">
        <label htmlFor="lcg-key">Consumer Key</label>
        <input
          id="lcg-key"
          type="text"
          placeholder="your_consumer_key"
          value={consumerKey}
          onChange={e => setConsumerKey(e.target.value)}
        />
      </div>

      <div className="field-group">
        <label htmlFor="lcg-secret">Consumer Secret</label>
        <input
          id="lcg-secret"
          type="password"
          placeholder="your_consumer_secret"
          value={consumerSecret}
          onChange={e => setConsumerSecret(e.target.value)}
        />
      </div>

      <div className="field-group">
        <label htmlFor="lcg-platform">LMS Platform</label>
        <div className="select-wrapper">
          <select
            id="lcg-platform"
            value={platform}
            onChange={e => { setPlatform(e.target.value); setOutput(null); }}
          >
            {PLATFORMS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button className="btn-primary" onClick={handleGenerate}>
        Generate Config
      </button>

      {output && (
        <div className="config-output">
          <div className="config-output-header">
            <span>{getPlatformLabel(output.platform)}</span>
            <button
              className={`btn-copy${copied ? ' copied' : ''}`}
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="config-output-body">{output.config}</pre>
          {output.note && (
            <div className="config-note">{output.note}</div>
          )}
        </div>
      )}
    </CollapsibleSection>
  );
}
