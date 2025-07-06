import { supabase } from '../integrations/lib/supabase';

async function createSurveyTables() {
  console.log('Creating survey tables...');

  try {
    // Create survey_templates table
    const { error: templatesError } = await supabase.rpc('create_survey_tables', {});
    
    if (templatesError) {
      console.error('Error creating survey tables:', templatesError);
      
      // Try direct SQL execution as fallback
      console.log('Attempting direct SQL execution...');
      
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql_query: `
          -- Create survey_templates table if it doesn't exist
          CREATE TABLE IF NOT EXISTS public.survey_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT,
            created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            church_id UUID NOT NULL,
            survey_type TEXT NOT NULL CHECK (survey_type IN ('parish', 'neighborhood')),
            template_data JSONB NOT NULL,
            is_active BOOLEAN DEFAULT true,
            public_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Create survey_responses table if it doesn't exist
          CREATE TABLE IF NOT EXISTS public.survey_responses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            survey_template_id UUID REFERENCES public.survey_templates(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            church_id UUID NOT NULL,
            response_data JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          -- Enable RLS for survey_templates
          ALTER TABLE public.survey_templates ENABLE ROW LEVEL SECURITY;
          
          -- Create policies for survey_templates
          CREATE POLICY IF NOT EXISTS "Enable read access for all users" 
              ON public.survey_templates 
              FOR SELECT 
              USING (true);
              
          CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" 
              ON public.survey_templates 
              FOR INSERT 
              WITH CHECK (auth.uid() IS NOT NULL);
              
          CREATE POLICY IF NOT EXISTS "Enable update for users based on church_id" 
              ON public.survey_templates 
              FOR UPDATE 
              USING (auth.uid() IN (
                  SELECT p.id 
                  FROM profiles p 
                  WHERE p.church_id = survey_templates.church_id
              ));
          
          -- Enable RLS for survey_responses
          ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
          
          -- Create policies for survey_responses
          CREATE POLICY IF NOT EXISTS "Enable read access for church members" 
              ON public.survey_responses 
              FOR SELECT 
              USING (auth.uid() IN (
                  SELECT p.id 
                  FROM profiles p 
                  WHERE p.church_id = survey_responses.church_id
              ));
              
          CREATE POLICY IF NOT EXISTS "Enable insert for authenticated users" 
              ON public.survey_responses 
              FOR INSERT 
              WITH CHECK (auth.uid() IS NOT NULL);
        `
      });
      
      if (sqlError) {
        console.error('Error executing SQL:', sqlError);
        throw sqlError;
      }
    }
    
    console.log('Survey tables created successfully');
  } catch (error) {
    console.error('Error creating survey tables:', error);
    throw error;
  }
}

// Execute the function
createSurveyTables()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
