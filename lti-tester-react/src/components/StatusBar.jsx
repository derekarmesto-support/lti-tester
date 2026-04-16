// StatusBar — shows success/error/pending messages
export default function StatusBar({ type, message }) {
  if (!type || !message) return null;

  return (
    <div className={`message ${type}`}>
      {type === 'pending' && <span style={{ marginRight: 6 }}>⏳</span>}
      {message}
    </div>
  );
}
