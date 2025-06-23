import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from './useUserRole';
import { useToast } from './use-toast';
import { Database } from '@/types/supabase'; // Assuming @ is src

type ChurchProfileRow = Database['public']['Tables']['church_profile']['Row'];

export function useChurchProfile() {
  const [profile, setProfile] = useState<ChurchProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useUserRole();
  const { toast } = useToast();

  const fetchChurchProfile = useCallback(async (id: string) => {
    console.log(`%c[useChurchProfile] Step 2: Fetching church_profile for church_id: ${id}`, 'color: #FFA500;');
    try {
      const { data, error, status } = await supabase
        .from('church_profile')
        .select('*')
        .eq('church_id', id)
        .maybeSingle();

      if (error) {
        console.log(`%c[useChurchProfile] Supabase error while fetching church_profile. Status: ${status}`, 'color: red; font-weight: bold;', error);
        if (error.code !== 'PGRST116') { // PGRST116 means no rows found, which is okay.
          throw error;
        }
        console.log('%c[useChurchProfile] No profile found for this church, which is a normal case for new churches.', 'color: orange;');
        return null;
      }
      console.log('%c[useChurchProfile] Step 3: Successfully fetched church_profile data.', 'color: green; font-weight: bold;', data);
      return data;
    } catch (err) {
      console.log('%c[useChurchProfile] CRITICAL: An unexpected error occurred during fetchChurchProfile.', 'color: red; font-weight: bold;', err);
      setError(err instanceof Error ? err.message : 'A critical error occurred');
      return null;
    }
  }, []);

  // Function to save church profile data
  const saveChurchProfile = useCallback(async (profileData: Partial<ChurchProfileRow>) => {
    if (!churchId) {
      setError('Church ID is missing. Cannot save profile.');
      return { success: false, error: 'Church ID is missing' };
    }

    try {
      setSaving(true);
      
      // First check if a record exists for this church_id
      const { data: existingRecord, error: checkError } = await supabase
        .from('church_profile')
        .select('id')
        .eq('church_id', churchId)
        .maybeSingle();
      
      if (checkError) {
        console.error('Error checking existing record:', checkError);
        throw checkError;
      }
      
      let result;
      if (existingRecord) {
        // Update existing record
        console.log('[useChurchProfile] Updating existing record with id:', existingRecord.id);
        result = await supabase
          .from('church_profile')
          .update({
            ...profileData,
            church_id: churchId,
          })
          .eq('id', existingRecord.id);
      } else {
        // Insert new record
        console.log('[useChurchProfile] Inserting new record for church_id:', churchId);
        result = await supabase
          .from('church_profile')
          .insert({
            ...profileData,
            church_id: churchId,
          });
      }
      
      if (result.error) throw result.error;
      
      // Update the local state with new data
      setProfile(prev => {
        const newProfileData = { church_id: churchId, ...profileData } as ChurchProfileRow;
        return prev ? { ...prev, ...newProfileData } : newProfileData;
      });
      
      toast({ 
        title: "Success", 
        description: "Profile data saved successfully."
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error saving church profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to save church profile data');
      
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : 'An unknown error occurred', 
        variant: "destructive" 
      });
      
      return { success: false, error };
    } finally {
      setSaving(false);
    }
  }, [churchId, toast]);

  // Upload file to church_data table
  const uploadChurchData = useCallback(async (fileType: 'email_list_upload' | 'parochial_report_upload', file: File) => {
    if (!churchId) {
      setError('Church ID is missing. Cannot upload file.');
      return { success: false, error: 'Church ID is missing' };
    }

    try {
      setSaving(true);
      let result;

      if (fileType === 'email_list_upload') {
        // For email lists, we store the text content directly
        const emailTextContent = await file.text();
        const { error } = await supabase
          .from('church_data')
          .insert({
            church_id: churchId,
            data_type: fileType,
            text_data: emailTextContent,
            file_name: file.name,
            mime_type: file.type
          });
          
        if (error) throw error;
        result = { success: true };
      } else {
        // For documents like parochial reports, upload to storage
        const fileName = `${churchId}_${Date.now()}_${file.name}`;
        const filePath = `parochial_reports/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('church_document_uploads')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;

        // Record the upload in church_data table
        const { error: dbError } = await supabase
          .from('church_data')
          .insert({
            church_id: churchId,
            data_type: fileType,
            file_path: filePath,
            file_name: file.name,
            mime_type: file.type,
          });
          
        if (dbError) throw dbError;
        result = { success: true };
      }

      toast({ 
        title: "Success", 
        description: fileType === 'email_list_upload' ? "Email list uploaded." : "Parochial report uploaded."
      });
      
      return result;
    } catch (error) {
      console.error(`Error uploading ${fileType}:`, error);
      setError(error instanceof Error ? error.message : `Failed to upload ${fileType}`);
      
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : 'An unknown error occurred', 
        variant: "destructive" 
      });
      
      return { success: false, error };
    } finally {
      setSaving(false);
    }
  }, [churchId, toast]);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      console.log('%c[useChurchProfile] Step 1: Starting profile load...', 'color: blue; font-weight: bold;');

      if (!user?.id) {
        console.log('%c[useChurchProfile] ABORT: User not available yet.', 'color: orange;');
        setLoading(false);
        return;
      }

      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('church_id')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.log('%c[useChurchProfile] CRITICAL: Error fetching user profile.', 'color: red; font-weight: bold;', profileError);
          throw profileError;
        }

        // Handle cases: profile exists with church_id, profile exists without church_id, profile doesn't exist (PGRST116), or other null data scenarios.
        if (profileData && profileData.church_id) {
          const churchIdFromProfile = profileData.church_id;
          setChurchId(churchIdFromProfile);
          const churchData = await fetchChurchProfile(churchIdFromProfile);
          setProfile(churchData as ChurchProfileRow | null);
        } else {
          if (profileError?.code === 'PGRST116') {
            console.log('%c[useChurchProfile] User profile does not exist (PGRST116). church_id not found.', 'color: orange;');
          } else if (!profileData) {
            console.log('%c[useChurchProfile] User profile data is null (and not PGRST116 error). church_id not found.', 'color: orange;');
          } else { // profileData exists but profileData.church_id is null, undefined, or empty
            console.log('%c[useChurchProfile] User profile exists but no church_id found on it.', 'color: orange;');
          }
          setProfile(null);
          setChurchId(null);
        }
      } catch (err) {
        console.log('%c[useChurchProfile] CRITICAL: An error occurred in the main loadProfile effect.', 'color: red; font-weight: bold;', err);
        setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      } finally {
        setLoading(false);
        console.log('%c[useChurchProfile] Finished profile load.', 'color: blue; font-weight: bold;');
      }
    };

    loadProfile();
  }, [user?.id, fetchChurchProfile]);

  return { 
    profile,
    churchId, 
    loading, 
    saving,
    error,
    saveChurchProfile,
    uploadChurchData
  };
}
