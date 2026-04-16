import { useState, useEffect, useCallback } from 'react';

const HEALTH_URL = 'https://sso.app.amiralearning.com/dwe-lti-sso/healthcheck';

export default function HealthCheck() {
  const [status, setStatus] = useState('checking'); // 'checking' | 'online' | 'offline'

  const runCheck = useCallback(async () => {
    setStatus('checking');
    try {
      await fetch(HEALTH_URL, { mode: 'cors' });
      setStatus('online');
    } catch {
      // CORS blocked or network error — retry with no-cors
      try {
        const res = await fetch(HEALTH_URL, { mode: 'no-cors' });
        // opaque response (type === 'opaque') means server is reachable
        if (res.type === 'opaque' || res.ok) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } catch {
        setStatus('offline');
      }
    }
  }, []);

  useEffect(() => {
    runCheck();
  }, [runCheck]);

  const dotClass = status === 'online' ? 'online' : status === 'offline' ? 'offline' : 'checking';
  const label = status === 'online' ? 'SSO Online' : status === 'offline' ? 'SSO Offline' : 'Checking…';

  return (
    <button className="health-badge" onClick={runCheck} title="Click to re-check SSO health">
      <span className={`health-dot ${dotClass}`} />
      {label}
    </button>
  );
}
