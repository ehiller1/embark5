import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface DataConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DataConsentModal({ isOpen, onClose }: DataConsentModalProps) {
  const [userConsent, setUserConsent] = useState(false);
  const navigate = useNavigate();

  const handleContinue = () => {
    // Store consent in localStorage to prevent showing again
    localStorage.setItem("journeyDataConsent", "true");
    onClose();
    navigate("/module-explanation");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">Understand What Happens to Your Data</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Review how we handle your data and what you tell us.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p>
            This platform uses artificial intelligence to help understand the many perspectives of your parish family.  We use artificial intelligence to help your parish family reach a shared path for moving forward as a community faith, confronting difficult decisions along the way. The artificial intelligence in this application will, at times, ask tough questions, respond pastorally, or use research and knowledge from other church experiences to guide you through a process.
          </p>
          
          <p>
            Everything that you say is NOT captured and it cannot be traced back to you in a way that your comments can be attributed to you.
          </p>
          
          <p>
            But the system learns about your opinions and works to synthesize your point of view, concerns, hopes, and prayerful reflections, and build the best path forward that it can recommend to you and your parish family.
          </p>
          
          <div className="flex items-center space-x-2 pt-4 border-t">
            <Switch 
              id="consent-switch" 
              checked={userConsent} 
              onCheckedChange={setUserConsent}
              className={userConsent ? "bg-journey-pink" : ""}
            />
            <Label htmlFor="consent-switch" className="font-semibold">I AGREE to these terms</Label>
          </div>
        </div>
        
        <div className="flex justify-center">
          <Button 
            onClick={handleContinue} 
            disabled={!userConsent}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
