import React, { useState } from 'react';
import QuaggaScanner from './components/QuaggaScanner.tsx';
import ZXingScanner from './components/ZXingScanner.tsx';
import StrichScanner from './components/StrichScanner.tsx';
import './App.css';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quagga' | 'zxing' | 'strich'>('quagga');

  return (
    <div className="app">
      <h2>Barcode Scanner 5000</h2>
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'quagga' ? 'active' : ''}`}
          onClick={() => setActiveTab('quagga')}
        >
          Quagga2
        </button>
        <button 
          className={`tab-btn ${activeTab === 'zxing' ? 'active' : ''}`}
          onClick={() => setActiveTab('zxing')}
        >
          ZXing
        </button>
        <button 
          className={`tab-btn ${activeTab === 'strich' ? 'active' : ''}`}
          onClick={() => setActiveTab('strich')}
        >
          STRICH
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'quagga' && <QuaggaScanner />}
        {activeTab === 'zxing' && <ZXingScanner />}
        {activeTab === 'strich' && <StrichScanner />}
      </div>
    </div>
  );
};

export default App;
