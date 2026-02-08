export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // CORS headers configuration
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // Handle OPTIONS requests globally
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    if (request.method === "GET") {
      return new Response(
        JSON.stringify({ status: "ok", message: "Use POST /summarize" }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders,
        },
      });
    }

    if (url.pathname !== "/summarize") {
      return new Response("Not Found", {
        status: 404,
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders,
        },
      });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
          ...corsHeaders,
        },
      });
    }

    // Google Gemini API endpoint for text summarization
    const geminiApiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";
    const geminiApiKey = env.Genimi_API_Key;

    try {
      // Gemini expects a prompt structure
      const geminiPayload = {
        contents: [
          {
            parts: [{ text: payload.inputs }],
          },
        ],
      };
      const geminiResponse = await fetch(
        `${geminiApiUrl}?key=${geminiApiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(geminiPayload),
        },
      );

      const data = await geminiResponse.json();

      // Return the response with the original status from Gemini
      return new Response(JSON.stringify(data), {
        status: geminiResponse.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error.message || error.toString() || "Unknown error",
          stack: error.stack,
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        },
      );
    }
  },
};
