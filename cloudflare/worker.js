export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // CORS headers configuration
    // Note: Using wildcard (*) for Access-Control-Allow-Origin as this is a public API
    // For production, consider restricting to specific domains if needed
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400", // 24 hours preflight cache
    };

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

    const apiUrl =
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

    try {
      const hfResponse = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.HF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await hfResponse.json();

      return new Response(JSON.stringify(data), {
        status: hfResponse.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({ 
          error: error.message || "Failed to communicate with HuggingFace API" 
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
