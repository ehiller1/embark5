
import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface WelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
}

export const WelcomeModal = ({ open, onOpenChange, onContinue }: WelcomeModalProps) => {
  const handleContinue = () => {
    console.log('[WelcomeModal] Continue button clicked');
    onContinue();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Set Up Your Narrative Avatars</AlertDialogTitle>
          <AlertDialogDescription className="py-4">
            <p className="mb-3">Welcome to the Vocation Discovery process. You'll now go through a 4-step process to select avatars:</p>
            <ol className="list-decimal pl-5 space-y-2">
              <li><span className="font-medium">Church Avatar:</span> Select an avatar that reflects your church's personality and perspective</li>
              <li><span className="font-medium">Community Avatar:</span> Choose an avatar that represents your target audience</li>
              <li><span className="font-medium">Companion Guide:</span> Pick a companion to help with your planning process</li>
              <li><span className="font-medium">Confirmation:</span> Review your selections before proceeding</li>
            </ol>
            <p className="mt-3">
              These avatars will help orient the planning and scenario building based on their unique points of view.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex justify-center">
          <Button onClick={handleContinue}>
            Begin Selection
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
};
