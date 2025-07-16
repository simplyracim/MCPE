import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { globalStyles } from './styles/theme';
import Layout from './components/Layout';

// Import views
import Home from './views/home';
import Login from './views/login';

// Apply global styles
globalStyles();

const AppRoutes = () => {
  const location = useLocation();
  const noLayoutRoutes = ['/login'];
  const shouldShowLayout = !noLayoutRoutes.includes(location.pathname);

  if (!shouldShowLayout) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Layout>
  );
};

// Create root and render the app
const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <Router>
      <AppRoutes />
    </Router>
  </React.StrictMode>
);
