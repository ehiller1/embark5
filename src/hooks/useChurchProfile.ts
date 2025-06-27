import { useState, useEffect, useCallback } from 'react';
// Import supabase from the main client file
import { supabase } from '@/integrations/lib/supabase';
import { useAuth } from '@/integrations/lib/auth/AuthProvider';
import { useToast } from './use-toast';
import { Database } from '@/types/supabase';

// Type for the church_profile row
type ChurchProfileRow = Database['public']['Tables']['church_profile']['Row'];

type SaveResult<T = any> = {
  success: boolean;
  error?: string;
  data?: T;
};

export function useChurchProfile() {
  const [profile, setProfile] = useState<ChurchProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch an existing church_profile by church_id
  const fetchChurchProfile = useCallback(async (id: string) => {
    console.log(`[useChurchProfile] Fetching church_profile for church_id: ${id}`);
    try {
      const { data, error: fetchError, status } = await supabase
        .from('church_profile')
        .select('*')
        .eq('church_id', id)
        .maybeSingle();

      if (fetchError) {
        console.error(`[useChurchProfile] Error fetching church_profile (status ${status}):`, fetchError);
        throw fetchError;
      }

      console.log('[useChurchProfile] Fetched church_profile:', data);
      return data;
    } catch (err) {
      console.error('[useChurchProfile] Unexpected error in fetchChurchProfile:', err);
      setError(err instanceof Error ? err.message : 'Error fetching profile');
      return null;
    }
  }, []);

  // Effect to fetch profile when user is available and has a church_id
  useEffect(() => {
    const loadProfile = async () => {
      // We need the user object to find the church_id
      if (user && user.user_metadata?.church_id) {
        const id = user.user_metadata.church_id as string;
        console.log(`[useChurchProfile] useEffect triggered. Found church_id: ${id}`);
        setChurchId(id);
        setLoading(true);
        setError(null); // Reset error on new fetch

        try {
          const data = await fetchChurchProfile(id);
          setProfile(data); // This can be null if no profile exists, which is correct
        } catch (e) {
          // Error is already set inside fetchChurchProfile, but we can log it again here if needed
          console.error('[useChurchProfile] Error during profile load in useEffect:', e);
        } finally {
          setLoading(false);
          console.log('[useChurchProfile] Finished profile load.');
        }
      } else if (user) {
        // User is loaded but doesn't have a church_id. This is a valid state.
        setLoading(false);
        console.log('[useChurchProfile] User is authenticated, but no church_id found in user_metadata.');
      } else {
        // No user session, not loading anything.
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, fetchChurchProfile]);

  // Helper function to check if storage bucket exists
  const ensureBucketExists = useCallback(async (bucketName: string) => {
    try {
      // Just check if we can list files in the bucket
      const { error } = await supabase.storage
        .from(bucketName)
        .list();
      
      // If we get a 404, the bucket doesn't exist
      if (error && error.message.includes('not found')) {
        console.error(`[useChurchProfile] Bucket '${bucketName}' does not exist`);
        throw new Error(`Storage bucket '${bucketName}' does not exist. Please create it in the Supabase dashboard.`);
      }
      
      // If we get any other error, throw it
      if (error) {
        console.error('[useChurchProfile] Error accessing bucket:', error);
        throw new Error(`Failed to access storage bucket: ${error.message}`);
      }
      
      console.log(`[useChurchProfile] Successfully accessed bucket '${bucketName}'`);
      return true;
    } catch (error) {
      console.error('[useChurchProfile] Error checking bucket access:', error);
      throw new Error(`Storage access error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, []);

  // Save or create a church_profile
  const saveChurchProfile = useCallback(async (profileData: Partial<ChurchProfileRow>): Promise<SaveResult> => {
    setSaving(true);
    setError(null);

    if (!churchId) {
      toast({ title: 'Error', description: 'Church ID is missing.', variant: 'destructive' });
      setSaving(false);
      return { success: false, error: 'Church ID is missing.' };
    }

    try {
      console.log(`[saveChurchProfile] Initiating save for church_id: ${churchId}`);
      
      // Check if a profile for this church_id already exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('church_profile')
        .select('id')
        .eq('church_id', churchId)
        .maybeSingle();

      console.log('[saveChurchProfile] Checked for existing profile. Found:', existingProfile);

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[saveChurchProfile] Error fetching existing profile:', fetchError);
        throw fetchError;
      }

      // Prepare the data to save
      const dataToSave = {
        ...profileData,
        church_id: churchId,
        ...(existingProfile ? {} : { created_at: new Date().toISOString() })
      };

      // Remove undefined values
      (Object.keys(dataToSave) as Array<keyof typeof dataToSave>).forEach(key => {
        if (dataToSave[key] === undefined) {
          delete dataToSave[key];
        }
      });

      console.log('[saveChurchProfile] Data prepared for saving:', dataToSave);

      let result;

      if (existingProfile?.id) {
        console.log(`[saveChurchProfile] Existing profile found (id: ${existingProfile.id}). Performing an UPDATE.`);
        const { data, error } = await supabase
          .from('church_profile')
          .update(dataToSave)
          .eq('id', existingProfile.id)
          .select();
          
        if (error) {
          console.error('[saveChurchProfile] UPDATE failed:', error);
          throw error;
        }
        result = data;
        console.log('[saveChurchProfile] UPDATE successful.');
      } else {
        console.log('[saveChurchProfile] No existing profile found. Performing an INSERT.');
        const { data, error } = await supabase
          .from('church_profile')
          .insert([dataToSave])
          .select();
          
        if (error) {
          console.error('[saveChurchProfile] INSERT failed:', error);
          throw error;
        }
        result = data;
        console.log('[saveChurchProfile] INSERT successful.');
      }

      // Update local state with the full row
      if (result && result[0]) {
        setProfile(result[0]);
      }

      toast({ title: 'Success', description: 'Church profile saved successfully.' });
      return { 
        success: true, 
        data: result[0],
        error: undefined
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to save church profile';
      console.error('[saveChurchProfile] Error saving church profile:', error);
      setError(msg);
      toast({ title: 'Error', description: msg, variant: 'destructive' });
      return { 
        success: false, 
        error: msg,
        data: undefined
      };
    } finally {
      setSaving(false);
    }
  }, [churchId, toast]);

  // Upload file to church_data table and storage
  const uploadChurchData = useCallback(
    async (fileType: 'email_list_upload' | 'parochial_report_upload', file: File) => {
      try {
        // Ensure we have a valid session before proceeding
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.error('[useChurchProfile] No active session:', sessionError);
          throw new Error('Your session has expired. Please sign in again.');
        }
        
        console.log('[useChurchProfile] Active session found, user ID:', session.user.id);
        console.log('[useChurchProfile] Starting file upload for type:', fileType);
        
        if (!churchId) {
          const errorMsg = 'Church ID is required for file uploads';
          console.error('[useChurchProfile]', errorMsg);
          toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
          return { success: false, error: errorMsg };
        }
        
        // Ensure the storage bucket exists
        try {
          await ensureBucketExists('church-document-uploads');
        } catch (error) {
          const errorMsg = 'Failed to initialize storage. Please try again later.';
          console.error('[useChurchProfile]', errorMsg, error);
          toast({ title: 'Storage Error', description: errorMsg, variant: 'destructive' });
          return { success: false, error: errorMsg };
        }
      
        // Get the user ID from the session
        const userId = session.user.id;
      
        // File validation
        const maxSizeMB = 10;
        const maxSize = maxSizeMB * 1024 * 1024; // 10MB in bytes
        
        if (file.size > maxSize) {
          const errorMsg = `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds the ${maxSizeMB}MB limit`;
          console.error('[useChurchProfile]', errorMsg);
          toast({ 
            title: 'File Too Large', 
            description: `Please upload a file smaller than ${maxSizeMB}MB`,
            variant: 'destructive' 
          });
          return { success: false, error: errorMsg };
        }
      
        // Check file type
        const allowedTypes = [
          'application/pdf',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          const errorMsg = `Unsupported file type: ${file.type || 'unknown'}`;
          console.error('[useChurchProfile]', errorMsg);
          toast({ 
            title: 'Unsupported File Type', 
            description: 'Please upload a PDF or Excel file',
            variant: 'destructive' 
          });
          return { success: false, error: errorMsg };
        }
      
        // Sanitize file name (single implementation)
        const sanitizedFileName = file.name
          .normalize('NFD') // Normalize to decomposed form
          .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
          .replace(/[^\w\d.-]/g, '_') // Replace special chars with underscore
          .replace(/_{2,}/g, '_') // Replace multiple underscores with single
          .toLowerCase();
        
        // Create a unique file path with user ID and timestamp
        let filePath = `${userId}/${churchId}_${Date.now()}_${sanitizedFileName}`;
      
        // Check for existing files for this church
        const { data: existingFiles, error: listError } = await supabase.storage
          .from('church-document-uploads')
          .list(userId, {
            search: `${churchId}_`
          });

        if (listError) {
          console.error('[useChurchProfile] Error checking for existing files:', listError);
          throw new Error('Failed to check for existing files. Please try again.');
        }

        // If there are existing files, remove them
        if (existingFiles && existingFiles.length > 0) {
          console.log(`[useChurchProfile] Found ${existingFiles.length} existing files for church ${churchId}, removing...`);
          const filesToRemove = existingFiles.map(f => `${userId}/${f.name}`);
          const { error: removeError } = await supabase.storage
            .from('church-document-uploads')
            .remove(filesToRemove);
            
          if (removeError) {
            console.error('[useChurchProfile] Error removing existing files:', removeError);
            // Continue with upload anyway, the new file will have a different name
          } else {
            console.log('[useChurchProfile] Removed existing files');
          }
        }
      
        // Upload the file with retry logic
        let uploadAttempts = 0;
        const maxAttempts = 2;
        let uploadError = null;
        let uploadData = null;
        
        while (uploadAttempts < maxAttempts && !uploadData) {
          try {
            uploadAttempts++;
            console.log(`[useChurchProfile] Upload attempt ${uploadAttempts}/${maxAttempts} for ${filePath}`);
            
            const { data, error } = await supabase.storage
              .from('church-document-uploads')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type,
              });
              
            if (error) throw error;
            
            uploadData = data;
            uploadError = null;
          } catch (error) {
            uploadError = error;
            console.error(`[useChurchProfile] Upload attempt ${uploadAttempts} failed:`, error);
            
            // If it's a duplicate file error, try with a new filename
            if (uploadAttempts < maxAttempts && error instanceof Error && error.message.includes('already exists')) {
              filePath = `${userId}/${churchId}_${Date.now()}_${uploadAttempts}_${sanitizedFileName}`;
              console.log(`[useChurchProfile] Retrying with new filename: ${filePath}`);
            }
          }
        }
        
        // If we still have an error after all attempts, throw it
        if (uploadError) {
          if (uploadError instanceof Error) {
            throw uploadError;
          }
          const errorMessage = typeof uploadError === 'object' && uploadError !== null && 'message' in uploadError 
            ? String(uploadError.message) 
            : 'Unknown upload error';
          throw new Error(errorMessage);
        }
      
        // Get the public URL for the uploaded file
        const { data: { publicUrl } } = supabase.storage
          .from('church-document-uploads')
          .getPublicUrl(filePath);
          
        console.log('[useChurchProfile] File uploaded successfully:', {
          path: filePath,
          publicUrl,
          type: fileType,
          size: file.size
        });
        
        // Per user request, all document uploads will be stored in the `church_data` table
        // with a `type` field indicating the document type.
        const dataTypeMap: { [key: string]: string } = {
          'email_list_upload': 'email list',
          'parochial_report_upload': 'parochial report'
        };
        const dataType = dataTypeMap[fileType] || fileType;

        const { error: insertError } = await supabase.from('church_data').insert({
          church_id: churchId,
          data_type: dataType,
          file_path: publicUrl,
          file_name: file.name,
        });

        const updateError = insertError;
        let updatedProfile: ChurchProfileRow | null = null;

        // After insert, fetch the latest profile to ensure UI consistency.
        if (!updateError) {
          const { data, error } = await supabase.from('church_profile').select('*').eq('church_id', churchId).single();
          updatedProfile = data;
          if (error) {
            // Log the error but don't fail the entire upload if only the profile refresh fails
            console.error('[useChurchProfile] Failed to refresh profile after upload:', error);
          }
        }
        
        if (updateError) {
          console.error('[useChurchProfile] Error updating profile with file reference:', updateError);
          // Try to clean up the uploaded file if update fails
          try {
            await supabase.storage
              .from('church-document-uploads')
              .remove([filePath]);
          } catch (cleanupError) {
            console.error('[useChurchProfile] Error cleaning up file after update error:', cleanupError);
          }
          throw new Error('Failed to update profile with file reference');
        }
        
        // Update local state with the new profile data
        if (updatedProfile) {
          setProfile(updatedProfile);
        }
        
        toast({
          title: 'Success',
          description: `${fileType === 'email_list_upload' ? 'Mailing list' : 'Parochial report'} uploaded successfully`,
        });
        
        return { 
          success: true, 
          data: {
            path: filePath,
            url: publicUrl,
            type: fileType,
            size: file.size
          } 
        };
      } catch (error) {
        const errorMessage = error instanceof Error 
          ? error.message 
          : `Failed to upload ${fileType}. Please try again.`;
        
        console.error(`[useChurchProfile] Error in uploadChurchData (${fileType}):`, {
          error,
          timestamp: new Date().toISOString(),
          userId: user?.id,
          churchId,
          fileType
        });
        
        toast({
          title: 'Upload Failed',
          description: errorMessage,
          variant: 'destructive',
        });
        
        return { 
          success: false, 
          error: errorMessage,
          data: undefined 
        };
      }
    },
    [churchId, toast, user?.id]
  );

  // Load profile when user changes
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Get the church_id from the user's profile
        const { data: userProfile, error: profileError } = await supabase
          .from('profiles')
          .select('church_id')
          .eq('id', user.id)
          .single();
          
        if (profileError) throw profileError;
        if (!userProfile?.church_id) {
          console.log('[useChurchProfile] No church_id found for user');
          setLoading(false);
          return;
        }
        
        // Set the church ID and fetch the church profile
        setChurchId(userProfile.church_id);
        const profileData = await fetchChurchProfile(userProfile.church_id);
        
        if (profileData) {
          setProfile(profileData);
        } else {
          console.log('[useChurchProfile] No church profile found, will create one on save');
        }
      } catch (err) {
        console.error('[useChurchProfile] Error loading profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [user?.id]);

  return {
    profile,
    churchId,
    loading,
    error,
    saving,
    saveChurchProfile,
    uploadChurchData: uploadChurchData as (fileType: 'email_list_upload' | 'parochial_report_upload', file: File) => Promise<SaveResult<{ filePath: string; publicUrl: string }>>,
    fetchChurchProfile: fetchChurchProfile as (id: string) => Promise<ChurchProfileRow | null>,
  };
};

export default useChurchProfile;
