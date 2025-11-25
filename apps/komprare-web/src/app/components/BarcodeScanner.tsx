'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (productId: string) => void;
  onClose: () => void;
  isLoading: boolean;
}

/**
 * Extracts the IKEA 8-digit product code from various barcode formats.
 *
 * IKEA uses several barcode formats:
 * - EAN-13: 13 digits, the product code is typically embedded within
 * - EAN-8: 8 digits, may be the product code directly
 * - Direct 8-digit codes from labels
 *
 * The IKEA article number is always 8 digits (e.g., 00263850 for BILLY)
 */
function extractIkeaProductCode(barcode: string): string | null {
  // Remove any non-digit characters
  const cleanBarcode = barcode.replace(/\D/g, '');

  // If it's exactly 8 digits, it might be the product code directly
  if (cleanBarcode.length === 8) {
    return cleanBarcode;
  }

  // EAN-13: 13 digits
  // IKEA EAN-13 format: [prefix][article number][check digit]
  // Common IKEA prefixes: 40-44 (for Ingka Holding), 570 (Swedish), etc.
  // The article number (8 digits) is usually in positions 3-10 or 4-11
  if (cleanBarcode.length === 13) {
    // Try extracting digits 3-10 (0-indexed: 2-9), common for IKEA
    const possibleCode1 = cleanBarcode.substring(2, 10);

    // Try extracting digits 4-11 (0-indexed: 3-10)
    const possibleCode2 = cleanBarcode.substring(3, 11);

    // Try extracting digits 5-12 (0-indexed: 4-11)
    const possibleCode3 = cleanBarcode.substring(4, 12);

    // Return the first valid 8-digit code
    // We prefer codes that don't start with too many zeros
    for (const code of [possibleCode1, possibleCode2, possibleCode3]) {
      if (/^\d{8}$/.test(code)) {
        return code;
      }
    }
  }

  // EAN-8: 8 digits including check digit
  // The product code might be the first 7 digits + padded
  if (cleanBarcode.length === 8) {
    return cleanBarcode;
  }

  // For other lengths, try to find an 8-digit sequence
  if (cleanBarcode.length > 8) {
    // Return the last 8 digits as a fallback
    return cleanBarcode.slice(-8);
  }

  return null;
}

export default function BarcodeScanner({
  onScan,
  onClose,
  isLoading,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [extractedProductCode, setExtractedProductCode] = useState<
    string | null
  >(null);
  const [isStarting, setIsStarting] = useState(true);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const handleSuccessfulScan = useCallback(
    (decodedText: string) => {
      // Prevent multiple scans
      if (scannedCode) return;

      setScannedCode(decodedText);
      const productCode = extractIkeaProductCode(decodedText);

      if (productCode) {
        setExtractedProductCode(productCode);
        // Stop the scanner
        if (scannerRef.current) {
          scannerRef.current.stop().catch(console.error);
        }
      } else {
        setError(
          `Kon geen IKEA productcode vinden in barcode: ${decodedText}`
        );
        // Reset after a moment to allow retry
        setTimeout(() => {
          setScannedCode(null);
          setError(null);
        }, 2000);
      }
    },
    [scannedCode]
  );

  const handleConfirm = useCallback(() => {
    if (extractedProductCode) {
      onScan(extractedProductCode);
    }
  }, [extractedProductCode, onScan]);

  const handleRetry = useCallback(() => {
    setScannedCode(null);
    setExtractedProductCode(null);
    setError(null);
    // Restart scanner
    if (scannerRef.current && containerRef.current) {
      scannerRef.current
        .start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          handleSuccessfulScan,
          () => {
            /* ignore errors during scanning */
          }
        )
        .catch((err) => {
          setError(`Kon camera niet starten: ${err.message}`);
        });
    }
  }, [handleSuccessfulScan]);

  useEffect(() => {
    const scannerId = 'barcode-scanner';
    let mounted = true;

    const startScanner = async () => {
      try {
        // Check if camera is available
        const devices = await Html5Qrcode.getCameras();
        if (!mounted) return;

        if (devices.length === 0) {
          setError('Geen camera gevonden op dit apparaat');
          setIsStarting(false);
          return;
        }

        setHasPermission(true);

        // Create scanner instance
        const scanner = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
          ],
          verbose: false,
        });
        scannerRef.current = scanner;

        // Start scanning
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
          },
          handleSuccessfulScan,
          () => {
            /* ignore errors during scanning */
          }
        );

        if (mounted) {
          setIsStarting(false);
        }
      } catch (err) {
        if (!mounted) return;

        const error = err as Error;
        if (
          error.message?.includes('Permission') ||
          error.name === 'NotAllowedError'
        ) {
          setHasPermission(false);
          setError(
            'Camera toegang geweigerd. Sta camera toegang toe in je browserinstellingen.'
          );
        } else {
          setError(`Kon scanner niet starten: ${error.message}`);
        }
        setIsStarting(false);
      }
    };

    startScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {
          /* ignore cleanup errors */
        });
      }
    };
  }, [handleSuccessfulScan]);

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black">
        <h2 className="text-white text-lg font-bold">Scan IKEA Barcode</h2>
        <button
          onClick={onClose}
          className="text-white p-2 hover:bg-gray-800 rounded"
          aria-label="Sluiten"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {isStarting && (
          <div className="text-white text-center mb-4">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
            <p>Camera starten...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-500 text-white p-4 rounded-lg max-w-sm text-center mb-4">
            <p>{error}</p>
            {hasPermission === false && (
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-white text-red-500 rounded font-medium"
              >
                Sluiten
              </button>
            )}
          </div>
        )}

        {/* Scanner container */}
        <div
          ref={containerRef}
          id="barcode-scanner"
          className="w-full max-w-md aspect-video bg-gray-900 rounded-lg overflow-hidden"
          style={{ display: extractedProductCode ? 'none' : 'block' }}
        />

        {/* Success state */}
        {extractedProductCode && (
          <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center">
            <div className="text-green-500 mb-4">
              <svg
                className="w-16 h-16 mx-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Barcode gescand!
            </h3>
            <p className="text-sm text-gray-600 mb-1">Gescande code:</p>
            <p className="text-xs text-gray-400 mb-3 font-mono">{scannedCode}</p>
            <p className="text-sm text-gray-600 mb-1">IKEA Productcode:</p>
            <p className="text-2xl font-bold text-gray-900 mb-4 font-mono">
              {extractedProductCode.replace(/(\d{3})(\d{3})(\d{2})/, '$1.$2.$3')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 px-4 py-3 border-2 border-gray-900 text-gray-900 font-bold hover:bg-gray-100 transition-colors"
              >
                Opnieuw scannen
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-black text-white font-bold hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
              >
                {isLoading ? 'Laden...' : 'Vergelijk prijzen'}
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!extractedProductCode && !error && (
          <div className="mt-4 text-white text-center max-w-sm">
            <p className="text-sm">
              Richt de camera op de barcode van een IKEA product. De barcode
              staat meestal op het prijskaartje of de verpakking.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
