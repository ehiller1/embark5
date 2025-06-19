
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface SerpApiRequestBody {
  query: string;
  numResults?: number;
}

interface SerpApiResponse {
  organic_results?: Array<{
    position: number;
    title: string;
    link: string;
    snippet: string;
    displayed_link: string;
  }>;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  console.log("[SERPAPI] Function called at:", new Date().toISOString());
  console.log("[SERPAPI] Request method:", req.method);
  console.log("[SERPAPI] Request headers:", Object.fromEntries(req.headers));
  
  try {
    const apiKey = Deno.env.get("SERPAPI_API_KEY");
    console.log("[SERPAPI] API Key status:", apiKey ? "Present" : "MISSING");
    
    if (!apiKey) {
      console.error("[SERPAPI] Critical Error: SERPAPI_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "SERPAPI_API_KEY is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.json();
    console.log("[SERPAPI] Request body:", body);
    
    const { query, numResults = 5 } = body as SerpApiRequestBody;
    
    if (!query) {
      console.error("[SERPAPI] Error: Search query is required");
      return new Response(
        JSON.stringify({ error: "Search query is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Construct the SerpAPI URL
    const url = new URL("https://serpapi.com/search");
    url.searchParams.append("engine", "google");
    url.searchParams.append("q", query);
    url.searchParams.append("api_key", apiKey);
    url.searchParams.append("num", numResults.toString());

    console.log("[SERPAPI] Final request URL:", url.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    console.log("[SERPAPI] Response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[SERPAPI] SerpAPI request failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData.error || "Unknown error"
      });
      
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch search results from SerpAPI",
          details: errorData.error || response.statusText,
          status: response.status
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await response.json();
    console.log("[SERPAPI] Full response data:", data);
    console.log("[SERPAPI] Response results count:", data.organic_results?.length || 0);

    return new Response(
      JSON.stringify({
        organic_results: data.organic_results?.slice(0, numResults) || [],
        search_metadata: data.search_metadata,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[SERPAPI] Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        fullError: error.toString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
