#!/usr/bin/env node

/**
 * One-time script to generate PDF prospectuses for all ministries in the database
 * 
 * This script should be run once to populate the database with prospectus PDFs
 * for all existing ministry campaigns that don't already have them.
 * 
 * Usage: node scripts/generateAllProspectuses.js
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

// Simple prospectus content generator (since we can't use React components in Node.js)
function generateSimpleProspectusContent(ministry) {
  return `
MINISTRY PROSPECTUS
==================

${ministry.title}
${ministry.church_name} • ${ministry.location}

EXECUTIVE SUMMARY
-----------------
${ministry.description}

MISSION STATEMENT
-----------------
${ministry.mission_statement}

FINANCIAL OVERVIEW
------------------
Target Amount: $${ministry.target_amount.toLocaleString()}
Minimum Investment: $${ministry.minimum_investment.toLocaleString()}
Current Progress: $${ministry.current_amount.toLocaleString()} raised
Funding Type: ${ministry.funding_type}

CAMPAIGN TIMELINE
-----------------
Start Date: ${new Date(ministry.campaign_start_date).toLocaleDateString()}
End Date: ${new Date(ministry.campaign_end_date).toLocaleDateString()}
Status: ${ministry.status}

CHURCH INFORMATION
------------------
Church: ${ministry.church_name}
Location: ${ministry.location}
${ministry.diocese ? `Diocese: ${ministry.diocese}` : ''}

IMPACT METRICS
--------------
${ministry.impact_metrics ? JSON.stringify(ministry.impact_metrics, null, 2) : 'To be determined based on campaign progress'}

---
This prospectus contains forward-looking statements. Past performance does not guarantee future results.
Please read all risk factors carefully before investing.
`;
}

async function generateProspectusForMinistry(ministry) {
  try {
    console.log(`Generating prospectus for: ${ministry.title} (ID: ${ministry.id})`);
    
    // Generate simple text content
    const prospectusContent = generateSimpleProspectusContent(ministry);
    
    // Create a simple text file as prospectus (since we can't generate PDFs easily in Node.js without React)
    const fileName = `prospectus-${ministry.id}-${Date.now()}.txt`;
    const blob = new Blob([prospectusContent], { type: 'text/plain' });
    
    // Convert to buffer for upload
    const buffer = Buffer.from(await blob.arrayBuffer());
    
    // Try to upload to Supabase storage
    let prospectusUrl = null;
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('campaign-media')
        .upload(`prospectuses/${fileName}`, buffer, {
          contentType: 'text/plain',
          upsert: true
        });
      
      if (uploadError) {
        if (uploadError.message.includes('Bucket not found')) {
          console.error(`❌ Storage bucket 'campaign-media' not found. Please create it in Supabase dashboard.`);
          console.error(`   Go to Storage > Create Bucket > Name: 'campaign-media' > Public: true`);
          return null;
        }
        console.error(`Error uploading prospectus for ${ministry.title}:`, uploadError);
        return null;
      }
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('campaign-media')
        .getPublicUrl(`prospectuses/${fileName}`);
      
      prospectusUrl = urlData.publicUrl;
      
    } catch (storageError) {
      console.error(`Storage error for ${ministry.title}:`, storageError);
      return null;
    }
    
    // Update ministry record with prospectus URL
    const { error: updateError } = await supabase
      .from('ministries')
      .update({
        prospectus_url: prospectusUrl,
        prospectus_generated_at: new Date().toISOString()
      })
      .eq('id', ministry.id);
    
    if (updateError) {
      console.error(`Error updating ministry ${ministry.title} with prospectus URL:`, updateError);
      return null;
    }
    
    console.log(`✅ Successfully generated prospectus for ${ministry.title}: ${prospectusUrl}`);
    return prospectusUrl;
    
  } catch (error) {
    console.error(`❌ Failed to generate prospectus for ${ministry.title}:`, error);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting bulk prospectus generation...');
  
  try {
    // Fetch all ministries that don't have a prospectus
    const { data: ministries, error: fetchError } = await supabase
      .from('ministries')
      .select('*')
      .or('prospectus_url.is.null,prospectus_url.eq.""')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching ministries:', fetchError);
      process.exit(1);
    }

    if (!ministries || ministries.length === 0) {
      console.log('✅ No ministries found that need prospectuses. All done!');
      process.exit(0);
    }

    console.log(`📋 Found ${ministries.length} ministries that need prospectuses`);

    let successCount = 0;
    let failureCount = 0;

    // Generate prospectuses one by one
    for (let i = 0; i < ministries.length; i++) {
      const ministry = ministries[i];
      console.log(`\n📄 Processing ${i + 1}/${ministries.length}: ${ministry.title}`);
      
      const result = await generateProspectusForMinistry(ministry);
      
      if (result) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add a small delay to avoid overwhelming the system
      if (i < ministries.length - 1) {
        console.log('⏳ Waiting 1 second before next generation...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n🎉 Bulk generation complete!');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failures: ${failureCount}`);
    
    if (failureCount > 0) {
      console.log('\n⚠️  Some prospectuses failed to generate. Check the error messages above.');
      process.exit(1);
    } else {
      console.log('\n🎊 All prospectuses generated successfully!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error in bulk generation:', error);
    process.exit(1);
  }
}

// Run the script
main();

export { generateProspectusForMinistry, main };
