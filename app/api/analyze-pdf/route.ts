import { lettaCloud } from "@letta-ai/vercel-ai-sdk-provider"
import { PDFDocument } from "pdf-lib"

export const config = {
  runtime: "nodejs",
}

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
    let fields: { name: string; type: string }[] = []

    // Try extracting form fields
    try {
      const pdfDoc = await PDFDocument.load(fileBuffer)
      const form = pdfDoc.getForm()
      fields = form.getFields().map((field) => ({
        name: field.getName(),
        type: field.constructor.name,
      }))
    } catch (err) {
      console.warn("[Letta PDF] No form fields found or PDF parsing failed:", err)
    }

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

    const stream = await lettaCloud.client.agents.messages.createStream(
      process.env.LETTA_AGENT_ID_SOCIAL_AGENT,
      {
        messages: messagesForLetta,
        streamTokens: true,
      }
    )

    const fieldInfoPrefix = `@@PDF_FIELDS:${JSON.stringify(fields)}\n`

    const readableStream = new ReadableStream({
      async start(controller) {
        controller.enqueue(new TextEncoder().encode(fieldInfoPrefix))

        for await (const chunk of stream) {
          if (chunk.messageType === "assistant_message" && chunk.content) {
            controller.enqueue(new TextEncoder().encode(chunk.content))
          }
        }

        controller.close()
      },
    })

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    })
  } catch (error: any) {
    console.error("[Letta PDF API Error]", error)
    return new Response(JSON.stringify({ error: error.message || "Failed to process PDF." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
