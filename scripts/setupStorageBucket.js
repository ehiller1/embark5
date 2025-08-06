#!/usr/bin/env node

/**
 * Script to create the campaign-media storage bucket in Supabase
 * This needs to be run before the prospectus generation script
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Supabase configuration from environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createStorageBucket() {
  try {
    console.log('🚀 Setting up campaign-media storage bucket...');

    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      return false;
    }

    const existingBucket = buckets.find(bucket => bucket.name === 'campaign-media');
    
    if (existingBucket) {
      console.log('✅ campaign-media bucket already exists');
      return true;
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('campaign-media', {
      public: true,
      allowedMimeTypes: [
        'image/jpeg',
        'image/png', 
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain'
      ],
      fileSizeLimit: 10485760 // 10MB
    });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      return false;
    }

    console.log('✅ Successfully created campaign-media bucket');

    // Create the prospectuses folder
    try {
      const { error: uploadError } = await supabase.storage
        .from('campaign-media')
        .upload('prospectuses/.gitkeep', new Blob([''], { type: 'text/plain' }), {
          upsert: true
        });

      if (uploadError) {
        console.log('⚠️  Could not create prospectuses folder (this is okay):', uploadError.message);
      } else {
        console.log('✅ Created prospectuses folder');
      }
    } catch (folderError) {
      console.log('⚠️  Could not create prospectuses folder (this is okay)');
    }

    return true;

  } catch (error) {
    console.error('❌ Error setting up storage bucket:', error);
    return false;
  }
}

async function main() {
  console.log('🔧 Setting up Supabase storage for prospectus generation...');
  
  const success = await createStorageBucket();
  
  if (success) {
    console.log('\n🎉 Storage setup complete!');
    console.log('📝 You can now run: npm run generate-prospectuses');
    process.exit(0);
  } else {
    console.log('\n❌ Storage setup failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the script
main();

export { createStorageBucket, main };
