import { useState } from 'react';
import StepCard from '../StepCard.jsx';
import CodeBlock from '../CodeBlock.jsx';
import { buildCronLine, buildWindowsTaskXml } from '../../utils/generateSchedule.js';

const DAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`,
}));

const MINUTES = [
  { value: 0, label: ':00' },
  { value: 15, label: ':15' },
  { value: 30, label: ':30' },
  { value: 45, label: ':45' },
];

export default function Step5Schedule({ config, setConfig, step, onBack }) {
  const [os, setOs] = useState('mac');

  const [hour, minute, dayOfWeek] = [
    parseInt(config.scheduleTime?.split(':')[0] ?? '6'),
    parseInt(config.scheduleTime?.split(':')[1] ?? '0'),
    parseInt(config.scheduleDay ?? '1'),
  ];

  function setHour(h) {
    setConfig(prev => ({ ...prev, scheduleTime: `${h}:${minute}` }));
  }
  function setMinute(m) {
    setConfig(prev => ({ ...prev, scheduleTime: `${hour}:${m}` }));
  }
  function setDay(d) {
    setConfig(prev => ({ ...prev, scheduleDay: String(d) }));
  }

  const cronCode = buildCronLine(hour, minute, dayOfWeek);
  const xmlCode  = buildWindowsTaskXml(hour, minute, dayOfWeek);

  return (
    <StepCard step={step} onBack={onBack} hideActions={true}>
      <div className="setup-info">
        <span className="setup-info-icon">✅</span>
        <span>
          Your scripts are ready. Configure a schedule below so the downloader runs automatically.
        </span>
      </div>

      <div className="section">
        <div className="section-title">Choose a schedule</div>

        <div className="field-group">
          <label>Day of Week</label>
          <div className="day-buttons">
            {DAYS.map(d => (
              <button
                key={d.value}
                className={`day-btn${dayOfWeek === d.value ? ' active' : ''}`}
                onClick={() => setDay(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field-group" style={{ marginTop: 16 }}>
          <label>Time</label>
          <div className="time-row">
            <div className="select-wrapper">
              <select value={hour} onChange={e => setHour(Number(e.target.value))}>
                {HOURS.map(h => (
                  <option key={h.value} value={h.value}>{h.label}</option>
                ))}
              </select>
            </div>
            <div className="select-wrapper">
              <select value={minute} onChange={e => setMinute(Number(e.target.value))}>
                {MINUTES.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="hint-text" style={{ marginTop: 8 }}>
            Choose an off-peak time. The download can take 5–30 minutes depending on district size.
          </div>
        </div>
      </div>

      <div className="section shaded">
        <div className="section-title">Apply the schedule</div>

        <div className="field-group">
          <div className="seg-control">
            <button
              className={`seg-option${os === 'mac' ? ' active' : ''}`}
              onClick={() => setOs('mac')}
            >
              🍎 macOS / Linux (cron)
            </button>
            <button
              className={`seg-option${os === 'windows' ? ' active' : ''}`}
              onClick={() => setOs('windows')}
            >
              🪟 Windows (Task Scheduler)
            </button>
          </div>
        </div>

        {os === 'mac' && (
          <>
            <CodeBlock label="cron entry — paste into crontab -e" code={cronCode} />
            <div className="tool-guidance" style={{ marginTop: 14 }}>
              <div className="tool-guidance-title">How to apply on macOS / Linux</div>
              <ol className="tool-guidance-steps">
                <li>
                  Open Terminal and run <code>crontab -e</code> to open your crontab editor.
                </li>
                <li>
                  Copy the cron line above and paste it into the editor. Update{' '}
                  <code>/path/to/downloader</code> to the actual folder where you extracted the ZIP.
                </li>
                <li>
                  Save and exit (<code>:wq</code> in vi, or <kbd>Ctrl+O</kbd> then <kbd>Ctrl+X</kbd> in nano).
                </li>
                <li>
                  Verify with <code>crontab -l</code> — your entry should appear in the list.
                </li>
              </ol>
            </div>
          </>
        )}

        {os === 'windows' && (
          <>
            <CodeBlock label="Task Scheduler XML — save as task.xml" code={xmlCode} />
            <div className="tool-guidance" style={{ marginTop: 14 }}>
              <div className="tool-guidance-title">How to apply on Windows</div>
              <ol className="tool-guidance-steps">
                <li>
                  Copy the XML above and save it as <code>task.xml</code> anywhere on your machine.
                  Update <code>WorkingDirectory</code> to the actual folder where you extracted the ZIP.
                </li>
                <li>
                  Open <strong>Command Prompt as Administrator</strong> and run:{' '}
                  <code>schtasks /create /xml "C:\path\to\task.xml" /tn "IstationDownloader"</code>
                </li>
                <li>
                  Open <strong>Task Scheduler</strong> to confirm it appears under the Task Scheduler Library.
                </li>
                <li>
                  Right-click the task and choose <strong>Run</strong> to do a manual test before the first scheduled run.
                </li>
              </ol>
            </div>
          </>
        )}
      </div>

      <div className="step-actions">
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>Step {step} of 5 — Setup complete</span>
      </div>
    </StepCard>
  );
}
