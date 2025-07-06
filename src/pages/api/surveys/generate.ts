import { createClient } from '@supabase/supabase-js';
// Using Express-like types instead of Next.js types
type Request = {
  method: string;
  body: any;
  headers: Record<string, string>;
};

type Response = {
  status: (code: number) => Response;
  json: (data: any) => void;
};

// Modern OpenAI client setup
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const openaiApiKey = process.env.OPENAI_API_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
// Initialize the OpenAI client with the new SDK
const openai = new OpenAI({
  apiKey: openaiApiKey,
});

export default async function handler(req: Request, res: Response) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { conversation, churchId, surveyType = 'parish' } = req.body;
    const userId = req.headers['x-user-id'] as string;

    if (!userId || !churchId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the survey generation prompt
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('content')
      .eq('prompt_type', 'survey_generation')
      .single();

    if (promptError || !promptData) {
      return res.status(500).json({ error: 'Failed to load survey generation prompt' });
    }

    // Call OpenAI to generate survey
    console.log('Calling OpenAI with conversation:', JSON.stringify(conversation.slice(0, 2)) + '...');
    
    // Declare templateData outside the try block to ensure it's in scope for the entire function
    let templateData;
    
    try {
      // Using the new OpenAI client format
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: promptData.content },
          ...conversation,
        ],
        temperature: 0.7,
      });
      
      console.log('OpenAI response received');
      
      const surveyContent = completion.choices[0]?.message?.content;
      if (!surveyContent) {
        console.error('No survey content in OpenAI response');
        return res.status(500).json({ error: 'Failed to generate survey content' });
      }
      
      console.log('Survey content:', surveyContent.substring(0, 100) + '...');
      
      // Parse the survey content (assuming it's in JSON format)
      try {
        // Try to extract JSON if the response contains markdown or other text
        const jsonMatch = surveyContent.match(/```json\n([\s\S]*?)\n```/) || 
                          surveyContent.match(/```([\s\S]*?)```/);
                          
        const jsonContent = jsonMatch ? jsonMatch[1] : surveyContent;
        templateData = JSON.parse(jsonContent);
        
        // Validate required fields
        if (!templateData.title || !templateData.fields) {
          console.error('Missing required fields in template data');
          return res.status(500).json({ error: 'Invalid survey template format' });
        }
      } catch (e) {
        console.error('Failed to parse survey template:', e);
        console.error('Raw content:', surveyContent);
        return res.status(500).json({ error: 'Failed to parse survey template' });
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      return res.status(500).json({ error: 'Failed to generate survey with OpenAI' });
    }

    // Save the survey template
    const { data: survey, error: saveError } = await supabase
      .from('survey_templates')
      .insert({
        title: templateData.title || 'New Survey',
        description: templateData.description || '',
        created_by: userId,
        church_id: churchId,
        survey_type: surveyType,
        template_data: templateData,
      })
      .select()
      .single();

    if (saveError) {
      return res.status(500).json({ error: 'Failed to save survey template' });
    }

    return res.status(200).json({ survey });
  } catch (error) {
    console.error('Error generating survey:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
