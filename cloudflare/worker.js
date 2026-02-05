export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
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
        headers: corsHeaders,
      });
    }

    if (url.pathname !== "/summarize") {
      return new Response("Not Found", { status: 404, headers: corsHeaders });
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return new Response("Invalid JSON", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const apiUrl =
      "https://api-inference.huggingface.co/models/facebook/bart-large-cnn";

    const hfResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await hfResponse.text();

    return new Response(text, {
      status: hfResponse.status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  },
};
