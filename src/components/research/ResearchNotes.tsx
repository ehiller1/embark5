
import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Save } from "lucide-react";

interface Note {
  id: string;
  category: string;
  content: string;
  timestamp: string;
}

interface ResearchNotesProps {
  notes: Note[];
  currentNote: string;
  onNoteChange: (note: string) => void;
  onSaveNote: () => void;
  onEditNote: (note: Note) => void;
  activeCategory: string | null;
}

export function ResearchNotes({
  notes,
  currentNote,
  onNoteChange,
  onSaveNote,
  onEditNote,
  activeCategory,
}: ResearchNotesProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">Research Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={currentNote}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder={activeCategory ? 'Add a note...' : 'Select a category'}
          className="min-h-[100px]"
          disabled={!activeCategory}
        />
        <Button 
          onClick={onSaveNote}
          disabled={!activeCategory || !currentNote.trim()}
          className="w-full"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Note
        </Button>
        
        <p className="text-xs text-muted-foreground">
          All notes are saved to local storage and will be used in the research summary.
        </p>

        <ScrollArea className="h-[calc(100vh-35rem)]">
          <div className="space-y-4">
            {notes.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                {activeCategory
                  ? "No notes yet. Create a note or click on a search result to add it."
                  : "Select a category to view and create notes."}
              </p>
            )}
            
            {notes.map((note) => (
              <Card key={note.id}>
                <CardContent className="p-4">
                  <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(note.timestamp).toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditNote(note)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
