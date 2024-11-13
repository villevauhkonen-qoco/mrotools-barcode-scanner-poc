import React, { useState, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library'

const ZXingScanner: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const codeReader = new BrowserMultiFormatReader();

  const startScanning = async () => {
    try {
      setIsScanning(true);
      const videoInputDevices = await codeReader.listVideoInputDevices();
      const selectedDeviceId = videoInputDevices[0].deviceId;
      
      codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        'video-element',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result: any, err: Error | undefined) => {
          if (result) {
            setResult(result.getText());
            stopScanning();
          }
          if (err && 
              !(err instanceof TypeError) && 
              !(err.name === 'NotFoundException')) {
            console.error(err);
          }
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const stopScanning = () => {
    codeReader.reset();
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      codeReader.reset();
    };
  }, []);

  return (
    <div className="scanner">
        <h1>ZXing</h1>
      <button 
        onClick={isScanning ? stopScanning : startScanning}
      >
        {isScanning ? 'Stop Scanning' : 'Start Scanning'}
      </button>
      <video id="video-element" className="viewport" />
      {result && (
        <div className="result">
          Scanned Code: {result}
        </div>
      )}
    </div>
  );
};

export default ZXingScanner; 