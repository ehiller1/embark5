import { supabase } from '@/integrations/lib/supabase';
import React from 'react';

// This script generates PDF prospectuses for all ministries that don't have one
// Run this script to bulk-generate prospectuses for existing ministry cards

interface Ministry {
  id: string;
  created_at: string;
  title: string;
  mission_statement: string;
  description: string;
  target_amount: number;
  current_amount: number;
  minimum_investment: number;
  campaign_start_date: string;
  campaign_end_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  church_name: string;
  diocese: string | null;
  location: string;
  impact_metrics: any;
  media_urls: string[];
  user_id: string | null;
  funding_type: 'equity' | 'loan' | 'donation';
  interest_rate?: number;
  equity_percentage?: number;
  term_length?: number;
  prospectus_url?: string;
  prospectus_generated_at?: string;
}

async function generateProspectusForMinistry(ministry: Ministry): Promise<string | null> {
  try {
    console.log(`[ProspectusGenerator] Generating prospectus for ministry: ${ministry.title} (ID: ${ministry.id})`);
    
    // Import PDF generation components dynamically
    const { pdf } = await import('@react-pdf/renderer');
    const ProspectusPDF = (await import('@/components/campaign/ProspectusPDFTemplate')).default;
    
    // Create prospectus data structure matching the expected interface
    const prospectusData = {
      title: ministry.title,
      subtitle: `${ministry.church_name} • ${ministry.location}`,
      sections: [
        {
          id: '1',
          type: 'text' as const,
          title: 'Executive Summary',
          content: ministry.description,
          order: 1
        },
        {
          id: '2',
          type: 'financial_table' as const,
          title: 'Financial Overview',
          content: `Target Amount: $${ministry.target_amount.toLocaleString()}\nMinimum Investment: $${ministry.minimum_investment.toLocaleString()}\nFunding Type: ${ministry.funding_type}\nCurrent Progress: $${ministry.current_amount.toLocaleString()} raised`,
          order: 2
        },
        {
          id: '3',
          type: 'text' as const,
          title: 'Impact & Ministry Goals',
          content: ministry.mission_statement,
          order: 3
        },
        {
          id: '4',
          type: 'text' as const,
          title: 'Church Information',
          content: `Church: ${ministry.church_name}\nLocation: ${ministry.location}${ministry.diocese ? `\nDiocese: ${ministry.diocese}` : ''}`,
          order: 4
        },
        {
          id: '5',
          type: 'text' as const,
          title: 'Campaign Timeline',
          content: `Campaign Start: ${new Date(ministry.campaign_start_date).toLocaleDateString()}\nCampaign End: ${new Date(ministry.campaign_end_date).toLocaleDateString()}\nStatus: ${ministry.status}`,
          order: 5
        }
      ],
      logos: [], // No logos for bulk generation
      communityPhotos: ministry.media_urls || [],
      campaignData: {
        target_amount: ministry.target_amount,
        minimum_investment: ministry.minimum_investment,
        current_amount: ministry.current_amount,
        funding_type: ministry.funding_type,
        interest_rate: ministry.interest_rate,
        equity_percentage: ministry.equity_percentage,
        term_length: ministry.term_length
      }
    };
    
    // Generate PDF blob
    const pdfBlob = await pdf(
      React.createElement(ProspectusPDF, {
        data: prospectusData
      })
    ).toBlob();
    
    // Upload to Supabase storage
    const fileName = `prospectus-${ministry.id}-${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('campaign-media')
      .upload(`prospectuses/${fileName}`, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });
    
    if (uploadError) {
      console.error(`[ProspectusGenerator] Error uploading prospectus for ${ministry.title}:`, uploadError);
      throw uploadError;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from('campaign-media')
      .getPublicUrl(`prospectuses/${fileName}`);
    
    const prospectusUrl = urlData.publicUrl;
    
    // Update ministry record with prospectus URL
    const { error: updateError } = await supabase
      .from('ministries')
      .update({
        prospectus_url: prospectusUrl,
        prospectus_generated_at: new Date().toISOString()
      })
      .eq('id', ministry.id);
    
    if (updateError) {
      console.error(`[ProspectusGenerator] Error updating ministry ${ministry.title} with prospectus URL:`, updateError);
      throw updateError;
    }
    
    console.log(`[ProspectusGenerator] ✅ Successfully generated prospectus for ${ministry.title}: ${prospectusUrl}`);
    return prospectusUrl;
    
  } catch (error) {
    console.error(`[ProspectusGenerator] ❌ Failed to generate prospectus for ${ministry.title}:`, error);
    return null;
  }
}

export async function bulkGenerateProspectuses(): Promise<void> {
  console.log('[ProspectusGenerator] Starting bulk prospectus generation...');
  
  try {
    // Fetch all ministries that don't have a prospectus
    const { data: ministries, error: fetchError } = await supabase
      .from('ministries')
      .select('*')
      .or('prospectus_url.is.null,prospectus_url.eq.""')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[ProspectusGenerator] Error fetching ministries:', fetchError);
      return;
    }

    if (!ministries || ministries.length === 0) {
      console.log('[ProspectusGenerator] No ministries found that need prospectuses');
      return;
    }

    console.log(`[ProspectusGenerator] Found ${ministries.length} ministries that need prospectuses`);

    let successCount = 0;
    let failureCount = 0;

    // Generate prospectuses one by one to avoid overwhelming the system
    for (const ministry of ministries) {
      console.log(`[ProspectusGenerator] Processing ${successCount + failureCount + 1}/${ministries.length}: ${ministry.title}`);
      
      const result = await generateProspectusForMinistry(ministry);
      
      if (result) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[ProspectusGenerator] ✅ Bulk generation complete!`);
    console.log(`[ProspectusGenerator] Success: ${successCount}, Failures: ${failureCount}`);

  } catch (error) {
    console.error('[ProspectusGenerator] Error in bulk generation:', error);
  }
}

// Function to regenerate all prospectuses (even existing ones)
export async function regenerateAllProspectuses(): Promise<void> {
  console.log('[ProspectusGenerator] Starting regeneration of ALL prospectuses...');
  
  try {
    // Fetch all ministries
    const { data: ministries, error: fetchError } = await supabase
      .from('ministries')
      .select('*')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[ProspectusGenerator] Error fetching ministries:', fetchError);
      return;
    }

    if (!ministries || ministries.length === 0) {
      console.log('[ProspectusGenerator] No ministries found');
      return;
    }

    console.log(`[ProspectusGenerator] Found ${ministries.length} ministries to regenerate prospectuses for`);

    let successCount = 0;
    let failureCount = 0;

    // Generate prospectuses one by one
    for (const ministry of ministries) {
      console.log(`[ProspectusGenerator] Processing ${successCount + failureCount + 1}/${ministries.length}: ${ministry.title}`);
      
      const result = await generateProspectusForMinistry(ministry);
      
      if (result) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`[ProspectusGenerator] ✅ Regeneration complete!`);
    console.log(`[ProspectusGenerator] Success: ${successCount}, Failures: ${failureCount}`);

  } catch (error) {
    console.error('[ProspectusGenerator] Error in regeneration:', error);
  }
}

// Export individual function for use in components
export { generateProspectusForMinistry };
