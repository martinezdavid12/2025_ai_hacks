// No changes needed from the version that correctly parses the Vercel AI SDK stream.
// Ensure this file exists and is correctly implemented as in previous steps.
import { lettaCloud } from "@letta-ai/vercel-ai-sdk-provider"
import { streamText } from "ai"

// export const runtime = "edge" // Optional

export async function POST(req: Request) {
  try {
    const { prompt } = (await req.json()) as { prompt: string }

    if (!process.env.LETTA_AGENT_ID_SOCIAL_AGENT) {
      throw new Error("LETTA_AGENT_ID_SOCIAL_AGENT is not set.")
    }
    // lettaCloud uses LETTA_API_KEY from environment by default
    const result = await streamText({
      model: lettaCloud(process.env.LETTA_AGENT_ID_SOCIAL_AGENT),
      prompt: prompt,
    })
    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error("[Letta Chat API Error]", error)
    return new Response(JSON.stringify({ error: error.message || "Failed to process chat message." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
