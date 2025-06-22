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

    const agentId = process.env.LETTA_AGENT_ID_SOCIAL_AGENT
    if (!agentId) {
      throw new Error("LETTA_AGENT_ID_SOCIAL_AGENT is not set.")
    }

    const fileBuffer = await pdfFile.arrayBuffer()
    let fields: { name: string; type: string }[] = []
    let textNote = ""

    try {
      const pdfDoc = await PDFDocument.load(fileBuffer)

      try {
        const form = pdfDoc.getForm()
        fields = form.getFields().map((field) => ({
          name: field.getName(),
          type: field.constructor.name,
        }))
      } catch {
        console.warn("[Letta PDF] No AcroForm fields found in PDF.")
      }

      // Note: pdf-lib cannot extract page text; add a placeholder if needed.
      textNote = "(Note: Full text extraction is not available in this mode. Only form fields are accessible.)"
    } catch (err) {
      console.warn("[Letta PDF] Failed to parse PDF:", err)
    }

    const messagesForLetta = [
      {
        role: "user",
        content: `${prompt}\n\n${textNote}`,
      },
    ]

    const stream = await lettaCloud.client.agents.messages.createStream(agentId, {
      messages: messagesForLetta,
      streamTokens: true,
    })

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
