import { useState } from 'react';

// CollapsibleSection — a .section with a clickable title that expands/collapses the body
export default function CollapsibleSection({ title, tag, children, defaultOpen = false, shaded = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`section${shaded ? ' shaded' : ''}`}>
      <div
        className={`section-title collapsible${open ? ' open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {title}
        {tag && <span className="optional-tag">{tag}</span>}
        <span className="collapse-chevron">▼</span>
      </div>
      <div className={`collapsible-body${open ? ' open' : ''}`}>
        {children}
      </div>
    </div>
  );
}
