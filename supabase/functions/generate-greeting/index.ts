import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { festival, school_name, custom_message } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating greeting for ${festival} - ${school_name}`);

    // Generate a creative greeting message using AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a creative greeting message writer for a school named "${school_name}". 
            Create warm, festive, and appropriate greeting messages for students and parents.
            Keep messages positive, inclusive, and under 100 words.
            Include relevant emojis to make it festive.`,
          },
          {
            role: "user",
            content: custom_message 
              ? `Create a beautiful ${festival} greeting message. The school wants to include this message: "${custom_message}". Make it engaging and festive.`
              : `Create a beautiful and warm ${festival} greeting message from ${school_name} to all students, parents, and staff. Make it heartfelt and celebratory.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedMessage = data.choices?.[0]?.message?.content || custom_message || `Happy ${festival}!`;

    console.log("Generated message:", generatedMessage);

    // Return the generated message
    // Note: For actual image generation, you would use google/gemini-2.5-flash-image-preview
    return new Response(
      JSON.stringify({
        message: generatedMessage,
        festival,
        school_name,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in generate-greeting:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate greeting";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
