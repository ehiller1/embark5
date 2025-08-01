import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
    <div className="h-full flex flex-col w-full">
      <Card className="h-full flex flex-col w-full">
        <CardContent className="flex flex-col space-y-4 min-h-0">
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

          <div className="max-h-[70vh] overflow-auto">
            <div className="flex-1 min-h-0 overflow-auto space-y-4">
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
