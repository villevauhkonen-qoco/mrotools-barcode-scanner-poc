import React, { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library'
import toast from 'react-hot-toast';

const ZXingScanner: React.FC = () => {
  const [result, setResult] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [error, setError] = useState<string>('');
  const codeReaderRef = useRef<typeof BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();
    
    const loadDevices = async () => {
      try {
        const devices = await codeReaderRef.current!.listVideoInputDevices();
        setVideoDevices(devices);
        if (devices.length > 0) {
          setSelectedDevice(devices[0].deviceId);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to list video devices');
      }
    };
    
    loadDevices();

    return () => {
      if (codeReaderRef.current) {
        try {
          codeReaderRef.current.reset();
          codeReaderRef.current = null;
        } catch (err) {
          console.warn('Error during cleanup:', err);
        }
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError('');
      codeReaderRef.current?.decodeFromVideoDevice(
        selectedDevice,
        'video-element',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (result: any, err: Error | undefined) => {
          if (result) {
            setResult(result.getText());
            setError('');
            stopScanning();
            toast.success('Barcode successfully scanned!');
          }
          if (err) {
            if (err.name === 'NotFoundException') {
              setError('Searching for QR code...');
            } else if (!(err instanceof TypeError)) {
              setError(`Scanner error: ${err.message}`);
              console.error(err);
            }
          }
        }
      );
    } catch (err) {
      setError('Failed to start scanner');
      console.error(err);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

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
      {error && (
        <div className="error">
          {error}
        </div>
      )}
      {result && (
        <div className="result">
          Scanned Code: {result}
        </div>
      )}
    </div>
  );
};

export default ZXingScanner; 