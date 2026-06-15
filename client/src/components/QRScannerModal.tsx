import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setError(null);
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        config,
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        (decodedText) => {
          // On success
          console.log("Scanned:", decodedText);
          scanner.clear();
          onClose();
          let targetId = decodedText;
          try {
            if (decodedText.startsWith('http')) {
              const url = new URL(decodedText);
              // if it's equipment?id=XYZ or requests/new?equipmentId=XYZ
              const idParam = url.searchParams.get('id') || url.searchParams.get('equipmentId');
              if (idParam) {
                targetId = idParam;
              }
            }
          } catch (e) {}
          navigate(`/equipment?id=${encodeURIComponent(targetId)}`);
        },
        (errorMessage) => {
          // Only log actual errors, not "Not Found" frame warnings
          if (errorMessage && !errorMessage.includes("NotFound")) {
             console.warn(errorMessage);
          }
        }
      );
    } else {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, [isOpen, navigate, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity dark:bg-gray-900 dark:bg-opacity-80" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white dark:bg-slate-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
          <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              className="rounded-md bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
              <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                Scan Equipment QR Code
              </h3>
              {error && (
                <div className="mb-4 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}
              <div id="qr-reader" className="w-full mx-auto" style={{ minHeight: '300px' }}></div>
              <p className="mt-4 text-sm text-gray-500 dark:text-slate-400 text-center">
                Point your camera at the QR code affixed to the physical equipment.
              </p>
            </div>
          </div>
          
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-slate-700 dark:text-slate-200 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-slate-600 sm:mt-0 sm:w-auto"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScannerModal;
