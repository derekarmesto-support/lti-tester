import JSZip from 'jszip';
import { configToJson } from './generateConfig.js';
import { generatePythonScript } from './generatePythonScript.js';

function buildCredentialsEnv(config) {
  return [
    '# Istation Data Downloader — credentials',
    '# Keep this file private. Do NOT commit to git.',
    '# On macOS/Linux restrict permissions: chmod 600 credentials.env',
    '#',
    `ISTATION_EMAIL=${config.email}`,
    `ISTATION_PASSWORD=${config.credentialPassword || ''}`,
  ].join('\n');
}

export async function zipDownload(config) {
  const zip = new JSZip();
  zip.file('config.json', configToJson(config));
  zip.file('downloader.py', generatePythonScript(config));

  if (config.passwordSource === 'credfile') {
    zip.file('credentials.env', buildCredentialsEnv(config));
    zip.file('.gitignore', 'credentials.env\n');
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `downloader_${config.districtOid || 'istation'}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
