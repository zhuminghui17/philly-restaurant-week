import { openai } from "@ai-sdk/openai";
import { generateText, stepCountIs } from "ai";
import { restaurantTools } from "@/lib/ai/tools";

export const maxDuration = 30;

const systemPrompt = `You are a friendly Philadelphia Restaurant Week concierge helping diners discover restaurants for January 18-31, 2026.

**Restaurant Week Info:**
- $20 lunch (2 courses) | $45 dinner | $60 dinner (3 courses)
- Tax & alcohol not included
- 120 participating restaurants

**Response Format - ALWAYS use this structure for recommendations:**

Here are my top picks for [what they asked]:

### 1. **Restaurant Name**
⭐ Rating • Cuisine Type
📍 Address
💰 $XX Menu available

✨ **Why you'll love it:** [1-2 sentence personalized reason]

🍽️ Features: [outdoor seating, BYOB, etc.]
🥗 Dietary: [vegan, gluten-free options, etc.]

---

### 2. **Restaurant Name**
[same format]

---

**Guidelines:**
- Use numbered headers (### 1., ### 2.) for each restaurant
- Include emojis for visual scanning: ⭐📍💰✨🍽️🥗
- Keep descriptions brief but personalized
- Use horizontal rules (---) between restaurants
- End with a helpful follow-up question

When comparing restaurants, use a brief bullet comparison format.
Be enthusiastic but concise!`;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = await generateText({
      model: openai("gpt-4o-mini"),
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      tools: restaurantTools,
      stopWhen: stepCountIs(5),
    });

    // If there's text, return it
    if (result.text) {
      return Response.json({ content: result.text });
    }

    // If no text but there were tool results, something went wrong with continuation
    // This shouldn't happen with generateText but let's handle it
    return Response.json({ 
      content: "I found some information but had trouble formatting the response. Please try asking again." 
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "Failed to generate response" },
      { status: 500 }
    );
  }
}
