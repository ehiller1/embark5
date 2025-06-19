
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface GeminiRequestBody {
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

// Add exponential backoff retry logic for rate limits
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // If not a rate limit error or we've exhausted retries, return the response
      if (response.status !== 429 || retries === maxRetries - 1) {
        return response;
      }
      
      // Calculate backoff time with exponential increase (300ms, 600ms, 1200ms...)
      const backoffTime = 300 * Math.pow(2, retries);
      console.log(`[Gemini Edge Function] Rate limited, retrying in ${backoffTime}ms (attempt ${retries + 1}/${maxRetries})`);
      
      // Wait for backoff period before retry
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      retries++;
    } catch (error) {
      if (retries === maxRetries - 1) throw error;
      retries++;
    }
  }

  throw new Error("Max retries exceeded");
}

serve(async (req) => {
  console.log("[Gemini Edge Function] Request received");
  
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    console.log("[Gemini Edge Function] Handling OPTIONS request");
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      console.error("[Gemini Edge Function] Missing OPENAI_API_KEY in secrets");
      return new Response(
        JSON.stringify({ 
          error: "OPENAI_API_KEY is not configured in secrets",
          status: "configuration_error" 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const requestData = await req.json() as GeminiRequestBody;
    const { prompt, maxTokens = 1024, temperature = 0.7 } = requestData;
    
    console.log("[Gemini Edge Function] Request data:", {
      promptLength: prompt?.length || 0,
      maxTokens,
      temperature,
    });
    
    if (!prompt) {
      console.error("[Gemini Edge Function] Missing prompt in request");
      return new Response(
        JSON.stringify({ error: "Prompt is required", status: "validation_error" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[Gemini Edge Function] Redirecting to OpenAI API");
    const startTime = Date.now();
    
    try {
      const response = await fetchWithRetry(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              { role: "user", content: prompt }
            ],
            max_tokens: maxTokens,
            temperature: temperature,
          }),
        },
        3 // Max retries
      );

      const responseTime = Date.now() - startTime;
      console.log(`[Gemini Edge Function] OpenAI API response status: ${response.status} in ${responseTime}ms`);
      
      const responseText = await response.text();
      console.log("[Gemini Edge Function] Raw response:", responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""));
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("[Gemini Edge Function] Failed to parse response as JSON:", parseError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to parse OpenAI API response", 
            details: responseText.substring(0, 500),
            status: "parse_error",
            responseStatus: response.status
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (!response.ok) {
        console.error("[Gemini Edge Function] OpenAI API error:", data);
        
        // Specific handling for rate limiting to make it clearer to the frontend
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ 
              error: "AI service is currently at capacity. Please try again shortly.", 
              details: data,
              status: "rate_limited",
              retry_after: 5 // Suggest retry after 5 seconds
            }),
            {
              status: 429,
              headers: { 
                ...corsHeaders, 
                "Content-Type": "application/json",
                "Retry-After": "5" 
              },
            }
          );
        }
        
        return new Response(
          JSON.stringify({ 
            error: "Failed to generate content from OpenAI API", 
            details: data,
            status: "api_error",
            responseStatus: response.status
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Extract text from the response
      const generatedText = data.choices?.[0]?.message?.content || "";
      console.log("[Gemini Edge Function] Generated text length:", generatedText.length);

      return new Response(
        JSON.stringify({ 
          text: generatedText,
          finishReason: data.choices?.[0]?.finish_reason,
          responseTime,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (fetchError) {
      console.error("[Gemini Edge Function] Fetch error:", fetchError);
      
      // Determine if this is a rate limiting or network issue
      const isRateLimitError = fetchError.message?.includes('429') || 
                              fetchError.message?.toLowerCase().includes('rate limit');
      
      return new Response(
        JSON.stringify({ 
          error: isRateLimitError 
            ? "AI service is currently at capacity. Please try again shortly."
            : "Failed to connect to AI service", 
          details: fetchError.message,
          status: isRateLimitError ? "rate_limited" : "connection_error"
        }),
        {
          status: isRateLimitError ? 429 : 503,
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": isRateLimitError ? "5" : "1"
          },
        }
      );
    }
  } catch (error) {
    console.error("[Gemini Edge Function] Unexpected error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack,
        status: "unknown_error"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
