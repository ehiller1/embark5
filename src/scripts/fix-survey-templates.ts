import { supabase } from '@/integrations/lib/supabase';

/**
 * Script to audit and fix survey_templates records to ensure they have a consistent structure
 * with fields/questions in the expected location (template_data.questions).
 */
async function fixSurveyTemplates() {
  console.log('Starting survey_templates data integrity audit and fix...');
  
  try {
    // Fetch all survey templates
    const { data: templates, error } = await supabase
      .from('survey_templates')
      .select('*');
    
    if (error) {
      throw error;
    }
    
    console.log(`Found ${templates?.length || 0} survey templates to audit`);
    
    // Track statistics
    const stats = {
      total: templates?.length || 0,
      alreadyValid: 0,
      fixedFromMetadata: 0,
      fixedFromRoot: 0,
      fixedWithDefaults: 0,
      errors: 0
    };
    
    // Process each template
    for (const template of templates || []) {
      try {
        console.log(`Processing template ID: ${template.id}, Title: ${template.title}`);
        
        // Check if the template already has the expected structure
        if (template.template_data?.questions && Array.isArray(template.template_data.questions)) {
          console.log(`Template ${template.id} already has valid structure`);
          stats.alreadyValid++;
          continue;
        }
        
        // Initialize the update payload
        let updatePayload: any = {
          template_data: template.template_data || {}
        };
        
        // Try to find questions in various locations
        let questions = null;
        
        // Check in metadata.questions
        if (template.metadata?.questions && Array.isArray(template.metadata.questions)) {
          console.log(`Found questions in metadata.questions for template ${template.id}`);
          questions = template.metadata.questions;
          stats.fixedFromMetadata++;
        }
        // Check in metadata.template_data.questions
        else if (template.metadata?.template_data?.questions && Array.isArray(template.metadata.template_data.questions)) {
          console.log(`Found questions in metadata.template_data.questions for template ${template.id}`);
          questions = template.metadata.template_data.questions;
          stats.fixedFromMetadata++;
        }
        // Check if questions exist directly at the root level
        else if (template.questions && Array.isArray(template.questions)) {
          console.log(`Found questions at root level for template ${template.id}`);
          questions = template.questions;
          stats.fixedFromRoot++;
        }
        // Check if fields exist at the root level (older format)
        else if (template.fields && Array.isArray(template.fields)) {
          console.log(`Found fields at root level for template ${template.id}`);
          // Convert fields to questions format
          questions = template.fields.map((field: any) => ({
            id: field.id || `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: field.label || 'Untitled Question',
            type: field.type || 'text',
            options: field.options || [],
            required: field.required || false
          }));
          stats.fixedFromRoot++;
        }
        // Check if fields exist in metadata (older format)
        else if (template.metadata?.fields && Array.isArray(template.metadata.fields)) {
          console.log(`Found fields in metadata.fields for template ${template.id}`);
          // Convert fields to questions format
          questions = template.metadata.fields.map((field: any) => ({
            id: field.id || `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            text: field.label || 'Untitled Question',
            type: field.type || 'text',
            options: field.options || [],
            required: field.required || false
          }));
          stats.fixedFromMetadata++;
        }
        
        // If no questions found, create default questions
        if (!questions) {
          console.log(`No questions found for template ${template.id}, creating defaults`);
          questions = [
            {
              id: `default-question-${Date.now()}-1`,
              text: 'Please share your thoughts:',
              type: 'text',
              required: true
            },
            {
              id: `default-question-${Date.now()}-2`,
              text: 'How would you rate your experience?',
              type: 'rating',
              options: ['1', '2', '3', '4', '5'],
              required: true
            }
          ];
          stats.fixedWithDefaults++;
        }
        
        // Update the template_data with the questions
        updatePayload.template_data.questions = questions;
        
        // Ensure survey_type is set (default to 'parish' if not specified)
        if (!template.survey_type) {
          updatePayload.survey_type = template.metadata?.survey_type || 'parish';
        }
        
        // Update the record
        const { error: updateError } = await supabase
          .from('survey_templates')
          .update(updatePayload)
          .eq('id', template.id);
        
        if (updateError) {
          console.error(`Error updating template ${template.id}:`, updateError);
          stats.errors++;
        } else {
          console.log(`Successfully updated template ${template.id}`);
        }
      } catch (err) {
        console.error(`Error processing template ${template.id}:`, err);
        stats.errors++;
      }
    }
    
    // Log summary
    console.log('\nSurvey Templates Audit Summary:');
    console.log('------------------------------');
    console.log(`Total templates: ${stats.total}`);
    console.log(`Already valid: ${stats.alreadyValid}`);
    console.log(`Fixed from metadata: ${stats.fixedFromMetadata}`);
    console.log(`Fixed from root: ${stats.fixedFromRoot}`);
    console.log(`Fixed with defaults: ${stats.fixedWithDefaults}`);
    console.log(`Errors: ${stats.errors}`);
    console.log('------------------------------');
    
  } catch (error) {
    console.error('Error in fixSurveyTemplates:', error);
  }
}

// Execute the function
fixSurveyTemplates()
  .then(() => {
    console.log('Survey templates data integrity audit and fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
