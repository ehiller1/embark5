
// Import required modules
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Serve HTTP requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('OpenAI Edge Function called at:', new Date().toISOString());
  const startTime = Date.now();
  
  try {
    // Get OpenAI API key from environment
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) {
      console.error('Missing OPENAI_API_KEY environment variable');
      throw new Error('OpenAI API key is not configured in the Supabase project')
    }

    // Parse the request body
    const requestData = await req.json()
    console.log('Received request data:', JSON.stringify(requestData).substring(0, 200) + '...');
    
    const { prompt, maxTokens = 1024, temperature = 0.7, systemPrompt } = requestData

    if (!prompt) {
      console.error('Missing prompt in request');
      throw new Error('Prompt is required')
    }

    if (!systemPrompt) {
      console.error('Missing system prompt in request');
      throw new Error('System prompt is required')
    }

    console.log('Request data:', { 
      maxTokens, 
      temperature, 
      promptLength: prompt.length, 
      promptPreview: prompt.substring(0, 100) + '...'
    });

    // If this is a JSON-generating request, check if system prompt indicates that
    const isJsonRequest = systemPrompt.toLowerCase().includes("json");
    if (isJsonRequest) {
      console.log('Detected JSON-generating request, will ensure proper formatting');
    }

    console.log('Calling OpenAI API with model: gpt-4o-mini');
    const openAIStartTime = Date.now();
    
    try {
      // Send request to OpenAI Chat API using native fetch with a timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Request timeout triggered after 60 seconds');
        controller.abort();
      }, 60000); // 60 second timeout
      
      const openAIPayload = {
        model: "gpt-4o-mini",
        messages: [
          { 
            role: "system", 
            content: systemPrompt
          },
          { 
            role: "user", 
            content: prompt 
          }
        ],
        temperature: temperature,
        max_tokens: maxTokens,
      };

      // For JSON requests, add specific parameters
      if (isJsonRequest) {
        // Add response format to ensure JSON
        openAIPayload.response_format = { type: "json_object" };
        console.log('Added JSON response format to request');
      }

      console.log('Sending payload to OpenAI:', JSON.stringify(openAIPayload).substring(0, 200) + '...');
      
      // Add retries for network issues and rate limits
      let retries = 3;
      let response;
      let errorMessages = [];
      
      while (retries >= 0) {
        try {
          // Use exponential backoff for retries
          if (retries < 3) {
            const backoffTime = Math.pow(2, 3-retries) * 1000; // 2s, 4s, 8s
            console.log(`Retrying after backoff: ${backoffTime}ms`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
          }
          
          response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(openAIPayload),
            signal: controller.signal
          });
          
          // Handle rate limiting specifically with proper backoff
          if (response.status === 429) {
            let responseBody;
            try {
              responseBody = await response.text();
              console.log(`Rate limit hit: ${responseBody}`);
            } catch (e) {
              console.error("Error reading response body after rate limit:", e);
              responseBody = "Rate limit error (could not read details)";
            }
            
            // Get retry-after header or default to increasing backoff
            let retryAfter = response.headers.get("retry-after");
            let waitTime = retryAfter ? parseInt(retryAfter) * 1000 : (5000 * Math.pow(2, 3-retries));
            
            errorMessages.push(`Attempt ${3-retries}: Rate limit (429) - waiting ${waitTime}ms`);
            
            if (retries > 0) {
              console.log(`Rate limit hit, waiting ${waitTime}ms before retry ${3-retries}`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries--;
              continue;
            }
          }
          
          // If successful (or any other error), break out of retry loop
          break;
        } catch (fetchError) {
          errorMessages.push(`Fetch error on attempt ${3-retries}: ${fetchError.message}`);
          
          if (retries === 0) throw fetchError;
          retries--;
        }
      }
      
      clearTimeout(timeoutId);

      // If we got a response but it has an error
      if (response && !response.ok) {
        let errorBody;
        try {
          errorBody = await response.text();
          console.error(`OpenAI API error with status ${response.status}:`, errorBody);
        } catch (e) {
          console.error("Error reading error body:", e);
          errorBody = "Could not read error details";
        }
        
        // Handle different error types
        if (response.status === 429) {
          // Special handling for rate limits to provide clear information
          let rateLimitMessage = "OpenAI rate limit exceeded.";
          try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.error?.message) {
              rateLimitMessage = errorJson.error.message;
            }
          } catch (e) {
            // If we can't parse the response, just use the status code
          }
          
          // Get retry-after header if available
          const retryAfter = response.headers.get("retry-after") || "5";
          
          return new Response(
            JSON.stringify({ 
              error: rateLimitMessage, 
              retry_after: retryAfter,
              status: "rate_limited",
              text: "I apologize, but we've reached our API rate limits. Please try again in a few moments."
            }),
            { 
              status: 429,
              headers: { 
                ...corsHeaders,
                'Content-Type': 'application/json',
                'Retry-After': retryAfter
              },
            }
          );
        } else {
          throw new Error(`Failed to connect to OpenAI API: ${response.status} - ${errorBody}`);
        }
      }

      if (!response) {
        throw new Error("Failed to get response from OpenAI after multiple retries");
      }

      console.log('OpenAI API response status:', response.status);
      console.log('OpenAI API call duration:', Date.now() - openAIStartTime, 'ms');
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error("Error parsing OpenAI response as JSON:", e);
        throw new Error("Invalid JSON response from OpenAI API");
      }
      
      console.log('Received response from OpenAI');
      
      // Extract the response text and ensure it's a string
      let text = data.choices[0]?.message?.content?.trim();
      if (text === undefined || text === null) {
        console.warn('OpenAI returned null or undefined text');
        throw new Error('Invalid response from OpenAI: missing content');
      }
      
      console.log('Response text length:', text.length);
      console.log('Response text (first 100 chars):', text.substring(0, 100));
      
      // For JSON requests, try to validate the JSON
      if (isJsonRequest) {
        try {
          // Attempt to parse as JSON to validate
          // First remove any markdown code blocks if present
          const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');
          JSON.parse(cleanedText);
          console.log('Successfully validated JSON response');
          // For JSON responses, ensure we're returning the cleaned text
          text = cleanedText;
        } catch (e) {
          console.warn('Response from JSON request is not valid JSON:', e.message);
          throw new Error('Invalid JSON response from OpenAI');
        }
      }
      
      // Success response with consistent structure
      return new Response(
        JSON.stringify({
          text,
          source: "openai",
          model: "gpt-4o-mini",
          success: true
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    } catch (apiError) {
      console.error('OpenAI API error:', apiError.message);
      console.error('Error stack:', apiError.stack);
      throw apiError;
    }
  } catch (error) {
    console.error('Error in edge function:', error.message);
    console.error('Error stack:', error.stack);
    console.log('Total error handling time:', Date.now() - startTime, 'ms');

    // Get appropriate status code based on error
    let statusCode = 500;
    let errorMessage = error.message || 'An unexpected error occurred';
    
    // Handle rate limiting errors specially
    if (errorMessage.includes('rate limit')) {
      statusCode = 429;
      
      // Return a clean response for rate limit errors
      return new Response(
        JSON.stringify({ 
          error: "Rate limit reached. Please try again later.",
          status: "rate_limited",
          retry_after: "5", // Default retry-after if not provided
          text: "I apologize, but we've reached our API rate limits. Please try again in a few moments."
        }),
        { 
          status: statusCode,
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Retry-After': '5'
          },
        }
      );
    }

    // General error handling with consistent structure
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        status: 'error',
        success: false
      }),
      { 
        status: statusCode,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } finally {
    console.log('Total edge function execution time:', Date.now() - startTime, 'ms');
  }
})
