
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { 
      researchSummary, 
      narrative, 
      churchAvatar, 
      communityAvatar, 
      companionAvatar,
      missionalAvatar
    } = await req.json();

    console.log('Generating scenarios with parameters:', { 
      researchSummaryLength: researchSummary?.length, 
      narrativeLength: narrative?.length,
      churchAvatar: churchAvatar?.avatar_name,
      communityAvatar: communityAvatar?.avatar_name,
      companionAvatar: companionAvatar?.companion,
      missionalAvatar: missionalAvatar?.avatar_name
    });

    // Fetch the scenario_builder prompt
    const { data: promptData, error: promptError } = await supabase
      .from('prompts')
      .select('prompt')
      .eq('prompt_type', 'scenario_builder')
      .single();

    if (promptError || !promptData) {
      throw new Error('Failed to retrieve scenario builder prompt');
    }

    let populatedPrompt = promptData.prompt
      .replace('$(research summary)', researchSummary || '')
      .replace('$(narrative or vocation)', narrative || '')
      .replace('$(companion avatar)', companionAvatar?.description || '')
      .replace('$(church avatar)', churchAvatar?.avatar_point_of_view || '')
      .replace('$(community avatar)', communityAvatar?.avatar_point_of_view || '');

    // Add missional avatar to prompt if available
    if (missionalAvatar && missionalAvatar.avatar_point_of_view) {
      console.log('Including missional perspective:', missionalAvatar.avatar_name);
      populatedPrompt += `\n\nConsider the following missional perspective when creating scenarios: ${missionalAvatar.avatar_point_of_view}`;
    }

    console.log('Calling OpenAI with prompt length:', populatedPrompt.length);

    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are an expert in generating transformational scenarios for churches.' },
          { role: 'user', content: populatedPrompt }
        ],
        max_tokens: 2048
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${openAIResponse.status} ${errorData}`);
    }

    const data = await openAIResponse.json();
    const generatedScenarios = JSON.parse(data.choices[0].message.content);

    console.log('Successfully generated scenarios:', generatedScenarios.scenarios.length);

    return new Response(JSON.stringify(generatedScenarios), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  } catch (error) {
    console.error('Error generating scenarios:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json' 
      },
    });
  }
});
