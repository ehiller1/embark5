
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface RequestBody {
  researchSummary: string;
  companionContext: string;
  location?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate API key early
    if (!OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable");
      return new Response(
        JSON.stringify({ 
          error: "API configuration error",
          message: "OPENAI_API_KEY is not configured in the environment"
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body with error handling
    let body: RequestBody;
    try {
      body = await req.json() as RequestBody;
      console.log("Request body received:", JSON.stringify(body).substring(0, 200) + "...");
    } catch (e) {
      console.error("Error parsing request body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid request", message: "Could not parse request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Only validate the companionContext as required
    if (!body.companionContext) {
      return new Response(
        JSON.stringify({ 
          error: "Missing data", 
          message: "Companion context is required" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { researchSummary, companionContext, location } = body;

    console.log("Generating community avatars with research summary length:", researchSummary?.length || 0);
    
    // Create a research summary that includes available information, skip if not available
    let researchContent = "";
    if (researchSummary && researchSummary.trim()) {
      researchContent = `Research Summary:\n${researchSummary}\n\n`;
    }
    
    // Create the prompt for OpenAI
    const prompt = `
      Generate three distinct, creative personas that could represent a community based on the following information:
      
      ${researchContent}
      ${location ? `The community is located in ${location}.` : ''}
      
      ${companionContext}
      
      For each persona, provide:
      1. A creative name for this community avatar (avatar_name) - THIS IS REQUIRED AND MUST BE DISTINCTIVE
      2. A first-person point of view statement from this persona about the community's identity and character (avatar_point_of_view)
      
      Return the results in the following format:

      Avatar 1: [Avatar Name]
      Point of View: [First person statement about the community's identity and character]

      Avatar 2: [Avatar Name]
      Point of View: [First person statement about the community's identity and character]

      Avatar 3: [Avatar Name]
      Point of View: [First person statement about the community's identity and character]
      
      IMPORTANT: Each avatar MUST have a unique, creative name. Do not return generic names like "Avatar 1".
    `;

    console.log("Sending request to OpenAI API");
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: "You are an expert at creating community personas and avatars." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI API error:", errorData);
        throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      console.log("OpenAI API response received");

      if (data.error) {
        console.error("OpenAI data error:", data.error);
        throw new Error(data.error.message || `Error generating community avatars`);
      }

      let generatedText = "";
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        generatedText = data.choices[0].message.content;
        console.log("Generated text received, length:", generatedText.length);
      } else {
        console.error("Unexpected OpenAI API response structure:", data);
        throw new Error(`Failed to extract content from OpenAI API response for community avatars`);
      }
      
      // Improved parsing logic for avatar sections
      const avatarSections = generatedText.split(/Avatar\s*\d+\s*:/i).filter(section => section.trim().length > 0);
      console.log("Found avatar sections:", avatarSections.length);
      
      if (avatarSections.length === 0) {
        console.error("Failed to parse avatar sections from:", generatedText);
        // Return fallback avatars if parsing fails
        const timestamp = Date.now();
        const fallbackAvatars = [
          {
            avatar_name: "Diverse Neighborhood",
            avatar_point_of_view: "I represent the rich tapestry of cultures, backgrounds, and perspectives that make up this vibrant community.",
            image_url: `https://api.dicebear.com/7.x/personas/svg?seed=DiverseNeighborhood-${timestamp}-0`
          },
          {
            avatar_name: "Local Heritage",
            avatar_point_of_view: "I embody the history and traditions that have shaped this community over generations, preserving its unique character.",
            image_url: `https://api.dicebear.com/7.x/personas/svg?seed=LocalHeritage-${timestamp}-1`
          },
          {
            avatar_name: "Future Vision",
            avatar_point_of_view: "I represent the aspirations and potential of this community, focused on growth, innovation, and creating a better future for all residents.",
            image_url: `https://api.dicebear.com/7.x/personas/svg?seed=FutureVision-${timestamp}-2`
          }
        ];
        return new Response(
          JSON.stringify({ avatars: fallbackAvatars }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const avatars = avatarSections.map((section, index) => {
        console.log(`Processing section ${index + 1}:`, section.substring(0, 50) + "...");
        
        const lines = section.trim().split('\n').filter(line => line.trim().length > 0);
        
        let avatarName;
        let pointOfView = "";
        
        // Try to find the name in the first line if it's not a "Point of View:" line
        if (lines.length > 0 && !lines[0].toLowerCase().includes('point of view:')) {
          avatarName = lines[0].trim().replace(/^\s*:\s*/, '').replace(/\*/g, '');
        } 
        
        if (!avatarName || avatarName.trim().length < 2) {
          avatarName = `Community Avatar ${index + 1}`;
        }
        
        // Find the point of view section
        const povIndex = lines.findIndex(line => line.toLowerCase().includes('point of view:') || line.toLowerCase().includes('pov:'));
        
        if (povIndex !== -1) {
          // Extract from "Point of View:" label
          const povLine = lines[povIndex];
          const povContent = povLine.substring(povLine.indexOf(':') + 1).trim();
          
          // Combine the rest of the content after "Point of View:"
          pointOfView = [povContent, ...lines.slice(povIndex + 1)].join(' ').trim();
        } else if (lines.length > 1) {
          // If no explicit "Point of View:" marker but more than one line, use everything after name as point of view
          pointOfView = lines.slice(1).join(' ').trim();
        }
        
        // Ensure we have a point of view
        if (!pointOfView || pointOfView.trim().length < 10) {
          pointOfView = `I represent this community's unique character, values, and needs.`;
        }
        
        console.log(`Parsed community avatar:`, { avatarName, povExcerpt: pointOfView.substring(0, 30) + "..." });
        
        return {
          avatar_name: avatarName,
          avatar_point_of_view: pointOfView,
          image_url: `https://api.dicebear.com/7.x/personas/svg?seed=${avatarName}-${Date.now()}-${index}`
        };
      });

      console.log("Returning avatars:", avatars.length);
      return new Response(
        JSON.stringify({ avatars }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      throw fetchError;
    }
  } catch (error) {
    console.error("Error in generate-community-avatars function:", error);
    
    // Return fallback avatars in case of any error
    const timestamp = Date.now();
    const fallbackAvatars = [
      {
        avatar_name: "Diverse Neighborhood",
        avatar_point_of_view: "I represent the rich tapestry of cultures, backgrounds, and perspectives that make up this vibrant community.",
        image_url: `https://api.dicebear.com/7.x/personas/svg?seed=DiverseNeighborhood-${timestamp}-0`
      },
      {
        avatar_name: "Local Heritage",
        avatar_point_of_view: "I embody the history and traditions that have shaped this community over generations, preserving its unique character.",
        image_url: `https://api.dicebear.com/7.x/personas/svg?seed=LocalHeritage-${timestamp}-1`
      },
      {
        avatar_name: "Future Vision",
        avatar_point_of_view: "I represent the aspirations and potential of this community, focused on growth, innovation, and creating a better future for all residents.",
        image_url: `https://api.dicebear.com/7.x/personas/svg?seed=FutureVision-${timestamp}-2`
      }
    ];
    
    return new Response(
      JSON.stringify({ 
        avatars: fallbackAvatars,
        error: error.message || "An error occurred generating avatars" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
