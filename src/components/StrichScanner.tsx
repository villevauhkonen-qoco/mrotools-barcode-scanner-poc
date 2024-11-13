import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react';
import { BarcodeReader, StrichSDK, CodeDetection } from '@pixelverse/strichjs-sdk';

const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkNjIwY2IyOC05OWU4LTRlZjMtODRmYy0zMTE2ZjQ0NmViYTQiLCJpc3MiOiJzdHJpY2guaW8iLCJhdWQiOlsiaHR0cHM6Ly9rYWxlaWRvc2NvcGljLW1vdXNzZS01YmVjNDkubmV0bGlmeS5hcHAvIl0sImlhdCI6MTczMTQ5MDE3MiwibmJmIjoxNzMxNDkwMTcyLCJjYXBhYmlsaXRpZXMiOnt9LCJ2ZXJzaW9uIjoxfQ.nt1dZbvE2ckvGnDH4kkQtCkDiUSLc9VwscCWGusfJ9s';

type StrichScannerProps = {
    onDetected?: (detections: CodeDetection[]) => void;
}

const StrichScanner = forwardRef((props: StrichScannerProps, ref) => {
    const hostElemRef = useRef(null);
    const barcodeReaderRef = useRef<BarcodeReader | null>(null);
    const [sdkInitialized, setSdkInitialized] = useState(StrichSDK.isInitialized());
    const [result, setResult] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);

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
            if (StrichSDK.isInitialized()) {
                return;
            }
            try {
                await StrichSDK.initialize(key);
                setSdkInitialized(true);
            } catch (e) {
                console.error(`Failed to initialize STRICH SDK: ${e}`);
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
                    duplicateInterval: 2500
                }
            });
            barcodeReaderRef.current = barcodeReader;

            const initBarcodeReader = async () => {
                try {
                    await barcodeReader.initialize();
                    barcodeReader.detected = (detections) => {
                        setResult(detections[0].data);
                        props.onDetected?.(detections);
                        setIsScanning(false);
                    };
                    if (isScanning) {
                        await barcodeReader.start();
                    }
                } catch (error) {
                    console.error('Failed to initialize barcode reader:', error);
                    setIsScanning(false);
                }
            };
            initBarcodeReader();

            return () => {
                barcodeReader.stop().then(() => {
                    barcodeReaderRef.current?.destroy();
                    barcodeReaderRef.current = null;
                });
            };
        }
    }, [sdkInitialized, props.onDetected, isScanning, props]);

    const handleScanToggle = async () => {
        try {
            if (isScanning) {
                await barcodeReaderRef.current?.stop();
                setIsScanning(false);
            } else {
                await barcodeReaderRef.current?.start();
                setIsScanning(true);
            }
        } catch (error) {
            console.error('Error toggling scanner:', error);
            setIsScanning(false);
        }
    };

    return (
        <div className="scanner">
            <h1>STRICH</h1>
            <button onClick={handleScanToggle}>
                {isScanning ? 'Stop Scanning' : 'Start Scanning'}
            </button>
            <div ref={hostElemRef} className="viewport" style={{ position: 'relative' }} />
            {result && (
                <div className="result">
                    Scanned Code: {result}
                </div>
            )}
        </div>
    );
});

export default StrichScanner; 