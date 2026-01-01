import './index.css';

import GlobalStyles from '@mui/material/GlobalStyles';
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router';

import App from './App.jsx';
import theme from './constants/theme.js';
import Item from './pages/Item.jsx';
import List from './pages/List.jsx';
import Scan from './pages/Scan.jsx';

const root = document.getElementById('root');

createRoot(root).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <ThemeProvider theme={theme}>
        <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<List />} />
              <Route path="items" element={<Outlet />}>
                <Route path="scan" element={<Scan />} />
                <Route path=":itemId" element={<Item />} />
                <Route path="" element={<Item />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
);
