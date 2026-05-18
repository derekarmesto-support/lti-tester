import { useState } from 'react';
import StepCard from '../StepCard.jsx';
import CodeBlock from '../CodeBlock.jsx';
import { configToJson } from '../../utils/generateConfig.js';
import { generatePythonScript } from '../../utils/generatePythonScript.js';
import { zipDownload } from '../../utils/zipDownload.js';

export default function Step4Generate({ config, step, onBack, onNext }) {
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState(null);

  const configJson = configToJson(config);
  const scriptPreview = generatePythonScript(config).split('\n').slice(0, 35).join('\n') + '\n# … (full script in ZIP)';

  async function handleDownload() {
    try {
      setError(null);
      await zipDownload(config);
      setDownloaded(true);
    } catch (e) {
      setError('Download failed: ' + e.message);
    }
  }

  return (
    <StepCard step={step} onBack={onBack} onNext={onNext} nextLabel="Set up scheduling →">
      <div className="section">
        <div className="section-title">Review your configuration</div>
        <CodeBlock label="config.json" code={configJson} />
      </div>

      <div className="section shaded">
        <div className="section-title">Script preview</div>
        <CodeBlock label="downloader.py (first 35 lines)" code={scriptPreview} maxLines={20} />

        <div style={{ marginTop: 16 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Install dependencies</div>
          <CodeBlock
            label="Terminal"
            code="pip install requests beautifulsoup4 keyring"
          />
          <div className="hint-text" style={{ marginTop: 8 }}>
            Run this once before the first download. Python 3.8+ required.
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Download your scripts</div>

        {downloaded && (
          <div className="status-bar success download-success" style={{ marginBottom: 16 }}>
            <strong>ZIP downloaded successfully.</strong>
            <ul>
              <li><code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>downloader.py</code> — the download script</li>
              <li><code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>config.json</code> — your district configuration</li>
            </ul>
            <div style={{ marginTop: 8, fontSize: '0.8rem', fontWeight: 400 }}>
              Extract the ZIP, install dependencies (above), then run:{' '}
              <code style={{ fontFamily: 'var(--font-mono)', background: 'rgba(0,0,0,0.08)', padding: '1px 5px', borderRadius: 4 }}>
                python downloader.py --test-auth
              </code>{' '}
              to verify your credentials before scheduling.
            </div>
          </div>
        )}

        {error && (
          <div className="status-bar error" style={{ marginBottom: 16 }}>{error}</div>
        )}

        <button className="btn-primary" onClick={handleDownload}>
          {downloaded ? '↓ Download again' : `↓ Download downloader_${config.districtOid || 'istation'}.zip`}
        </button>

        {config.passwordSource === 'keyring' && (
          <div className="hint-text" style={{ marginTop: 12 }}>
            After extracting, store your password once with:{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>python downloader.py --store-password</code>
          </div>
        )}
      </div>
    </StepCard>
  );
}
