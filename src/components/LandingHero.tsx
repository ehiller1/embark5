import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { AuthModal } from "@/components/AuthModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { useUserProfile } from "@/integrations/lib/auth/UserProfileProvider";
import { ArrowRight, ImageOff } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import heroImage from '../assets/hero-image.png';

export function LandingHero() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);
  
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { 
    profile: userProfile, 
    isLoading: profileLoading, 
    hasProfile 
  } = useUserProfile();

  const isLoading = authLoading || profileLoading;
  const navigate = useNavigate();
  
  const navigateBasedOnRole = (role: string | null) => {
    console.log(`[LandingHero] Navigating based on role: ${role}`);
    if (role === 'Clergy' || role === 'Admin') {
      navigate('/clergy-home');
    } else if (role === 'Parish') {
      navigate('/parish-home');
    } else {
      // Fallback for other roles or if role is null/undefined
      navigate('/clergy-home'); // Defaulting to clergy home as a safe fallback
    }
  };

  // Handle navigation after successful authentication and profile loading
  useEffect(() => {
    if (isAuthenticated && hasProfile && userProfile && !hasNavigated) {
      console.log('[LandingHero] User authenticated with profile loaded, navigating...');
      setHasNavigated(true);
      navigateBasedOnRole(userProfile.role);
    }
  }, [isAuthenticated, hasProfile, userProfile, hasNavigated, navigate]);

  const handleStartJourney = () => {
    console.log('[LandingHero] <Begin> button clicked');
    localStorage.removeItem('conversation_messages');
    localStorage.removeItem('community_assessment_messages');
    localStorage.removeItem('church_assessment_messages');

    if (isAuthenticated && hasProfile && userProfile) {
      console.log('[LandingHero] User is authenticated with profile, navigating directly.');
      navigateBasedOnRole(userProfile.role);
    } else {
      console.log('[LandingHero] User not authenticated or profile not loaded, showing auth modal.');
      setShowAuthModal(true);
    }
  };
  
  const handleLoginSuccess = () => {
    console.log('[LandingHero] Login successful callback - modal will close, navigation handled by useEffect.');
    // Navigation is now handled by the useEffect above, so we don't need to do anything here
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };
  
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };
  
  return (
    <div className="relative flex items-start justify-center min-h-screen px-4 py-16 bg-soft-light">
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h1 className="text-5xl font-bold text-[#c46659]">
            Reflective Spirit
          </h1>
          <h2 className="text-2xl text-[#c46659] mb-4">
            Equiping faith communities for the future
          </h2>
          <div className="space-y-4 text-gray-700">
            <p>
              Welcome! Reflective Spirit helps us journey through a process of discernment and renewal.
            </p>
            <p>
              Through contemplative conversation and innovative thinking, you can help us build a discernment plan informed by your community and guided by God.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleStartJourney} 
              className="px-8 py-3 text-lg bg-[#47799f] text-white hover:bg-[#47799f]/90 hover:shadow-lg transition-all"
              disabled={isLoading}
            >
              {isLoading ? (
                <LoadingSpinner className="mr-2" />
              ) : (
                <>
                  {isAuthenticated ? "Begin" : "Ready to begin?"} <ArrowRight className="ml-2" />
                </>
              )}
            </Button>
            <Button 
              onClick={() => navigate('/viability')} 
              className="px-8 py-3 text-lg border border-[#47799f] text-[#47799f] bg-transparent hover:bg-[#47799f]/10 transition-all"
              variant="outline"
            >
              Uncertain about starting?
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-center p-4 bg-white rounded-lg shadow-lg">
          {imageLoading && <LoadingSpinner className="h-16 w-16" />}
          {imageError && !imageLoading && (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <ImageOff className="h-16 w-16 mb-2" />
              <span>Image failed to load</span>
            </div>
          )}
          <img
            src={heroImage}
            alt="Modern church building in urban setting"
            className={`rounded-md object-cover ${imageLoading || imageError ? 'hidden' : 'block'}`}
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        </div>
      </div>
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
