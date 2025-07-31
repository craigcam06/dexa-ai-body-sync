import { useState, useRef, useEffect } from 'react';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BarcodeScannerProps {
  onBarcodeDetected: (barcode: string) => void;
  onClose: () => void;
}

export const BarcodeScanner = ({ onBarcodeDetected, onClose }: BarcodeScannerProps) => {
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError('');
      setIsScanning(true);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions and try again.');
      setIsScanning(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualInput = () => {
    const barcode = prompt('Enter barcode manually:');
    if (barcode && barcode.trim()) {
      onBarcodeDetected(barcode.trim());
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Barcode Scanner
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white w-64 h-16 rounded-lg">
                    <div className="w-full h-full border border-white/50 rounded animate-pulse"></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Position the barcode within the white rectangle
              </p>
              <p className="text-xs text-muted-foreground">
                Note: Automatic scanning is not yet implemented. Please use manual input for now.
              </p>
            </div>
          </>
        )}
        
        <div className="flex gap-2">
          <Button onClick={handleManualInput} className="flex-1">
            Enter Barcode Manually
          </Button>
          <Button variant="outline" onClick={startCamera} disabled={isScanning}>
            Retry Camera
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};