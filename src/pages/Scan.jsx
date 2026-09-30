import { Box, Button, Checkbox, FormControlLabel, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import useQrCodeScanner from '../hooks/useQrcodeScanner';

const SCANNER_CONFIG = { fps: 45 };

const Scan = () => {
  const navigate = useNavigate();
  const [autoScan, setAutoScan] = useState(localStorage.getItem('autoScan') === 'true');
  const [permissionDenied, setPermissionDenied] = useState(false);

  const { startScanner, pauseScanner, decodedText, error } = useQrCodeScanner(
    'reader',
    (decodedText, decodedResult) => {
      // Handle on success condition with the decoded text or result.
      console.log(`Scan result: ${decodedText}`, decodedResult);
      navigate('/items', { state: { code: decodedText }, replace: true });
    },
    undefined,
    SCANNER_CONFIG,
  );

  useEffect(() => {
    if (error && (error.includes('NotAllowedError') || error.includes('Permission'))) {
      if (sessionStorage.getItem('cameraDenied')) {
        setPermissionDenied(true);
      } else {
        sessionStorage.setItem('cameraDenied', 'true');
        navigate('/items', { replace: true });
      }
    }
  }, [error, navigate]);

  useEffect(() => {
    startScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (decodedText) {
      pauseScanner(true);
    }
  }, [pauseScanner, decodedText]);

  return (
    <Box className="space-y-4 flex flex-col w-full h-full">
      {permissionDenied ? (
        <Box className="w-full h-100 flex flex-col justify-center items-center p-4 space-y-4">
          <Typography variant="h6" align="center">
            相機權限已被拒絕
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary">
            請將App徹底關閉後重新開啟，以授與相機權限。
          </Typography>
          <Button variant="contained" onClick={() => navigate('/items', { replace: true })}>
            手動前往編輯頁面
          </Button>
        </Box>
      ) : (
        <Box
          id="reader"
          className="w-full h-100 flex justify-center items-center object-cover"
          sx={{ '& video': { width: '100%', height: '100%', objectFit: 'cover' } }}
        />
      )}
      <Box className="w-full flex justify-center">
        <FormControlLabel
          control={
            <Checkbox
              checked={autoScan}
              onChange={(e) => {
                setAutoScan(e.target.checked);
                localStorage.setItem('autoScan', e.target.checked);
              }}
              color="primary"
            />
          }
          label="自動進入掃描模式"
        />
      </Box>
    </Box>
  );
};

export default Scan;
