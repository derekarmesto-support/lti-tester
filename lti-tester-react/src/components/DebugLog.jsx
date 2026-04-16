import { useState, useRef, useEffect } from 'react';

// DebugLog — renders the dark log box with copy/clear controls
// entries: array of HTML strings (one per request)
export default function DebugLog({ entries, onClear, title, copyId }) {
  const [copyLabel, setCopyLabel] = useState('Copy');
  const boxRef = useRef(null);

  // Scroll to top when new entries appear
  useEffect(() => {
    if (boxRef.current && entries.length > 0) {
      boxRef.current.scrollTop = 0;
    }
  }, [entries.length]);

  if (entries.length === 0) return null;

  function handleCopy() {
    const text = boxRef.current ? boxRef.current.innerText : '';
    navigator.clipboard.writeText(text).then(() => {
      setCopyLabel('Copied!');
      setTimeout(() => setCopyLabel('Copy'), 1500);
    });
  }

  return (
    <div className="log-section visible">
      <div className="log-header">
        <span className="log-title">{title || 'Request Log'}</span>
        {copyId !== false && (
          <button type="button" className="btn-copy-log" onClick={handleCopy}>
            {copyLabel}
          </button>
        )}
        <button type="button" className="log-clear" onClick={onClear}>
          Clear
        </button>
      </div>
      <div
        className="log-box"
        ref={boxRef}
        dangerouslySetInnerHTML={{ __html: entries.join('\n\n') }}
      />
    </div>
  );
}
