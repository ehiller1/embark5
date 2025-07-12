
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMissionalAvatars } from '@/hooks/useMissionalAvatars';
import { toast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/lib/supabase';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { saveVocationalStatement } from '@/utils/dbUtils';
import { VocationalFilter, VocationalStatement, VocationalDialogProps } from '@/types/NarrativeTypes';

export function VocationalStatementDialog({
  isOpen,
  onClose,
  onSave,
  narrativeContext,
  initialStatementData,
  mode = 'add',
  avatarRole,
  isLoading = false,
  selectedStatements = []
}: VocationalDialogProps) {
  // Use avatar role for conditional rendering or specific behavior if needed
  const currentRole = avatarRole || initialStatementData?.avatar_role || 'system';
  
  // Get initial content based on mode and available data
  const getInitialContent = () => {
    if (mode === 'adapt' && selectedStatements && selectedStatements.length > 0) {
      // For adapt mode, combine selected statements into a starter template
      return selectedStatements
        .map(stmt => {
          const content = 'content' in stmt ? stmt.content : '';
          return content ? `- ${content}\n` : '';
        })
        .filter(Boolean)
        .join('\n');
    }
    return initialStatementData?.content || narrativeContext || '';
  };
  
  const [statementContent, setStatementContent] = useState(getInitialContent());
  const [filterName, setFilterName] = useState(
    mode === 'adapt' && selectedStatements?.length ? 
      `Combined from ${selectedStatements.length} statements` : 
      initialStatementData?.name || ''
  );
  const [isSaving, setIsSaving] = useState(false);
  const { addMissionalAvatar, selectMissionalAvatar } = useMissionalAvatars();
  const { user } = useAuth();

  const handleSave = async () => {
    if (!filterName.trim()) {
      toast({
        title: "Name Required",
        description: "Please provide a name for this vocational statement.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Create the vocational statement object
      const vocationalStatement: VocationalStatement = {
        id: initialStatementData?.id || uuidv4(),
        name: filterName,
        content: statementContent,
        createdAt: initialStatementData?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        resourceType: 'narrative_statement',
        category: 'narrative'
      };

      // Create a standardized vocational statement object for storage
      const vocationalObject = {
        mission_statement: statementContent,
        name: filterName,
        createdAt: new Date().toISOString()
      };
      
      // For add and edit modes, save to resource library and localStorage using utility function
      if (mode !== 'adapt' && user?.id) {
        if (mode === 'edit' && initialStatementData?.id) {
          // For edit mode, we need to handle the update separately since our utility doesn't support updates yet
          await supabase
            .from('resource_library')
            .update({
              title: filterName,
              content: JSON.stringify(vocationalObject),
              resource_type: 'vocational_statement',
              updated_at: new Date().toISOString()
            })
            .eq('id', initialStatementData.id);
            
          // Still use the utility to update localStorage in a standardized way
          await saveVocationalStatement(JSON.stringify(vocationalObject), user.id);
        } else {
          // For add mode, use the utility function to save to both localStorage and database
          await saveVocationalStatement(JSON.stringify(vocationalObject), user.id);
        }
      } else {
        // For adapt mode or when user is not available, just save to localStorage
        localStorage.setItem('vocational_statement', JSON.stringify(vocationalObject));
      }
      
      // Create missional avatar only in add mode and if statement content is valid
      if (mode === 'add' && statementContent.trim()) {
        const missionalAvatarName = `${filterName} (Missional Perspective)`;
        const missionalPerspective = `As a church with this vocational calling: ${statementContent.trim()}, we approach mission with these values, priorities, and commitments. We see our community through this lens and believe God is calling us to engage with our neighbors in ways that reflect this vocational identity.`;
        
        const missionalAvatar = {
          id: uuidv4(),
          name: missionalAvatarName,
          role: "missional" as const,
          avatar_name: missionalAvatarName,
          avatar_point_of_view: missionalPerspective,
          description: `Created from vocational statement: ${filterName}`
        };
        
        // Add and select the new missional avatar
        const avatarAdded = addMissionalAvatar(missionalAvatar);
        
        if (avatarAdded) {
          // Select the newly created missional avatar
          selectMissionalAvatar(missionalAvatar);
          
          toast({
            title: "Aspirtion Created",
            description: "An apsiration avatar has been created from your vocational statement."
          });
        }
      }
      
      // Call the onSave callback with the statement data
      onSave(vocationalStatement);
      onClose();
    } catch (err) {
      console.error('Error saving vocational statement:', err);
      toast({
        title: "Error",
        description: "Failed to save vocational statement. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Determine dialog title based on mode and role
  const getDialogTitle = () => {
    const roleText = currentRole !== 'system' ? ` (${currentRole.charAt(0).toUpperCase() + currentRole.slice(1)})` : '';
    
    switch (mode) {
      case 'edit': return `Edit Vocational Statement${roleText}`;
      case 'adapt': return `Adapt Vocational Statement${roleText}`;
      default: return `Create Vocational Statement${roleText}`;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Edit your existing vocational statement.' : 
             mode === 'adapt' ? 'Adapt selected statements into a new vocational statement.' :
             'Create a vocational statement that reflects your church\'s calling and mission.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filterName">Statement Name</Label>
            <Input 
              id="filterName" 
              value={filterName} 
              onChange={(e) => setFilterName(e.target.value)} 
              placeholder="e.g., Community Service Mission"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="statementContent">Statement Content</Label>
            <Textarea 
              id="statementContent" 
              value={statementContent} 
              onChange={(e) => setStatementContent(e.target.value)} 
              placeholder="Describe your church's vocational calling and mission..."
              rows={6}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onClose()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving || isLoading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
