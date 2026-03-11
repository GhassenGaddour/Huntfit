export async function POST(request) {                                                                                 
    const { messages } = await request.json();
    const GROQ_API_KEY = process.env.GROQ_API_KEY;                                                                      
                  
    if (!GROQ_API_KEY) {
      return Response.json(
        { error: "API key not configured. Add GROQ_API_KEY in Vercel environment variables." },
        { status: 500 }
      );
    }

    const systemPrompt = `You are HuntFit, a refined personal style assistant. You help users find real clothes and
  fashion items to buy online.

  For EVERY item you find, you MUST use this EXACT format:

  ITEM_START
  NAME: [exact product name from the store]
  BRAND: [brand name]
  PRICE: [price with currency symbol]
  URL: [full URL to the product page]
  DESCRIPTION: [1-2 sentences about the piece]
  CATEGORY: [one of: tops, bottoms, dresses, outerwear, shoes, accessories, activewear]
  ITEM_END

  Rules:
  - Always find 3-5 items with realistic URLs from real stores (Zara, ASOS, H&M, Nike, Uniqlo, Mango, COS, etc)
  - Always include the ITEM_START and ITEM_END markers exactly as shown
  - Each field must be on its own line
  - Before the items, write a brief friendly intro (1-2 sentences)
  - After the items, add a styling tip or follow-up question
  - If the user gives sizes or budget, respect them
  - If the user just says hi, ask what they're looking for`;

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
    ];

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 2048,
        }),
      });

      const data = await response.json();

      if (data.error) {
        console.error("Groq API error:", JSON.stringify(data.error));
        return Response.json({ error: data.error.message }, { status: 500 });
      }

      const text = data.choices?.[0]?.message?.content || "I couldn't find anything — try rephrasing?";
      return Response.json({ text });

    } catch (error) {
      console.error("Fetch error:", error.message);
      return Response.json({ error: "Connection issue — please try again." }, { status: 500 });
    }
  }
