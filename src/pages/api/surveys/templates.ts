import { supabase } from '@/integrations/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';

// Define template type
interface SurveyTemplate {
  id: string;
  title: string;
  description: string;
  created_at: string;
  created_by: string;
  is_active: boolean;
  metadata: {
    survey_type: string;
    template_data: any;
    church_id: string;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { churchId, surveyType, id } = req.query;
    const userId = req.headers['x-user-id'] as string;

    if (!churchId) {
      return res.status(400).json({ error: 'Church ID is required' });
    }

    // Initialize Supabase client
    const supabaseClient = createClient();

    // Fetch survey templates from the survey_templates table
    let query = supabaseClient
      .from('survey_templates')
      .select('*');
      
    // Apply filters
    if (id) {
      query = query.eq('id', id);
    }
    
    // Filter by church_id in the metadata
    query = query.filter('metadata->church_id', 'eq', churchId);
    
    // Apply survey type filter if provided
    if (surveyType) {
      query = query.filter('metadata->survey_type', 'eq', surveyType);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching survey templates:', error);
      return res.status(500).json({ error: 'Failed to fetch survey templates' });
    }
    
    // Transform the survey templates into the expected format
    const formattedTemplates = templates?.map((template: SurveyTemplate) => {
      return {
        id: template.id,
        title: template.title || 'Untitled Survey',
        description: template.description || '',
        created_at: template.created_at,
        template_data: template.metadata?.template_data || { fields: [] },
        survey_type: template.metadata?.survey_type || 'parish',
        is_active: template.is_active,
        created_by: template.created_by || userId
      };
    }) || [];

    return res.status(200).json({ templates: formattedTemplates });
  } catch (error) {
    console.error('Error fetching survey templates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
