// app/api/chat/route.ts
import { NextRequest } from "next/server";
import { mistral } from "@ai-sdk/mistral";
import { streamText, tool, stepCountIs } from "ai";
import { z } from "zod";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== "string") {
      return new Response("Invalid question", { status: 400 });
    }

    if (!process.env.MISTRAL_API_KEY) {
      return new Response("Mistral API key missing", { status: 500 });
    }

    const tools = {
      getWeather: tool({
        description: "Get the weather for a location",
        inputSchema: z.object({
          city: z.string(),
          unit: z.enum(["C", "F"]),
        }),

        execute: async ({ city, unit }) => {
          const weatherByCity: Record<string, number> = {
            delhi: 35,
            mumbai: 32,
            bangalore: 28,
          };

          const value = weatherByCity[city.toLowerCase()] ?? 30;

          return `It is currently ${value}°${unit} and Sunny in ${city}.`;
        },
      }),
    };

    const result = streamText({
      model: mistral("mistral-large-latest"),
      system: `You are a helpful assistant.
              Always answer in a concise summary.
              Maximum 3 lines only.

              If the user asks about weather or temperature,
              you MUST call the getWeather tool.
              Return only the tool result.
              `,
      messages: [
        {
          role: "user",
          content: question,
        },
      ],
      tools,
      stopWhen: stepCountIs(3),
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Server Error", { status: 500 });
  }
}
