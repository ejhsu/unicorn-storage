import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A React hook for using the html5-qrcode library.
 *
 * @param {string} elementId - The ID of the DOM element to render the scanner in.
 * @param {object} config - The configuration object for Html5Qrcode.
 * @param {function} qrCodeSuccessCallback - Optional callback for successful scans.
 * @param {function} qrCodeErrorCallback - Optional callback for errors during scanning.
 * @param {boolean} verbose - If true, logs verbose output to the console.
 * @returns {object} An object containing decodedText, error, and functions to start and stop the scanner.
 */
const useQrCodeScanner = (elementId, qrCodeSuccessCallback, qrCodeErrorCallback, config = {}, verbose = false) => {
  const [decodedText, setDecodedText] = useState('');
  const [error, setError] = useState(null);
  const html5QrcodeRef = useRef(null);

  // Memoize the success callback
  const onScanSuccess = useCallback(
    (decodedText, decodedResult) => {
      if (verbose) {
        console.log(`Scan successful: ${decodedText}`, decodedResult);
      }
      setDecodedText(decodedText);
      setError(null);
      if (qrCodeSuccessCallback) {
        qrCodeSuccessCallback(decodedText, decodedResult);
      }
    },
    [verbose, qrCodeSuccessCallback],
  );

  // Memoize the error callback
  const onScanError = useCallback(
    (errorMessage) => {
      // Non-fatal errors are logged but not set as state to avoid UI clutter.
      if (verbose) {
        console.error(`QR Code scan error: ${errorMessage}`);
      }
      if (qrCodeErrorCallback) {
        qrCodeErrorCallback(errorMessage);
      }
    },
    [verbose, qrCodeErrorCallback],
  );

  const startScanner = useCallback(async () => {
    const qrcode = html5QrcodeRef.current;
    if (!qrcode) {
      const startError = 'Html5Qrcode not initialized.';
      setError(startError);
      console.error(startError);
      return;
    }

    try {
      if (qrcode.getState() === Html5QrcodeScannerState.SCANNING) {
        return;
      }

      await qrcode.start({ facingMode: 'environment' }, config, onScanSuccess, onScanError);
    } catch (err) {
      const startError = `Failed to start scanner: ${err.message}`;
      setError(startError);
      console.error(startError, err);
    }
  }, [config, onScanSuccess, onScanError]);

  const stopScanner = useCallback(async () => {
    const qrcode = html5QrcodeRef.current;
    if (qrcode && qrcode.getState() === Html5QrcodeScannerState.SCANNING) {
      try {
        await qrcode.stop();
      } catch (err) {
        console.error('Failed to stop the scanner.', err);
      }
    }
  }, []);

  const pauseScanner = useCallback(async (shouldPauseVideo) => {
    const qrcode = html5QrcodeRef.current;
    if (qrcode && qrcode.getState() === Html5QrcodeScannerState.SCANNING) {
      try {
        await qrcode.pause(shouldPauseVideo);
      } catch (err) {
        console.error('Failed to pause the scanner.', err);
      }
    }
  }, []);

  // Effect to initialize and clean up the scanner
  useEffect(() => {
    if (!html5QrcodeRef.current) {
      html5QrcodeRef.current = new Html5Qrcode(elementId, {
        verbose,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
        ],
      });
    }

    const qrcode = html5QrcodeRef.current;

    // Cleanup function to stop the scanner when the component unmounts
    return () => {
      if (qrcode && qrcode.getState() === Html5QrcodeScannerState.SCANNING) {
        qrcode.stop().catch((err) => {
          console.error('Failed to stop the scanner on cleanup.', err);
        });
      }
    };
  }, [elementId, verbose]);

  return { decodedText, error, startScanner, stopScanner, pauseScanner, Html5Qrcode };
};

export default useQrCodeScanner;
