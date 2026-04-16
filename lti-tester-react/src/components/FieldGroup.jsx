// FieldGroup — label + input + hint text wrapper
export default function FieldGroup({ label, hint, children, id, optional }) {
  return (
    <div className="field-group">
      {label && (
        <label htmlFor={id}>
          {label}
          {optional && <span className="optional-tag">optional</span>}
        </label>
      )}
      {children}
      {hint && <div className="hint-text">{hint}</div>}
    </div>
  );
}
