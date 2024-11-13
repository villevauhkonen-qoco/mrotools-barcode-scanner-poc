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
    const [result, setResult] = useState<string>('');
    const [isScanning, setIsScanning] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

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
            let mounted = true;

            const initializeReader = async () => {
                try {
                    // Stop any existing stream first
                    if (streamRef.current) {
                        streamRef.current.getTracks().forEach(track => track.stop());
                        streamRef.current = null;
                    }

                    // First try with detailed constraints
                    const constraints = {
                        video: {
                            facingMode: "environment",
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            frameRate: { ideal: 30 }
                        }
                    };

                    try {
                        const stream = await navigator.mediaDevices.getUserMedia(constraints);
                        
                        if (!mounted) {
                            stream.getTracks().forEach(track => track.stop());
                            return;
                        }

                        streamRef.current = stream;

                        const barcodeReader = new BarcodeReader({
                            selector: hostElemRef.current!,
                            engine: {
                                symbologies: [],
                                duplicateInterval: 2500
                            },
                        });
                        barcodeReaderRef.current = barcodeReader;

                        const initBarcodeReader = async () => {
                            try {
                                await barcodeReader.initialize();

                                if (!mounted) return;
                                setCameraError(null);

                                barcodeReader.detected = (detections) => {
                                    if (detections && detections.length > 0) {
                                        setResult(detections[0].data);
                                        props.onDetected?.(detections);
                                        setIsScanning(false);
                                        toast.success('Barcode successfully scanned!');
                                    }
                                };

                                if (mounted && isScanning) {
                                    await barcodeReader.start();
                                }
                            } catch (error) {
                                console.error('Failed to initialize barcode reader:', error);
                                if (mounted) {
                                    setIsScanning(false);
                                    setCameraError(
                                        error instanceof DOMException && error.name === 'NotAllowedError'
                                            ? 'Camera permission denied. Please allow camera access and try again.'
                                            : 'Unable to access camera. Make sure no other app or browser tab is using it.'
                                    );
                                }
                            }
                        };
                        initBarcodeReader();
                    } catch (error: unknown) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                        toast.error('Failed to initialize camera. Falling back to basic constraints.' + errorMessage);
                        // Fallback to basic constraints if detailed ones fail
                        const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
                            video: { facingMode: "environment" } 
                        });
                        if (!mounted) {
                            fallbackStream.getTracks().forEach(track => track.stop());
                            return;
                        }
                        streamRef.current = fallbackStream;

                        const barcodeReader = new BarcodeReader({
                            selector: hostElemRef.current!,
                            engine: {
                                symbologies: [],
                                duplicateInterval: 2500
                            },
                        });
                        barcodeReaderRef.current = barcodeReader;

                        const initBarcodeReader = async () => {
                            try {
                                await barcodeReader.initialize();

                                if (!mounted) return;
                                setCameraError(null);

                                barcodeReader.detected = (detections) => {
                                    if (detections && detections.length > 0) {
                                        setResult(detections[0].data);
                                        props.onDetected?.(detections);
                                        setIsScanning(false);
                                        toast.success('Barcode successfully scanned!');
                                    }
                                };

                                if (mounted && isScanning) {
                                    await barcodeReader.start();
                                }
                            } catch (error) {
                                console.error('Failed to initialize barcode reader:', error);
                                if (mounted) {
                                    setIsScanning(false);
                                    setCameraError(
                                        error instanceof DOMException && error.name === 'NotAllowedError'
                                            ? 'Camera permission denied. Please allow camera access and try again.'
                                            : 'Unable to access camera. Make sure no other app or browser tab is using it.'
                                    );
                                }
                            }
                        };
                        initBarcodeReader();
                    }
                } catch (error) {
                    console.error('Failed to initialize camera:', error);
                }
            };

            initializeReader();

            return () => {
                mounted = false;
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                const reader = barcodeReaderRef.current;
                if (reader) {
                    barcodeReaderRef.current = null;
                    reader.detected = undefined;

                    void (async () => {
                        try {

                            if (isScanning) {
                                await reader.stop();
                            }
                            await reader.destroy();

                        } catch (e) {
                            console.warn('Error during cleanup:', e);
                        }
                    })();
                }
            };
        }
    }, [sdkInitialized, props.onDetected, isScanning, props]);

    const handleScanToggle = async () => {
        if (!barcodeReaderRef.current) {
            console.error('Barcode reader not initialized');
            return;
        }

        try {
            if (isScanning) {
                setIsScanning(false);
                await barcodeReaderRef.current.stop();
            } else {
                setIsScanning(true);
                await barcodeReaderRef.current.start();
            }
        } catch (error) {
            console.error('Error toggling scanner:', error);
            setIsScanning(false);
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
            {result && (
                <div className="result">
                    Scanned Code: {result}
                </div>
            )}
        </div>
    );
});

export default StrichScanner; 