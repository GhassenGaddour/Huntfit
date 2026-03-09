export async function POST(request) {
  const { messages } = await request.json();

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return Response.json(
      { error: "API key not configured. Add GEMINI_API_KEY in your Vercel environment variables." },
      { status: 500 }
    );
  }

  const systemPrompt = `You are HuntFit, a refined personal style assistant with an eye for elevated, minimal fashion. You appreciate quality, clean silhouettes, and thoughtful design. Your tone is calm, confident, and knowledgeable — like a personal shopper at a high-end boutique who's still approachable.

When users describe what they want, use Google Search to find real products you can buy online. Focus on quality pieces, clean aesthetics, and good value. Always search for actual products.

For each item you find, use this EXACT format:

ITEM_START
NAME: [exact product name]
BRAND: [brand name]
PRICE: [price with currency]
URL: [full product URL where you can buy it]
DESCRIPTION: [1-2 sentences about the piece — fabric, silhouette, styling suggestion]
CATEGORY: [one of: tops, bottoms, dresses, outerwear, shoes, accessories, activewear]
ITEM_END

Find 3-5 items per request. Before items, give a concise intro (1-2 sentences). After items, offer a styling note or ask a refining question. Keep it polished but not pretentious.

If users give sizes/budget, factor them in. If info is missing, suggest pieces and ask. Be warm and helpful.`;

  // Convert our message format to Gemini format
  const geminiContents = [];

  for (const msg of messages) {
    geminiContents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: geminiContents,
          tools: [{ google_search: {} }],
        }),
      }
    );

    const data = await response.json();

    if (data.error) {
      console.error("Gemini error:", data.error);
      return Response.json({ error: data.error.message }, { status: 500 });
    }

    // Extract text from Gemini response
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts
      .filter((p) => p.text)
      .map((p) => p.text)
      .join("\n");

    return Response.json({ text: text || "I couldn't find anything — try rephrasing?" });
  } catch (error) {
    console.error("Fetch error:", error);
    return Response.json({ error: "Failed to reach AI service." }, { status: 500 });
  }
}
