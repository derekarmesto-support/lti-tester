import { useState } from 'react';

export default function CodeBlock({ label, code, maxLines }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard not available
    }
  }

  const bodyStyle = maxLines
    ? { maxHeight: `${maxLines * 1.85 * 0.715 * 16}px`, overflowY: 'auto' }
    : {};

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-block-label">{label}</span>
        <button className={`btn-copy-log${copied ? ' copied' : ''}`} onClick={handleCopy}>
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre className="code-block-body" style={bodyStyle}>{code}</pre>
    </div>
  );
}
