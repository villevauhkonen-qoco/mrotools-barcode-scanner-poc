import React, { useState, useEffect, useRef } from 'react';
import Quagga from '@ericblade/quagga2';

const QuaggaScanner: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLDivElement>(null);

  const startScanning = () => {
    if (videoRef.current) {
      setIsScanning(true);
      Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: videoRef.current,
          constraints: {
            facingMode: "environment"
          },
        },
        decoder: {
          readers: ["ean_reader", "ean_8_reader", "code_128_reader", "code_39_reader"]
        }
      }, (err) => {
        if (err) {
          console.error(err);
          return;
        }
        Quagga.start();
      });

      Quagga.onDetected((result) => {
        if (result.codeResult.code) {
          setResult(result.codeResult.code);
          stopScanning();
        }
      });
    }
  };

  const stopScanning = () => {
    Quagga.stop();
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      Quagga.stop();
    };
  }, []);

  return (
    <div className="scanner">
        <h1>Quagga2</h1>
      <button 
        onClick={isScanning ? stopScanning : startScanning}
      >
        {isScanning ? 'Stop Scanning' : 'Start Scanning'}
      </button>
      <div ref={videoRef} className="viewport" style={{
        maxWidth: '100%',
        width: '100%',
        maxHeight: '70vh',
        overflow: 'hidden'
      }} />
      {result && (
        <div className="result">
          Scanned Code: {result}
        </div>
      )}
    </div>
  );
};

export default QuaggaScanner; 