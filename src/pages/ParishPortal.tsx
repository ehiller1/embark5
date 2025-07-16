import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import ParishLandingPage from './ParishLandingPage';

// This component simply renders the ParishLandingPage component
// It's a workaround for Vercel routing issues with the /parish path
export function ParishPortal() {
  // Log that this component rendered successfully
  useEffect(() => {
    console.log('ParishPortal component rendered successfully');
  }, []);
  
  // Just render the actual landing page component
  return <ParishLandingPage />;
}

export default ParishPortal;
