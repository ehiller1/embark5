import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

interface EditVocationalStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialContent: string;
  onSave: (editedContent: string) => Promise<void>; // Make onSave async to handle potential async operations
  isSaving?: boolean; // Optional prop to indicate saving state
}

export const EditVocationalStatementModal: React.FC<EditVocationalStatementModalProps> = ({
  isOpen,
  onClose,
  initialContent,
  onSave,
  isSaving = false,
}) => {
  const [editedContent, setEditedContent] = useState(initialContent);

  useEffect(() => {
    if (isOpen) {
      setEditedContent(initialContent);
    }
  }, [initialContent, isOpen]);

  const handleSave = async () => {
    if (!editedContent.trim()) {
      toast({
        title: 'Content Required',
        description: 'Vocational statement content cannot be empty.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await onSave(editedContent);
      // onClose(); // Let the parent component handle closing on successful save if needed
    } catch (error) {
      // Error handling is expected to be done by the onSave implementation in the parent
      // or display a generic error here if preferred.
      console.error('Failed to save edited vocational statement:', error);
      toast({
        title: 'Save Error',
        description: 'Failed to save the vocational statement. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Vocational Statement</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {/* If initialContent parses as JSON with known fields, show a structured layout, else fallback to textarea */}
          {(() => {
            let parsed: any = null;
            try {
              parsed = JSON.parse(editedContent);
            } catch (e) {}
            if (
              parsed &&
              (parsed.mission_statement || parsed.contextual_explanation || parsed.theological_justification || parsed.conclusion_and_future_outlook)
            ) {
              return (
                <div className="space-y-4">
                  {parsed.mission_statement && (
                    <div>
                      <div className="font-semibold text-base mb-1">Mission Statement</div>
                      <Textarea
                        value={parsed.mission_statement}
                        onChange={e => {
                          setEditedContent(JSON.stringify({ ...parsed, mission_statement: e.target.value, }, null, 2));
                        }}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  )}
                  {parsed.contextual_explanation && (
                    <div>
                      <div className="font-semibold text-base mb-1">Contextual Explanation</div>
                      <Textarea
                        value={parsed.contextual_explanation}
                        onChange={e => {
                          setEditedContent(JSON.stringify({ ...parsed, contextual_explanation: e.target.value, }, null, 2));
                        }}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  )}
                  {parsed.theological_justification && (
                    <div>
                      <div className="font-semibold text-base mb-1">Theological Justification</div>
                      <Textarea
                        value={parsed.theological_justification}
                        onChange={e => {
                          setEditedContent(JSON.stringify({ ...parsed, theological_justification: e.target.value, }, null, 2));
                        }}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  )}
                  {parsed.conclusion_and_future_outlook && (
                    <div>
                      <div className="font-semibold text-base mb-1">Conclusion & Future Outlook</div>
                      <Textarea
                        value={parsed.conclusion_and_future_outlook}
                        onChange={e => {
                          setEditedContent(JSON.stringify({ ...parsed, conclusion_and_future_outlook: e.target.value, }, null, 2));
                        }}
                        rows={2}
                        className="resize-none"
                      />
                    </div>
                  )}
                </div>
              );
            }
            // fallback
            return (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                placeholder="Edit your synthesized vocational statement here..."
                rows={15}
                className="resize-none"
              />
            );
          })()}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={isSaving || !editedContent.trim()}>
            {isSaving ? (
              <><div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" /> Saving...</>
            ) : (
              'Save Statement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
