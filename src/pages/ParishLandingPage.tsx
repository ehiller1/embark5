import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { AuthModal } from "@/components/AuthModal";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/integrations/lib/auth/AuthProvider";
import { useUserProfile } from "@/integrations/lib/auth/UserProfileProvider";
import { ArrowRight, ImageOff } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import heroImage from '../assets/hero-image.png';
// MainLayout is provided by App.tsx router structure

export function ParishLandingPage() {
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
  
  const navigateToParishHome = () => {
    console.log('[ParishLandingPage] Navigating to parish home');
    navigate('/parish-home');
  };

  // Handle navigation after successful authentication and profile loading
  useEffect(() => {
    if (isAuthenticated && hasProfile && userProfile && !hasNavigated) {
      console.log('[ParishLandingPage] User authenticated with profile loaded, navigating...');
      setHasNavigated(true);
      navigateToParishHome();
    }
  }, [isAuthenticated, hasProfile, userProfile, hasNavigated, navigate]);

  const handleStartJourney = () => {
    console.log('[ParishLandingPage] <Begin> button clicked');
    localStorage.removeItem('conversation_messages');
    localStorage.removeItem('community_assessment_messages');
    localStorage.removeItem('church_assessment_messages');

    if (isAuthenticated && hasProfile && userProfile) {
      console.log('[ParishLandingPage] User is authenticated with profile, navigating directly.');
      navigateToParishHome();
    } else {
      console.log('[ParishLandingPage] User not authenticated or profile not loaded, showing auth modal.');
      setShowAuthModal(true);
    }
  };
  
  const handleLoginSuccess = () => {
    console.log('[ParishLandingPage] Login successful callback - modal will close, navigation handled by useEffect.');
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
              Community Portal
            </h1>
            <h2 className="text-2xl text-[#c46659] mb-4">
              Supporting your community
            </h2>
            <div className="space-y-4 text-gray-700">
              <p>
                Welcome to the Community Portal! This space is designed specifically for community members and leaders.
              </p>
              <p>
                Through this portal, you can access resources, complete surveys, and contribute to your church's discernment process.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => navigate('/parish-resources')} 
                className="px-8 py-3 text-lg border border-[#47799f] text-[#47799f] bg-transparent hover:bg-[#47799f]/10 transition-all"
                variant="outline"
              >
                View Resources
              </Button>
              <Button 
                onClick={handleStartJourney} 
                className="px-8 py-3 text-lg bg-[#47799f] text-white hover:bg-[#47799f]/90 hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner className="mr-2" />
                ) : (
                  <>
                    {isAuthenticated ? "Enter Community Portal" : "Sign In"} <ArrowRight className="ml-2" />
                  </>
                )}
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
              alt="Parish community gathering"
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

export default ParishLandingPage;
