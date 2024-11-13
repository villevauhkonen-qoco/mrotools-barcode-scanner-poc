import React, { useState, useEffect } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library'

const ZXingScanner: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const codeReader = new BrowserMultiFormatReader();

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const devices = await codeReader.listVideoInputDevices();
        setVideoDevices(devices);
        if (devices.length > 0) {
          setSelectedDevice(devices[0].deviceId);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadDevices();
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      codeReader.decodeFromVideoDevice(
        selectedDevice,
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
      <select 
        value={selectedDevice}
        onChange={(e) => setSelectedDevice(e.target.value)}
        disabled={isScanning}
      >
        {videoDevices.map(device => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Camera ${device.deviceId}`}
          </option>
        ))}
      </select>
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