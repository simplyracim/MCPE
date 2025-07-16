import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { globalStyles } from './styles/theme';
import Layout from './components/Layout';
import './index.css';

// Import views
import Home from './views/home';
import Login from './views/login';
import Products from './views/products';
import ProductForm from './views/ProductForm';

// Apply global styles
globalStyles();

// Simple auth check - replace with your actual auth logic
const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};

// Protected route component
const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  
  // if (!isAuthenticated()) {
  //   return <Navigate to="/login" state={{ from: location }} replace />;
  // }
  
  return children;
};

const AppRoutes = () => {
  const location = useLocation();
  const noLayoutRoutes = ['/login'];
  const shouldShowLayout = !noLayoutRoutes.some(route => location.pathname.startsWith(route));

  if (!shouldShowLayout) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Product Routes */}
          <Route path="/products" element={<Products />} />
          <Route path="/products/new" element={<ProductForm />} />
          <Route path="/products/:id/edit" element={<ProductForm />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
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
