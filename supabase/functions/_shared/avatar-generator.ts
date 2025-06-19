
import { corsHeaders } from "./cors.ts";

export interface AvatarGenerationParams {
  researchSummary: string;
  companionContext: string;
  location?: string;
  entityType: "church" | "community";
}

export async function generateAvatars({
  researchSummary,
  companionContext,
  location,
  entityType
}: AvatarGenerationParams, GEMINI_API_KEY: string) {
  if (!researchSummary) {
    throw new Error(`${entityType === "church" ? "Church" : "Community"} description or research summary is required`);
  }

  if (!GEMINI_API_KEY) {
    throw new Error("Missing API key for Gemini");
  }

  const locationInfo = location ? `The ${entityType} is located in ${location}.` : '';
  
  const prompt = `
    Generate three distinct, creative personas that could represent a ${entityType === "church" ? "church" : "community"} based on the following research summary:
    
    ${researchSummary}
    ${locationInfo}
    
    ${companionContext}
    
    For each persona, provide:
    1. A creative name for this ${entityType} avatar (avatar_name) - THIS IS REQUIRED AND MUST BE DISTINCTIVE
    2. A first-person point of view statement from this persona about the ${entityType}'s identity and ${entityType === "church" ? "mission" : "character"} (avatar_point_of_view)
    
    Return the results in the following format:

    Avatar 1: [Avatar Name]
    Point of View: [First person statement about the ${entityType}'s identity and ${entityType === "church" ? "mission" : "character"}]

    Avatar 2: [Avatar Name]
    Point of View: [First person statement about the ${entityType}'s identity and ${entityType === "church" ? "mission" : "character"}]

    Avatar 3: [Avatar Name]
    Point of View: [First person statement about the ${entityType}'s identity and ${entityType === "church" ? "mission" : "character"}]
    
    IMPORTANT: Each avatar MUST have a unique, creative name. Do not return generic names like "Avatar 1".
  `;

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", errorData);
      throw new Error(`API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      console.error("Gemini data error:", data.error);
      throw new Error(data.error.message || `Error generating ${entityType} avatars`);
    }

    let generatedText = "";
    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts) {
      generatedText = data.candidates[0].content.parts[0].text;
    } else {
      console.error("Unexpected Gemini API response structure:", data);
      throw new Error(`Failed to extract content from Gemini API response for ${entityType} avatars`);
    }
    
    console.log("Raw generated text:", generatedText);
    
    // Improved parsing logic for avatar sections
    const avatarSections = generatedText.split(/Avatar\s*\d+\s*:/i).filter(section => section.trim().length > 0);
    console.log("Found avatar sections:", avatarSections.length);
    
    if (avatarSections.length === 0) {
      console.error("Failed to parse avatar sections from:", generatedText);
      // Return fallback avatars if parsing fails
      return { 
        avatars: generateFallbackAvatars(entityType) 
      };
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
        avatarName = `${entityType === "church" ? "Church" : "Community"} Avatar ${index + 1}`;
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
        pointOfView = `I represent this ${entityType === "church" ? "church's" : "community's"} unique character, values, and ${entityType === "church" ? "mission" : "needs"}.`;
      }
      
      console.log(`Parsed ${entityType} avatar:`, { avatarName, povExcerpt: pointOfView.substring(0, 30) + "..." });
      
      return {
        avatar_name: avatarName,
        avatar_point_of_view: pointOfView,
        image_url: `https://api.dicebear.com/7.x/personas/svg?seed=${avatarName}-${Date.now()}-${index}`
      };
    });

    if (avatars.length === 0) {
      // Return fallback avatars if we couldn't create any
      return { 
        avatars: generateFallbackAvatars(entityType) 
      };
    }

    return { avatars };
  } catch (error) {
    console.error(`Error in generateAvatars for ${entityType}:`, error);
    
    // Return fallback avatars in case of any error
    return { 
      avatars: generateFallbackAvatars(entityType) 
    };
  }
}

// Function to generate fallback avatars when the AI generation fails
function generateFallbackAvatars(entityType: "church" | "community") {
  const timestamp = Date.now();
  
  if (entityType === "church") {
    return [
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
  } else {
    return [
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
  }
}
