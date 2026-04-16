import { useState } from 'react';
import Lti10Tab from './components/tabs/Lti10Tab.jsx';
import Lti12Tab from './components/tabs/Lti12Tab.jsx';
import Lti13Tab from './components/tabs/Lti13Tab.jsx';
import SignatureValidator from './components/SignatureValidator.jsx';
import HealthCheck from './components/HealthCheck.jsx';
import LmsConfigGenerator from './components/LmsConfigGenerator.jsx';

const isEmbedded = window.self !== window.top;

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
        <button
          className={`tab${activeTab === 'lti10' ? ' active' : ''}`}
          onClick={() => setActiveTab('lti10')}
        >
          LTI 1.0
        </button>
        <button
          className={`tab${activeTab === 'lti12' ? ' active' : ''}`}
          onClick={() => setActiveTab('lti12')}
        >
          LTI 1.2
        </button>
        <button
          className={`tab${activeTab === 'lti13' ? ' active' : ''}`}
          onClick={() => setActiveTab('lti13')}
        >
          LTI 1.3
        </button>
      </div>

      {/* Active tab */}
      {activeTab === 'lti10' && <Lti10Tab />}
      {activeTab === 'lti12' && <Lti12Tab />}
      {activeTab === 'lti13' && <Lti13Tab />}

      {/* Signature Validator — always visible below tabs */}
      <SignatureValidator />

      {/* LMS Config Generator — always visible below Signature Validator */}
      <LmsConfigGenerator />
    </>
  );
}
