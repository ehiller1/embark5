import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Get responses for a survey
    try {
      const { surveyTemplateId } = req.query;
      const userId = req.headers['x-user-id'] as string;
      const churchId = req.headers['x-church-id'] as string;

      if (!surveyTemplateId) {
        return res.status(400).json({ error: 'Survey template ID is required' });
      }

      // Get responses with user data
      const { data: responses, error } = await supabase
        .from('survey_responses')
        .select(`
          id, 
          user_id, 
          created_at, 
          response_data, 
          conversation,
          status,
          user:users (id, email, raw_user_meta_data->>'name' as name)
        `)
        .eq('survey_template_id', surveyTemplateId)
        .eq('church_id', churchId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return res.status(200).json({ responses });
    } catch (error) {
      console.error('Error fetching survey responses:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else if (req.method === 'POST') {
    // Save a survey response
    try {
      const { surveyTemplateId, responseData, conversation, status = 'completed' } = req.body;
      const userId = req.headers['x-user-id'] as string;
      const churchId = req.headers['x-church-id'] as string;

      if (!surveyTemplateId || !responseData) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data, error } = await supabase
        .from('survey_responses')
        .insert({
          survey_template_id: surveyTemplateId,
          user_id: userId,
          church_id: churchId,
          response_data: responseData,
          conversation: conversation || [],
          status,
        })
        .select();

      if (error) {
        throw error;
      }

      return res.status(200).json({ response: data[0] });
    } catch (error) {
      console.error('Error saving survey response:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
