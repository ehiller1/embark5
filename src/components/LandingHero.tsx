import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { AuthModal } from "@/components/AuthModal";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { ArrowRight, ImageOff } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
// Import the image from src/assets - this is the recommended Vite way
import heroImage from '../assets/hero-image.png';

export function LandingHero() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [journeyAttempted, setJourneyAttempted] = useState(false);
  // Use our combined auth hook for proper role-based access
  const {
    isAuthenticated,
    profile: userProfile,
    isLoading: profileLoading
  } = useUserRole();
  const navigate = useNavigate();
  
  const handleStartJourney = () => {
    console.log('[LandingHero] <Begin> button clicked');
    // Clear any existing conversation state
    localStorage.removeItem('conversation_messages');
    localStorage.removeItem('community_assessment_messages');
    localStorage.removeItem('church_assessment_messages');

    console.log('[LandingHero] Authentication state at click:', {
      isAuthenticated,
      userProfile,
      profileLoading
    });

    // Always set journey attempted to trigger the effect
    setJourneyAttempted(true);

    // If not authenticated, show auth modal immediately
    if (!isAuthenticated) {
      console.log('[LandingHero] User not authenticated, showing auth modal');
      setShowAuthModal(true);
      return;
    }

    // If authenticated but profile is still loading, the effect will handle it
    if (profileLoading) {
      console.log('[LandingHero] Profile is still loading, waiting...');
      return;
    }
  };
  
  useEffect(() => {
    // Only proceed if we have a journey attempt in progress
    if (!journeyAttempted) return;

    console.log('[LandingHero] Effect running with state:', {
      journeyAttempted,
      isAuthenticated,
      profileLoading,
      hasUserProfile: !!userProfile,
      userRole: userProfile?.role
    });

    // If profile is still loading, wait for it
    if (isAuthenticated && profileLoading) {
      console.log('[LandingHero] Waiting for profile to load...');
      return;
    }

    // Handle navigation based on authentication and profile state
    if (isAuthenticated && userProfile?.role) {
      // Determine the correct home page based on user role
      const targetRoute = userProfile.role === 'Parish' 
        ? '/parish-home' 
        : '/clergy-home';
      
      console.log(`[LandingHero] Navigating to ${targetRoute} for role:`, userProfile.role);
      navigate(targetRoute);
    } else if (isAuthenticated) {
      // User is authenticated but has no role assigned
      console.warn('[LandingHero] Authenticated user has no role assigned, defaulting to /clergy-home');
      navigate('/clergy-home');
    } else {
      // Not authenticated, show login modal
      console.log('[LandingHero] User not authenticated, showing auth modal');
      setShowAuthModal(true);
    }

    // Reset the journey attempt to allow future navigation
    setJourneyAttempted(false);
  }, [journeyAttempted, isAuthenticated, profileLoading, userProfile, navigate]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.error("Failed to load hero image:", {
      src: target.src,
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight,
      complete: target.complete,
      currentSrc: target.currentSrc
    });
    setImageError(true);
    setImageLoading(false);
  };
  
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    console.log("Image loaded successfully:", {
      src: target.src,
      naturalWidth: target.naturalWidth,
      naturalHeight: target.naturalHeight
    });
    setImageLoading(false);
    setImageError(false);
  };
  
  return <div className="relative flex items-start justify-center min-h-screen px-4 py-16 bg-soft-light">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-journey-darkRed">
            Reflective Spirit
          </h1>
          
          <h2 className="text-2xl text-journey-red mb-4">
            Reimagining faith communities for the future
          </h2>
          
          <div className="space-y-4 text-gray-700">
            <p>Welcome! Reflective Spirit helps us journey through a process of discernment and renewal. 

          </p>
            
            <p>Through contemplative conversation and innovative thinking, you can help us build a discernment plan informed by our community and guided by God.</p>
          
            
          
          </div>
          
          <Button onClick={handleStartJourney} className="mt-6 px-8 py-3 text-lg bg-journey-pink text-white hover:opacity-90 transition-all">
            {isAuthenticated ? "Begin" : "Where are you led?"} <ArrowRight className="ml-2" />
          </Button>
        </div>

        <div className="relative min-h-[300px] flex items-center justify-center">
          {imageLoading && <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-xl">
              <LoadingSpinner size="lg" text="Loading image..." />
            </div>}
          {imageError ? <div className="flex flex-col items-center justify-center h-full w-full bg-gray-100 rounded-xl p-8">
              <ImageOff className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-gray-500">Image could not be loaded</p>
            </div> : <img 
              alt="Modern church building in urban setting" 
              onError={handleImageError} 
              onLoad={handleImageLoad} 
              loading="eager" 
              className="rounded-xl shadow-lg w-full h-auto max-w-[600px]" 
              src={heroImage} 
            />}
        </div>
      </div>
      
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>;
}
