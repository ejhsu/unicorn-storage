import { Box, Checkbox, FormControlLabel } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import useQrCodeScanner from "../hooks/useQrcodeScanner";

const Scan = () => {

  const navigate = useNavigate();
  const [autoScan, setAutoScan] = useState(localStorage.getItem('autoScan') === 'true');
  const { startScanner, pauseScanner, decodedText } = useQrCodeScanner(
    "reader",
    (decodedText, decodedResult) => {
      // Handle on success condition with the decoded text or result.
      console.log(`Scan result: ${decodedText}`, decodedResult);
      navigate('/items', { state: { code: decodedText }, replace: true });
    },
    { fps: 45 },
    false,
  );

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
      <Box id="reader" className="w-full h-100 flex justify-center items-center object-cover" sx={{ '& video': { width: '100%', height: '100%', objectFit: 'cover' } }} />
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