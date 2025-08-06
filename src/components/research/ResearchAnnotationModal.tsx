import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Save, 
  Search, 
  Tag, 
  FileText, 
  MessageSquare, 
  X,
  Plus
} from 'lucide-react';
import { SearchResult, Note } from '@/types/research';
import { useToast } from '@/hooks/use-toast';

interface ResearchAnnotationModalProps {
  open: boolean;
  onClose: () => void;
  searchResult: SearchResult | null;
  activeCategory: string;
  onSave: (annotation: {
    content: string;
    notes: string;
    tags: string[];
    category: string;
  }) => void;
  onSaveAndContinue: (annotation: {
    content: string;
    notes: string;
    tags: string[];
    category: string;
  }) => void;
}

export function ResearchAnnotationModal({
  open,
  onClose,
  searchResult,
  activeCategory,
  onSave,
  onSaveAndContinue,
}: ResearchAnnotationModalProps) {
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (open && searchResult) {
      // Reset form when modal opens
      setNotes('');
      setTags([]);
      setNewTag('');
      setSelectedText('');
    }
  }, [open, searchResult]);

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  const handleSave = () => {
    if (!searchResult) return;
    
    if (!notes.trim()) {
      toast({
        title: 'Notes required',
        description: 'Please add some notes about this research item.',
        variant: 'destructive'
      });
      return;
    }

    const annotation = {
      content: searchResult.snippet,
      notes: notes.trim(),
      tags,
      category: activeCategory,
    };

    onSave(annotation);
    onClose();
  };

  const handleSaveAndContinue = () => {
    if (!searchResult) return;
    
    if (!notes.trim()) {
      toast({
        title: 'Notes required',
        description: 'Please add some notes about this research item.',
        variant: 'destructive'
      });
      return;
    }

    const annotation = {
      content: searchResult.snippet,
      notes: notes.trim(),
      tags,
      category: activeCategory,
    };

    onSaveAndContinue(annotation);
    onClose();
  };

  if (!searchResult) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {searchResult.type === 'ai' ? (
              <MessageSquare className="h-5 w-5 text-purple-600" />
            ) : (
              <FileText className="h-5 w-5 text-blue-600" />
            )}
            Annotate Research Item
            <Badge variant="outline" className="ml-2">
              {activeCategory}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex gap-6 min-h-0">
          {/* Left Panel - Content Preview */}
          <div className="flex-1 flex flex-col min-h-0">
            <h3 className="font-medium mb-3">Content Preview</h3>
            <Card className="flex-1 min-h-0">
              <CardContent className="p-4 h-full">
                <ScrollArea className="h-full">
                  <div onMouseUp={handleTextSelection}>
                    {searchResult.type === 'ai' ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-purple-700">
                          <MessageSquare className="h-4 w-4" />
                          <span className="font-medium">AI Insight</span>
                        </div>
                        <p className="text-sm leading-relaxed">
                          {searchResult.snippet}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="font-medium text-blue-700">
                          {searchResult.title}
                        </h4>
                        <p className="text-sm leading-relaxed">
                          {searchResult.snippet}
                        </p>
                        {searchResult.link && (
                          <div className="pt-2 border-t">
                            <a 
                              href={searchResult.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline"
                            >
                              View original source →
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
            
            {selectedText && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 font-medium mb-1">Selected Text:</p>
                <p className="text-sm italic">"{selectedText}"</p>
              </div>
            )}
          </div>

          <Separator orientation="vertical" />

          {/* Right Panel - Annotation Tools */}
          <div className="w-80 flex flex-col gap-4">
            <h3 className="font-medium">Add Your Notes</h3>
            
            {/* Notes Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes & Analysis</label>
              <Textarea
                placeholder="What insights does this provide? How does it relate to your community research goals?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            {/* Tags Section */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddTag}
                  disabled={!newTag.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Quick Tags</label>
              <div className="flex flex-wrap gap-1">
                {['Key Insight', 'Demographics', 'Opportunity', 'Challenge', 'Resource'].map((quickTag) => (
                  <Button
                    key={quickTag}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      if (!tags.includes(quickTag)) {
                        setTags([...tags, quickTag]);
                      }
                    }}
                    disabled={tags.includes(quickTag)}
                  >
                    {quickTag}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save & Close
          </Button>
          <Button onClick={handleSaveAndContinue} className="bg-[#47799f] hover:bg-[#47799f]/90">
            <Search className="h-4 w-4 mr-2" />
            Save & Continue Searching
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
