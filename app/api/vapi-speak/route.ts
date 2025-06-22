import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { message } = await req.json()

  const vapiRes = await fetch("https://api.vapi.ai/v1/tts/speak", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.VAPI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      voice: "ava", // or any supported voice like "charlie", "maya", etc.
      text: message,
    }),
  })

  if (!vapiRes.ok) {
    const errorText = await vapiRes.text()
    console.error("VAPI error:", errorText)
    return NextResponse.json({ error: "VAPI request failed" }, { status: 500 })
  }

  return NextResponse.json({ status: "ok" })
}
