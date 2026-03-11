export async function POST(request) {
    const { messages } = await request.json();
    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    const SERPER_API_KEY = process.env.SERPER_API_KEY;

    if (!GROQ_API_KEY) {
      return Response.json(
        { error: "API key not configured. Add GROQ_API_KEY in Vercel environment variables." },
        { status: 500 }
      );
    }

    const systemPrompt = `You are HuntFit, a refined personal style assistant. You help users find real clothes and
  fashion items to buy online.

  For EVERY item you suggest, you MUST use this EXACT format with no blank lines between fields:

  ITEM_START
  NAME: [exact product name]
  BRAND: [brand name]
  PRICE: [estimated price with currency symbol]
  DESCRIPTION: [1-2 sentences about the piece]
  CATEGORY: [one of: tops, bottoms, dresses, outerwear, shoes, accessories, activewear]
  ITEM_END

  Rules:
  - Always suggest 3-5 items
  - Always include ITEM_START and ITEM_END markers exactly as shown
  - NO blank lines between fields inside an item block
  - Each field must be on its own line
  - Before the items, write a brief friendly intro (1-2 sentences)
  - After the items, add a styling tip or follow-up question
  - If the user gives sizes or budget, respect them
  - If the user just says hi, ask what they're looking for
  - Do NOT include URLs, they will be fetched automatically`;

    const groqMessages = [
      { role: "system", content: systemPrompt },
      ...messages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
    ];

    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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

      const groqData = await groqResponse.json();

      if (groqData.error) {
        console.error("Groq API error:", JSON.stringify(groqData.error));
        return Response.json({ error: groqData.error.message }, { status: 500 });
      }

      let text = groqData.choices?.[0]?.message?.content || "";

      if (SERPER_API_KEY) {
        // Flexible regex that handles any whitespace between fields
        const itemRegex = /ITEM_START\s+NAME:\s*(.+?)\s*\n\s*BRAND:\s*(.+?)\s*\n\s*PRICE:\s*(.+?)\s*\n\s*DESCRIPTION:\s*
  ([\s\S]+?)\s*\n\s*CATEGORY:\s*(.+?)\s*\n\s*ITEM_END/g;
        const matches = [...text.matchAll(itemRegex)];

        console.log(`Found ${matches.length} items to enrich`);

        const enriched = await Promise.all(
          matches.map(async (m) => {
            const name = m[1].trim();
            const brand = m[2].trim();
            const price = m[3].trim();
            const query = `${brand} ${name} buy online`;

            try {
              const serperRes = await fetch("https://google.serper.dev/shopping", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "X-API-KEY": SERPER_API_KEY,
                },
                body: JSON.stringify({ q: query, num: 1 }),
              });

              const serperData = await serperRes.json();
              const result = serperData.shopping?.[0];

              console.log(`Serper result for "${query}":`, result?.link, result?.imageUrl);

              return {
                original: m[0],
                name, brand,
                url: result?.link || "https://www.google.com/search?q=" + encodeURIComponent(query),
                imageUrl: result?.imageUrl || "",
                price: result?.price || price,
              };
            } catch (e) {
              console.error(`Serper error for "${query}":`, e.message);
              return {
                original: m[0],
                name, brand,
                url: "https://www.google.com/search?q=" + encodeURIComponent(query),
                imageUrl: "",
                price,
              };
            }
          })
        );

        // Rebuild the text replacing each ITEM block with enriched version
        enriched.forEach(({ original, url, imageUrl, price }) => {
          const enrichedBlock = original
            .replace(/PRICE:\s*.+/, `PRICE: ${price}`)
            .replace("ITEM_END", `URL: ${url}\nIMAGE: ${imageUrl}\nITEM_END`);
          text = text.replace(original, enrichedBlock);
        });
      }

      return Response.json({ text });

    } catch (error) {
      console.error("Fetch error:", error.message);
      return Response.json({ error: "Connection issue — please try again." }, { status: 500 });
    }
  }
