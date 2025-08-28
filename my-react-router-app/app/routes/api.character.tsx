// app/routes/api.character.tsx
import type { ActionFunction } from "react-router";

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const prompt = formData.get("prompt");
  const apiKey = formData.get("apiKey");

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey as string}`,
        "HTTP-Referer": "http://localhost:5173", // replace with your domain if deployed
        "X-Title": "D&D Character Generator",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the JSON data properly
    return Response.json(data);
    
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      { error: "Failed to generate character" }, 
      { status: 500 }
    );
  }
};