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
    console.log('[ResourceGeneration] Starting generation for:', originalResource.title);
    
    // Get current user and profile info
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      throw new Error('You must be logged in to generate resources');
    }

    // Get user profile for church_id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', session.user.id)
      .single();

    if (profileError || !profileData?.church_id) {
      console.error('[ResourceGeneration] Profile error:', profileError);
      throw new Error('Could not fetch user profile information');
    }

    // Fetch the 'resources' prompt from the database
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('prompt')
      .eq('prompt_type', 'resources')
      .single();

    if (promptError || !promptData) {
      console.error('[ResourceGeneration] Prompt error:', promptError);
      // Use a fallback prompt if database prompt is not available
      console.log('[ResourceGeneration] Using fallback prompt');
    }

    const promptText = promptData?.prompt || `Generate 3-5 related resources based on the provided resource. Each resource should have a title and detailed content that complements or expands on the original resource. Format the response as a JSON array with objects containing 'title' and 'content' fields.`;

    // Call the OpenAI edge function
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jeezilcobzdayekigzvf.supabase.co';
    const aiResponse = await fetch(`${supabaseUrl}/functions/v1/openai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        prompt: `Based on the resource: "${originalResource.title}"
Content: ${originalResource.content.substring(0, 1000)}

${promptText}`
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('[ResourceGeneration] AI API error:', errorText);
      throw new Error(`Failed to generate resources: ${aiResponse.status} ${aiResponse.statusText}`);
    }

    const response = await aiResponse.json();
    console.log('[ResourceGeneration] AI response:', response);

    // Parse the response
    let generatedResources;
    try {
      // Try to parse the response text as JSON
      const responseText = response.text || response.content || JSON.stringify(response);
      generatedResources = JSON.parse(responseText);
      
      // Ensure it's an array
      if (!Array.isArray(generatedResources)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('[ResourceGeneration] Failed to parse OpenAI response:', response);
      // Try to create a fallback resource
      generatedResources = [{
        title: `Related Resource for: ${originalResource.title}`,
        content: `This is a generated resource related to "${originalResource.title}". The AI response could not be parsed properly, but this placeholder resource has been created.`
      }];
    }

    console.log('[ResourceGeneration] Parsed resources:', generatedResources);

    // Save generated resources to the database
    const resourcesToSave = generatedResources.map((resource: {
      title: string;
      content: string;
    }) => ({
      title: resource.title || 'Untitled Generated Resource',
      content: resource.content || 'No content available',
      category: originalResource.category || 'Related Resources',
      tags: originalResource.tags || ['AI Generated'],
      resource_type: 'ai_generated',
      scenario_title: `Generated from: ${originalResource.title}`,
      user_id: session.user.id,
      church_id: profileData.church_id,
      created_by: session.user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    console.log('[ResourceGeneration] Saving resources:', resourcesToSave);

    const { data: savedResources, error: saveError } = await supabase
      .from('resource_library')
      .insert(resourcesToSave)
      .select('*');

    if (saveError) {
      console.error('[ResourceGeneration] Error saving generated resources:', saveError);
      throw new Error(`Failed to save resources: ${saveError.message}`);
    }

    console.log('[ResourceGeneration] Successfully saved resources:', savedResources);

    toast({
      title: "Resources Generated",
      description: `${resourcesToSave.length} related resources have been created and added to your library.`
    });

    return savedResources;
  } catch (error) {
    console.error('[ResourceGeneration] Resource generation failed:', error);
    toast({
      title: "Resource Generation Failed",
      description: error instanceof Error ? error.message : 'Unknown error occurred',
      variant: "destructive"
    });
    return null;
  }
};
