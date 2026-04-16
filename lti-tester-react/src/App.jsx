import { useState } from 'react';
import Lti10Tab from './components/tabs/Lti10Tab.jsx';
import Lti12Tab from './components/tabs/Lti12Tab.jsx';
import Lti13Tab from './components/tabs/Lti13Tab.jsx';
import SignatureValidator from './components/SignatureValidator.jsx';
import LmsConfigGenerator from './components/LmsConfigGenerator.jsx';
import HealthCheck from './components/HealthCheck.jsx';

const isEmbedded = window.self !== window.top;

const TABS = [
  { id: 'lti10', label: 'LTI 1.0' },
  { id: 'lti12', label: 'LTI 1.2' },
  { id: 'lti13', label: 'LTI 1.3' },
  { id: 'tools', label: '🛠 Tools' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('lti10');

  return (
    <>
      {isEmbedded && (
        <div className="embedded-banner">
          Running in an embedded frame.{' '}
          <a href={window.location.href} target="_blank" rel="noreferrer">
            Open in a new tab
          </a>{' '}
          for full pop-up support.
        </div>
      )}

      {/* Header */}
      <div className="tool-header">
        <div className="tool-icon">🔗</div>
        <div className="tool-header-text">
          <h1>LTI Launch Tester</h1>
          <p>Amira Learning · SSO Integration Tester</p>
        </div>
        <HealthCheck />
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'lti10' && <Lti10Tab />}
      {activeTab === 'lti12' && <Lti12Tab />}
      {activeTab === 'lti13' && <Lti13Tab />}
      {activeTab === 'tools' && (
        <div className="tab-content active">
          <SignatureValidator defaultOpen />
          <LmsConfigGenerator defaultOpen />
        </div>
      )}
    </>
  );
}
