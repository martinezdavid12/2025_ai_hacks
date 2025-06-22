// No changes needed from the version that correctly handles PDF uploads.
// Ensure this file exists and is correctly implemented as in previous steps.
import { lettaCloud } from "@letta-ai/vercel-ai-sdk-provider"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const pdfFile = formData.get("pdf") as File | null
    const prompt = formData.get("prompt") as string | null

    if (!pdfFile) {
      return new Response(JSON.stringify({ error: "No PDF file provided." }), { status: 400 })
    }
    if (!prompt) {
      return new Response(JSON.stringify({ error: "No prompt provided with PDF." }), { status: 400 })
    }
    if (!process.env.LETTA_AGENT_ID_SOCIAL_AGENT) {
      throw new Error("LETTA_AGENT_ID_SOCIAL_AGENT is not set.")
    }

    const fileBuffer = await pdfFile.arrayBuffer()
    const messagesForLetta: any[] = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          {
            type: "file",
            data: Buffer.from(fileBuffer).toString("base64"),
            mimeType: pdfFile.type || "application/pdf",
          },
        ],
      },
    ]

    const stream = await lettaCloud.client.agents.messages.createStream(process.env.LETTA_AGENT_ID_SOCIAL_AGENT, {
      messages: messagesForLetta,
      streamTokens: true,
    })

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.messageType === "assistant_message" && chunk.content) {
            controller.enqueue(new TextEncoder().encode(chunk.content))
          }
        }
        controller.close()
      },
    })
    return new Response(readableStream, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
  } catch (error: any) {
    console.error("[Letta PDF API Error]", error)
    return new Response(JSON.stringify({ error: error.message || "Failed to process PDF." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
