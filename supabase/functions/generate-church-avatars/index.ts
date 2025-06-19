import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface RequestBody {
  churchName?: string;
  churchDescription?: string;
  location?: string;
  companionContext: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
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

    // Only validate companionContext as required
    if (!body.companionContext) {
      return new Response(
        JSON.stringify({ error: "Missing data", message: "Companion context is required" }),
        {
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { churchName, churchDescription, location, companionContext } = body;

    // Construct a research summary from churchName and churchDescription if provided
    let researchSummary = "";
    if (churchName) {
      researchSummary += `Church Name: ${churchName}\n`;
    }
    if (churchDescription && churchDescription.trim()) {
      researchSummary += `${churchDescription}\n`;
    }

    console.log("Generating church avatars with research summary length:", researchSummary.length);
    
    // Create the prompt for OpenAI, including research summary only if it exists
    const researchPart = researchSummary ? `based on the following research summary:\n${researchSummary}\n` : "";
    
    const prompt = `
      Generate three distinct, creative personas that could represent a church ${researchPart}
      ${location ? `The church is located in ${location}.` : ''}
      
      ${companionContext}
      
      For each persona, provide:
      1. A creative name for this church avatar (avatar_name) - THIS IS REQUIRED AND MUST BE DISTINCTIVE
      2. A first-person point of view statement from this persona about the church's identity and mission (avatar_point_of_view)
      
      Return the results in the following format:

      Avatar 1: [Avatar Name]
      Point of View: [First person statement about the church's identity and mission]

      Avatar 2: [Avatar Name]
      Point of View: [First person statement about the church's identity and mission]

      Avatar 3: [Avatar Name]
      Point of View: [First person statement about the church's identity and mission]
      
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
            { role: "system", content: "You are an expert at creating church personas and avatars." },
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
        throw new Error(data.error.message || `Error generating church avatars`);
      }

      let generatedText = "";
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        generatedText = data.choices[0].message.content;
        console.log("Generated text received, length:", generatedText.length);
      } else {
        console.error("Unexpected OpenAI API response structure:", data);
        throw new Error(`Failed to extract content from OpenAI API response for church avatars`);
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
            avatar_name: "Spiritual Sanctuary",
            avatar_point_of_view: "I represent a place of spiritual refuge and growth, where people can find peace and connection with something greater than themselves.",
            image_url: `https://api.dicebear.com/7.x/personas/svg?seed=SpiritualSanctuary-${timestamp}-0`
          },
          {
            avatar_name: "Community Beacon",
            avatar_point_of_view: "I am a beacon of hope and community service, bringing people together to support each other and make a positive impact in the world.",
            image_url: `https://api.dicebear.com/7.x/personas/svg?seed=CommunityBeacon-${timestamp}-1`
          },
          {
            avatar_name: "Faith Journey",
            avatar_point_of_view: "I embody the personal and collective journey of faith, with all its questions, discoveries, and transformative experiences.",
            image_url: `https://api.dicebear.com/7.x/personas/svg?seed=FaithJourney-${timestamp}-2`
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
          avatarName = `Church Avatar ${index + 1}`;
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
          pointOfView = `I represent this church's unique character, values, and mission.`;
        }
        
        console.log(`Parsed church avatar:`, { avatarName, povExcerpt: pointOfView.substring(0, 30) + "..." });
        
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
    console.error(`Error in generate-church-avatars:`, error);
    
    // Return fallback avatars in case of any error
    const timestamp = Date.now();
    const fallbackAvatars = [
      {
        avatar_name: "Spiritual Sanctuary",
        avatar_point_of_view: "I represent a place of spiritual refuge and growth, where people can find peace and connection with something greater than themselves.",
        image_url: `https://api.dicebear.com/7.x/personas/svg?seed=SpiritualSanctuary-${timestamp}-0`
      },
      {
        avatar_name: "Community Beacon",
        avatar_point_of_view: "I am a beacon of hope and community service, bringing people together to support each other and make a positive impact in the world.",
        image_url: `https://api.dicebear.com/7.x/personas/svg?seed=CommunityBeacon-${timestamp}-1`
      },
      {
        avatar_name: "Faith Journey",
        avatar_point_of_view: "I embody the personal and collective journey of faith, with all its questions, discoveries, and transformative experiences.",
        image_url: `https://api.dicebear.com/7.x/personas/svg?seed=FaithJourney-${timestamp}-2`
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
