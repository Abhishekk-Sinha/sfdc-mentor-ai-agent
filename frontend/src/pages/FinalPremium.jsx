import React from 'react';
import { Navigate } from 'react-router-dom';

// Automation now runs silently from the main Layout component.
// This route is kept only for old links/bookmarks and redirects to Home Guide.
export function FinalPremium() {
  return <Navigate to="/dashboard" replace />;
}
