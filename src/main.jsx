import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import { BrowserRouter, Routes, Route } from "react-router";

import App from './App.jsx';
import Item from './pages/Item.jsx';
import List from './pages/List.jsx';

import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';
import theme from './constants/theme.js';

const root = document.getElementById("root");

createRoot(root).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <ThemeProvider theme={theme}>
        <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />}>
              <Route index element={<List />} />
              <Route path="items" element={<Item />} >
                <Route path=":itemId" element={<Item />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
);
