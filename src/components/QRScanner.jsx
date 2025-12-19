import { Button } from '@/components/ui/button';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { AlertCircle, Camera, CameraOff, SwitchCamera } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * QR Scanner Component using html5-qrcode
 * @param {Function} onScan - Callback when QR is scanned successfully
 * @param {Function} onError - Callback when error occurs
 * @param {boolean} isScanning - Control scanning state from parent
 * @param {Function} setIsScanning - Set scanning state
 */
export function QRScanner({ onScan, onError, isScanning, setIsScanning }) {
  const { t } = useTranslation();
  const html5QrCodeRef = useRef(null);
  const [cameras, setCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const lastScannedRef = useRef(null);
  const scanCooldownRef = useRef(false);
  const containerIdRef = useRef(`qr-reader-${Date.now()}`);

  // Get available cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          setHasPermission(true);
          setCameraError(null);
        } else {
          setHasPermission(false);
          setCameraError('No cameras found');
        }
      })
      .catch((err) => {
        console.error('Error getting cameras:', err);
        setHasPermission(false);
        setCameraError(err.message || 'Camera access denied');
      });
  }, []);

  // Handle scan result with cooldown to prevent duplicate scans
  const handleScanSuccess = useCallback((decodedText) => {
    // Prevent duplicate scans within 2 seconds
    if (scanCooldownRef.current || decodedText === lastScannedRef.current) {
      return;
    }

    lastScannedRef.current = decodedText;
    scanCooldownRef.current = true;

    // Call the onScan callback
    if (onScan) {
      onScan(decodedText);
    }

    // Reset cooldown after 2 seconds
    setTimeout(() => {
      scanCooldownRef.current = false;
      lastScannedRef.current = null;
    }, 2000);
  }, [onScan]);

  // Safely stop scanner
  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const state = html5QrCodeRef.current.getState();
        if (state === Html5QrcodeScannerState.SCANNING) {
          await html5QrCodeRef.current.stop();
        }
        // Clear the scanner element
        try {
          html5QrCodeRef.current.clear();
        } catch (e) {
          // Ignore clear errors
        }
      } catch (err) {
        // Ignore stop errors - scanner might not be running
      }
      html5QrCodeRef.current = null;
    }
  }, []);

  // Start/Stop scanner
  useEffect(() => {
    let isMounted = true;
    const containerId = containerIdRef.current;
    
    const startScanner = async () => {
      if (!cameras.length) return;
      
      // Make sure container exists
      const container = document.getElementById(containerId);
      if (!container) {
        console.error('QR reader container not found');
        return;
      }

      // Clean up any existing instance
      await stopScanner();
      
      try {
        html5QrCodeRef.current = new Html5Qrcode(containerId);
        
        await html5QrCodeRef.current.start(
          cameras[currentCameraIndex].id,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          handleScanSuccess,
          // Ignore errors from failed scans (no QR in frame)
          () => {}
        );
        
        if (isMounted) {
          setCameraError(null);
        }
      } catch (err) {
        console.error('Error starting scanner:', err);
        if (isMounted) {
          setCameraError(err.message || 'Cannot start camera');
          setIsScanning(false);
          if (onError) onError(err);
        }
      }
    };

    if (isScanning && cameras.length > 0 && hasPermission) {
      startScanner();
    } else if (!isScanning) {
      stopScanner();
    }

    // Cleanup on unmount
    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [isScanning, cameras, currentCameraIndex, handleScanSuccess, hasPermission, onError, setIsScanning, stopScanner]);

  // Switch camera
  const switchCamera = useCallback(async () => {
    if (cameras.length <= 1) return;

    setIsScanning(false);
    
    // Wait for scanner to stop
    await new Promise(resolve => setTimeout(resolve, 100));

    // Switch to next camera
    const nextIndex = (currentCameraIndex + 1) % cameras.length;
    setCurrentCameraIndex(nextIndex);

    // Restart scanning
    setIsScanning(true);
  }, [cameras, currentCameraIndex, setIsScanning]);

  // Toggle scanning
  const toggleScanning = useCallback(() => {
    setCameraError(null);
    setIsScanning(!isScanning);
  }, [isScanning, setIsScanning]);

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg min-h-[300px]">
        <CameraOff className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 text-center">
          {t('checkin.scanner.noPermission', 'Không có quyền truy cập camera. Vui lòng cho phép truy cập camera trong cài đặt trình duyệt.')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full">
      {/* Scanner View */}
      <div className="relative w-full max-w-[400px] aspect-square bg-black rounded-xl overflow-hidden">
        {/* This div is managed by html5-qrcode */}
        <div 
          id={containerIdRef.current} 
          className="w-full h-full"
          style={{ minHeight: '300px' }}
        />
        
        {/* Overlay when not scanning */}
        {!isScanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
            <Camera className="w-16 h-16 text-gray-400" />
          </div>
        )}

        {/* Error overlay */}
        {cameraError && isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 p-4">
            <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
            <p className="text-white text-center text-sm">
              {cameraError}
            </p>
            <p className="text-gray-400 text-center text-xs mt-2">
              {t('checkin.scanner.tryAgain', 'Hãy thử đóng các ứng dụng khác đang dùng camera')}
            </p>
          </div>
        )}

        {/* Scan overlay frame */}
        {isScanning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[250px] h-[250px] relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-3 mt-4">
        <Button
          onClick={toggleScanning}
          variant={isScanning ? 'destructive' : 'default'}
          size="lg"
          className="min-w-[140px]"
          disabled={!hasPermission}
        >
          {isScanning ? (
            <>
              <CameraOff className="w-5 h-5 mr-2" />
              {t('checkin.scanner.stop', 'Dừng quét')}
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              {t('checkin.scanner.start', 'Bắt đầu quét')}
            </>
          )}
        </Button>

        {cameras.length > 1 && (
          <Button
            onClick={switchCamera}
            variant="outline"
            size="lg"
            disabled={!isScanning}
          >
            <SwitchCamera className="w-5 h-5 mr-2" />
            {t('checkin.scanner.switchCamera', 'Đổi camera')}
          </Button>
        )}
      </div>

      {/* Camera info */}
      {cameras.length > 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          {t('checkin.scanner.usingCamera', 'Camera')}: {cameras[currentCameraIndex]?.label || `Camera ${currentCameraIndex + 1}`}
        </p>
      )}
    </div>
  );
}

export default QRScanner;
