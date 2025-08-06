import { supabase } from '@/integrations/lib/supabase';

/**
 * Sets up Supabase storage buckets for campaign media
 * This should be run once to initialize the storage buckets
 */
export async function setupCampaignMediaStorage() {
  try {
    // Check if the campaign-media bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.log('Could not list buckets (may not have admin permissions):', listError.message);
      // Continue anyway - bucket might exist
    }

    const bucketExists = buckets?.some(bucket => bucket.name === 'campaign-media');

    if (!bucketExists) {
      console.log('Attempting to create campaign-media bucket...');
      const { data, error } = await supabase.storage.createBucket('campaign-media', {
        public: true,
        allowedMimeTypes: [
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/gif',
          'image/webp',
          'application/pdf' // Add PDF support for prospectuses
        ],
        fileSizeLimit: 10485760 // 10MB
      });

      if (error) {
        if (error.message.includes('row-level security policy')) {
          console.warn('❌ STORAGE SETUP REQUIRED:');
          console.warn('The campaign-media storage bucket needs to be created manually.');
          console.warn('Please follow these steps:');
          console.warn('1. Go to Supabase Dashboard → Storage');
          console.warn('2. Create bucket named "campaign-media" (public: true)');
          console.warn('3. Run the SQL migration: migrations/setup_campaign_media_storage.sql');
          console.warn('4. Refresh the page to retry');
        } else {
          console.log('Could not create campaign-media bucket (may already exist):', error.message);
        }
        // Don't return false - bucket might already exist
      } else {
        console.log('✅ Campaign media bucket created successfully:', data);
      }
    } else {
      console.log('✅ Campaign media bucket already exists');
    }

    // Test bucket access by trying to list files
    const { data: testList, error: testError } = await supabase.storage
      .from('campaign-media')
      .list('', { limit: 1 });
    
    if (testError) {
      console.warn('⚠️ Storage bucket access test failed:', testError.message);
      console.warn('Note: Storage policies may need to be configured in Supabase dashboard');
      console.warn('Run the SQL migration: migrations/setup_campaign_media_storage.sql');
    } else {
      console.log('✅ Storage bucket access confirmed');
    }

    return true;
  } catch (error) {
    console.log('Storage setup completed with warnings:', error);
    return true; // Don't fail completely
  }
}

/**
 * Sets up Row Level Security policies for campaign media storage
 */
async function setupStoragePolicies() {
  try {
    // Policy to allow authenticated users to upload files to their own folder
    const uploadPolicy = `
      CREATE POLICY "Users can upload to their own folder" ON storage.objects
      FOR INSERT WITH CHECK (
        auth.uid()::text = (storage.foldername(name))[1] AND
        bucket_id = 'campaign-media'
      );
    `;

    // Policy to allow public read access to campaign media
    const readPolicy = `
      CREATE POLICY "Public read access for campaign media" ON storage.objects
      FOR SELECT USING (bucket_id = 'campaign-media');
    `;

    // Policy to allow users to update their own files
    const updatePolicy = `
      CREATE POLICY "Users can update their own files" ON storage.objects
      FOR UPDATE USING (
        auth.uid()::text = (storage.foldername(name))[1] AND
        bucket_id = 'campaign-media'
      );
    `;

    // Policy to allow users to delete their own files
    const deletePolicy = `
      CREATE POLICY "Users can delete their own files" ON storage.objects
      FOR DELETE USING (
        auth.uid()::text = (storage.foldername(name))[1] AND
        bucket_id = 'campaign-media'
      );
    `;

    // Note: These policies would typically be created via Supabase dashboard or migration
    // For now, we'll log them for manual setup
    console.log('Storage policies to create:');
    console.log('Upload Policy:', uploadPolicy);
    console.log('Read Policy:', readPolicy);
    console.log('Update Policy:', updatePolicy);
    console.log('Delete Policy:', deletePolicy);

    return true;
  } catch (error) {
    console.error('Error setting up storage policies:', error);
    return false;
  }
}

/**
 * Helper function to get the public URL for a storage file
 */
export function getStorageUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('campaign-media')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

/**
 * Helper function to delete a file from storage
 */
export async function deleteStorageFile(filePath: string): Promise<boolean> {
  try {
    const { error } = await supabase.storage
      .from('campaign-media')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Helper function to list files in a user's folder
 */
export async function listUserFiles(userId: string, folder?: 'logos' | 'community_photos'): Promise<string[]> {
  try {
    const path = folder ? `${userId}/${folder}` : userId;
    
    const { data, error } = await supabase.storage
      .from('campaign-media')
      .list(path);

    if (error) {
      console.error('Error listing files:', error);
      return [];
    }

    return data?.map(file => `${path}/${file.name}`) || [];
  } catch (error) {
    console.error('Error listing files:', error);
    return [];
  }
}
