export async function POST(request) {
  const { messages } = await request.json();
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return Response.json(
      { error: "API key not configured. Add GEMINI_API_KEY in Vercel environment variables." },
      { status: 500 }
    );
  }

  const systemPrompt = `You are HuntFit, a refined personal style assistant. You help users find real clothes and fashion items to buy online.

IMPORTANT: When a user asks for clothing items, you MUST search the web using Google Search and find REAL products with REAL URLs from actual online stores (like Zara, ASOS, H&M, Nike, Uniqlo, Mango, COS, etc).

For EVERY item you find, you MUST use this EXACT format (this is critical for the app to display items correctly):

ITEM_START
NAME: [exact product name from the store]
BRAND: [brand name]
PRICE: [price with currency symbol]
URL: [full URL to the product page]
DESCRIPTION: [1-2 sentences about the piece]
CATEGORY: [one of: tops, bottoms, dresses, outerwear, shoes, accessories, activewear]
ITEM_END

Rules:
- Always find 3-5 real items with real URLs
- Always include the ITEM_START and ITEM_END markers exactly as shown
- Each field must be on its own line
- Before the items, write a brief friendly intro (1-2 sentences)
- After the items, add a styling tip or follow-up question
- If the user gives sizes or budget, respect them
- If the user just says hi, ask what they're looking for

Example response format:
Here are some great options for you!

ITEM_START
NAME: Oversized Cotton T-Shirt
BRAND: Zara
PRICE: €15.95
URL: https://www.zara.com/example-product
DESCRIPTION: A relaxed-fit cotton tee in white. Perfect for layering or wearing on its own.
CATEGORY: tops
ITEM_END

Would you like me to find more options or something different?`;

  // Convert messages to Gemini format
  const geminiContents = messages.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));

  try {
    // Try with Google Search grounding first
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
          tools: [{ google_search: {} }],
        }),
      }
    );

    const data = await response.json();

    // Log for debugging
    if (data.error) {
      console.error("Gemini API error:", JSON.stringify(data.error));

      // If grounding fails, try without it
      const fallbackResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: geminiContents,
          }),
        }
      );

      const fallbackData = await fallbackResponse.json();

      if (fallbackData.error) {
        return Response.json({ error: fallbackData.error.message }, { status: 500 });
      }

      const parts = fallbackData.candidates?.[0]?.content?.parts || [];
      const text = parts.filter((p) => p.text).map((p) => p.text).join("\n");
      return Response.json({ text: text || "I couldn't find anything — try rephrasing?" });
    }

    // Extract text from successful response
    const candidates = data.candidates || [];
    if (candidates.length === 0) {
      return Response.json({ text: "No results found — try a different search?" });
    }

    const parts = candidates[0]?.content?.parts || [];
    const text = parts.filter((p) => p.text).map((p) => p.text).join("\n");

    if (!text) {
      return Response.json({ text: "The search came back empty — try rephrasing your request?" });
    }

    return Response.json({ text });
  } catch (error) {
    console.error("Fetch error:", error.message);
    return Response.json({ error: "Failed to reach AI service: " + error.message }, { status: 500 });
  }
}
