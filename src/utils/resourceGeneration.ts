import { supabase } from '@/integrations/lib/supabase';
import { toast } from '@/hooks/use-toast';

export const generateRelatedResources = async (
  originalResource: {
    title: string;
    content: string;
    category?: string;
    tags?: string[];
  }
) => {
  try {
    // Fetch the 'resources' prompt from the database
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('prompt')
      .eq('prompt_type', 'resources')
      .single();

    if (promptError || !promptData) {
      throw new Error('Could not fetch resource generation prompt');
    }

    // Get the current session using the proper API method
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('You must be logged in to generate resources');
    }

    // Call the OpenAI edge function
    const aiResponse = await fetch('https://jeezilcobzdayekigzvf.supabase.co/functions/v1/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        prompt: `Based on the resource: "${originalResource.title}"
Content: ${originalResource.content.substring(0, 1000)}
Please generate related resources following these guidelines: ${promptData.prompt}`
      })
    });

    if (!aiResponse.ok) {
      throw new Error('Failed to generate resources');
    }

    const response = await aiResponse.json();

    // Parse the response
    let generatedResources;
    try {
      generatedResources = JSON.parse(response.text);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response', response.text);
      throw new Error('Could not parse generated resources');
    }

    // Save generated resources to the database
    const resourcesToSave = generatedResources.map((resource: {
      title: string;
      content: string;
    }) => ({
      title: resource.title,
      content: resource.content,
      category: originalResource.category || 'Related Resources',
      tags: originalResource.tags || ['AI Generated'],
      resource_type: 'ai_generated',
      scenario_title: `Generated from: ${originalResource.title}`
    }));

    const { data: savedResources, error: saveError } = await supabase
      .from('resource_library')
      .insert(resourcesToSave);

    if (saveError) {
      console.error('Error saving generated resources', saveError);
      throw saveError;
    }

    toast({
      title: "Resources Generated",
      description: `${resourcesToSave.length} related resources have been created.`
    });

    return savedResources;
  } catch (error) {
    console.error('Resource generation failed', error);
    toast({
      title: "Resource Generation Failed",
      description: error instanceof Error ? error.message : 'Unknown error occurred',
      variant: "destructive"
    });
    return null;
  }
};
