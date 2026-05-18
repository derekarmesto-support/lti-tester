import { useState, useEffect } from 'react';
import WizardNav from './components/WizardNav.jsx';
import Step1AccountSetup from './components/steps/Step1AccountSetup.jsx';
import Step2Connection from './components/steps/Step2Connection.jsx';
import Step3Reports from './components/steps/Step3Reports.jsx';
import Step4Generate from './components/steps/Step4Generate.jsx';
import Step5Schedule from './components/steps/Step5Schedule.jsx';
import { usePersistedState } from './utils/usePersistedState.js';

const DEFAULT_CONFIG = {
  districtOid:        '',
  email:              '',
  outputDir:          '~/Documents/Istation Data',
  year:               '2024',
  reportType:         'both',
  filenamePattern:    '{student_id} - {report_type} - {date}',
  passwordSource:     'keyring',
  credentialPassword: '',
  scheduleTime:       '6:0',
  scheduleDay:        '1',
};

export default function App() {
  const [step, setStep]     = usePersistedState('istation_step', 1);
  const [config, setConfig] = usePersistedState('istation_config', DEFAULT_CONFIG);
  const [dark, setDark]     = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  function goTo(n) {
    setStep(Math.max(1, Math.min(5, n)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <>
      <div className="tool-header">
        <div className="tool-icon">📥</div>
        <div className="tool-header-text">
          <h1>Istation Data Downloader</h1>
          <p>Amira Learning · Legacy Data Export Tool</p>
        </div>
        <button
          className="dark-toggle"
          onClick={() => setDark(d => !d)}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? '☀️' : '🌙'}
        </button>
      </div>

      <WizardNav step={step} />

      {step === 1 && (
        <Step1AccountSetup
          step={1}
          onNext={() => goTo(2)}
        />
      )}
      {step === 2 && (
        <Step2Connection
          config={config}
          setConfig={setConfig}
          step={2}
          onBack={() => goTo(1)}
          onNext={() => goTo(3)}
        />
      )}
      {step === 3 && (
        <Step3Reports
          config={config}
          setConfig={setConfig}
          step={3}
          onBack={() => goTo(2)}
          onNext={() => goTo(4)}
        />
      )}
      {step === 4 && (
        <Step4Generate
          config={config}
          step={4}
          onBack={() => goTo(3)}
          onNext={() => goTo(5)}
        />
      )}
      {step === 5 && (
        <Step5Schedule
          config={config}
          setConfig={setConfig}
          step={5}
          onBack={() => goTo(4)}
        />
      )}
    </>
  );
}
