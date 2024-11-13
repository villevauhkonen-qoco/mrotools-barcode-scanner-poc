import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { BarcodeReader, StrichSDK, CodeDetection } from '@pixelverse/strichjs-sdk';
import toast from 'react-hot-toast';

const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNjgxZTliNS1jNjA1LTRjMmItYTU5My1mMDc0MTUzMTlhOGEiLCJpc3MiOiJzdHJpY2guaW8iLCJhdWQiOlsiaHR0cHM6Ly9rYWxlaWRvc2NvcGljLW1vdXNzZS01YmVjNDkubmV0bGlmeS5hcHAiXSwiaWF0IjoxNzMxNDkxMTA2LCJuYmYiOjE3MzE0OTExMDYsImNhcGFiaWxpdGllcyI6e30sInZlcnNpb24iOjF9.lXe9qOoSq4STE9KDpiZHqDHVHAbz7oPQQGoCKGFpX0o';

type StrichScannerProps = {
    onDetected?: (detections: CodeDetection[]) => void;
}

const StrichScanner = forwardRef((props: StrichScannerProps, ref) => {
    const hostElemRef = useRef(null);
    const barcodeReaderRef = useRef<BarcodeReader | null>(null);
    const [sdkInitialized, setSdkInitialized] = useState(StrichSDK.isInitialized());
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
        start: async () => {
            setIsScanning(true);
            return barcodeReaderRef.current?.start();
        },
        stop: () => {
            setIsScanning(false);
            return barcodeReaderRef.current?.stop();
        }
    }));

    useLayoutEffect(() => {
        const initializeSDK = async () => {
            if (StrichSDK.isInitialized()) return;
            try {
                await StrichSDK.initialize(key);
                setSdkInitialized(true);
            } catch (e) {
                console.error(`Failed to initialize STRICH SDK: ${e}`);
                setCameraError('Failed to initialize SDK');
            }
        };

        if (!sdkInitialized) {
            initializeSDK();
        }
    }, [sdkInitialized]);

    useEffect(() => {
        if (sdkInitialized && barcodeReaderRef.current === null) {
            const barcodeReader = new BarcodeReader({
                selector: hostElemRef.current!,
                engine: {
                    symbologies: [],
                    duplicateInterval: 2500,
                },
            });
            
            barcodeReaderRef.current = barcodeReader;

            const initBarcodeReader = async () => {
                try {
                    await barcodeReader.initialize();
                    setCameraError(null);

                    barcodeReader.detected = (detections) => {
                        if (detections && detections.length > 0) {
                            props.onDetected?.(detections);
                            setIsScanning(false);
                            toast.success('Barcode successfully scanned!');
                        }
                    };

                    if (isScanning) {
                        await barcodeReader.start();
                    }
                } catch (error) {
                    console.error('Failed to initialize barcode reader:', error);
                    setCameraError(
                        error instanceof DOMException && error.name === 'NotAllowedError'
                            ? 'Camera permission denied. Please allow camera access and try again.'
                            : 'Unable to access camera. Make sure no other app or browser tab is using it.'
                    );
                    setIsScanning(false);
                }
            };

            initBarcodeReader();

            return () => {
                const reader = barcodeReaderRef.current;
                if (reader) {
                    reader.detected = undefined;
                    reader.destroy();
                    barcodeReaderRef.current = null;
                }
            };
        }
    }, [sdkInitialized, props.onDetected, isScanning, props]);

    const handleScanToggle = async () => {
        if (isScanning) {
            await barcodeReaderRef.current?.stop();
            setIsScanning(false);
        } else {
            setIsScanning(true);
            await barcodeReaderRef.current?.start();
        }
    };

    return (
        <div className="scanner">
            <h1>STRICH</h1>
            <button
                onClick={handleScanToggle}
                disabled={!!cameraError}
            >
                {isScanning ? 'Stop Scanning' : 'Start Scanning'}
            </button>
            <div ref={hostElemRef} className="viewport" style={{ position: 'relative' }} />
            {cameraError && (
                <div className="error" style={{ color: 'red', marginTop: '10px' }}>
                    {cameraError}
                </div>
            )}
        </div>
    );
});

export default StrichScanner; 