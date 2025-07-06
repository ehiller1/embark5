import { supabase } from '@/integrations/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';

// Define types for survey responses
interface SurveyResponse {
  id: string;
  user_survey_id: string;
  question_id: string;
  response: any;
  created_at: string;
  updated_at: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { surveyTemplateId, responseData, conversation, status = 'in_progress' } = req.body;
    const userId = req.headers['x-user-id'] as string;
    const churchId = req.headers['x-church-id'] as string;

    if (!surveyTemplateId || !responseData || !churchId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Using the imported supabase client
    
    // First, check if a user_survey record exists for this template and user
    const { data: existingUserSurvey, error: userSurveyError } = await supabase
      .from('user_surveys')
      .select('id')
      .eq('user_id', userId)
      .eq('survey_template_id', surveyTemplateId)
      .maybeSingle();

    let userSurveyId;
    if (userSurveyError) {
      console.error('Error checking for existing user survey:', userSurveyError);
      return res.status(500).json({ error: 'Failed to check for existing survey' });
    }
    
    // Create or update the user_survey record
    if (existingUserSurvey) {
      // Update existing user survey status
      const { error: updateError } = await supabase
        .from('user_surveys')
        .update({
          status: status,
          completed_at: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', existingUserSurvey.id);
        
      if (updateError) {
        console.error('Error updating user survey:', updateError);
        return res.status(500).json({ error: 'Failed to update survey status' });
      }
      
      userSurveyId = existingUserSurvey.id;
    } else {
      // Create new user survey
      const { data: newUserSurvey, error: createError } = await supabase
        .from('user_surveys')
        .insert({
          user_id: userId,
          survey_template_id: surveyTemplateId,
          status: status
        })
        .select('id')
        .single();
        
      if (createError) {
        console.error('Error creating user survey:', createError);
        return res.status(500).json({ error: 'Failed to create survey record' });
      }
      
      userSurveyId = newUserSurvey.id;
    }
    
    // Now save each question response
    const responsePromises = Object.entries(responseData).map(async ([questionId, response]) => {
      // Check if response exists for this question
      const { data: existingResponse } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('user_survey_id', userSurveyId)
        .eq('question_id', questionId)
        .maybeSingle();
      
      if (existingResponse) {
        // Update existing response
        return supabase
          .from('survey_responses')
          .update({
            response: response
          })
          .eq('id', existingResponse.id);
      } else {
        // Create new response
        return supabase
          .from('survey_responses')
          .insert({
            user_survey_id: userSurveyId,
            question_id: questionId,
            response: response
          });
      }
    });
    
    // Wait for all responses to be saved
    await Promise.all(responsePromises);
    
    // If there's conversation data, store it in the metadata
    if (conversation && conversation.length > 0) {
      await supabase
        .from('user_surveys')
        .update({
          metadata: { conversation }
        })
        .eq('id', userSurveyId);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving survey response:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
