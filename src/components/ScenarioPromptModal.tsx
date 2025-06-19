import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ScenarioPromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onYes: () => void;
  onNo: () => void;
}

export const ScenarioPromptModal = ({ open, onOpenChange, onYes, onNo }: ScenarioPromptModalProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white rounded-xl shadow-lg max-w-md text-center">
        <AlertDialogHeader className="mb-6">
          <AlertDialogTitle className="text-2xl font-bold text-blue-700">
            ✨ Imagine New Possibilities
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 mt-2">
            You have no active scenarios yet. Would you like to spark some creative ideas?
            <p className="text-sm mt-3 text-gray-500">
              Choose "Yes" to craft exciting new directions, or "No" to move forward with open exploration.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex justify-center gap-4">
          <Button
            onClick={onYes}
            variant="default"
            className="bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            🌟 Yes, Let's Create
          </Button>
          <Button
            onClick={onNo}
            variant="outline"
            className="border-gray-300"
          >
            Skip for Now
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

