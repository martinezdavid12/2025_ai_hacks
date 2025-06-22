"use client"

import { useState, useRef, type FormEvent, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Send,
  Loader2,
  User,
  MessageSquare,
  Landmark,
  Mic,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

declare global {
  interface Window {
    webkitSpeechRecognition: any
  }
}

export default function LettaChatApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [vapiActive, setVapiActive] = useState(false)
  const [context, setContext] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [messages])

  const playWithVapi = async (text: string) => {
    try {
      await fetch("/api/vapi-speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      })
    } catch (err) {
      console.error("VAPI playback failed:", err)
    }
  }

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    const userInput = input
    setInput("")
    sendMessage(userInput)
  }

  const handleVapiClick = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)()
    recognition.lang = "en-US"
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setVapiActive(true)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      setVapiActive(false)
      sendMessage(transcript)
    }
    recognition.onerror = () => setVapiActive(false)
    recognition.onend = () => setVapiActive(false)

    recognition.start()
  }

  const sendMessage = async (prompt: string) => {
    setIsLoading(true)
    const assistantMessageId = Date.now().toString() + "-assistant"
    setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "" }])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, context }),
      })

      if (!response.ok || !response.body) throw new Error("API request failed")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let assistantContent = ""
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              assistantContent += JSON.parse(line.slice(2))
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
                )
              )
            } catch {
              /* ignore */
            }
          }
        }
      }

      if (buffer && buffer.startsWith("0:")) {
        try {
          assistantContent += JSON.parse(buffer.slice(2))
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: assistantContent } : msg
            )
          )
        } catch {
          /* ignore */
        }
      }

      if (assistantContent.trim()) playWithVapi(assistantContent.replace(/\\n/g, "\n"))
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-error", role: "assistant", content: "An error occurred." },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handlePdfUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      const url = URL.createObjectURL(file)
      setPdfUrl(url)
    }
  }

  const handleGeneratePdf = (formName: string) => {
    // For demo purposes, use a hardcoded path for CalFresh and Medi-Cal
    const localFileMap: Record<string, string> = {
      "CalFresh": "/pdfs/binder1.pdf",
      "Medi-Cal": "/pdfs/saws_1_filled.pdf",

    }

    const filePath = localFileMap[formName]
    if (filePath) {
      setPdfUrl(filePath)
    } else {
      alert(`${formName} form generation not implemented yet.`)
    }
  }

  const formList = [
    "All",
    "CalFresh",
    "Medi-Cal",
    "Low Income Housing",
    "Emergency Relief",
    "Unemployment Insurance",
    "Disability Insurance",
    "Paid Family Leave",
    "California Lifeline",
    "Child Care Assistance",
    "Utility Assistance",
    "In-Home Supportive Services",
    "CalWORKs",
    "General Assistance"
  ]

  return (
    <div className="h-screen w-full p-4 bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {/* Chat Pane (Left) */}
        <Card className="flex flex-col h-full shadow-lg">
          <CardHeader className="border-b bg-white">
            <CardTitle className="flex items-center gap-2">
              <Avatar className="w-8 h-8 border bg-gray-100">
                <AvatarFallback>
                  <Landmark className="h-5 w-5 text-gray-600" />
                </AvatarFallback>
              </Avatar>
              Letta
            </CardTitle>
            <CardDescription>Chat with your digital caseworker assistant.</CardDescription>
          </CardHeader>

          <CardContent className="p-4 bg-white space-y-2">
            <Input
              placeholder="Optional context for Letta (e.g. your name, case type...)"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="text-sm"
            />
            <Button onClick={handleVapiClick} disabled={vapiActive} size="sm">
              <Mic className="w-4 h-4 mr-1" /> {vapiActive ? "Listening..." : "Speak a message"}
            </Button>
          </CardContent>

          <CardContent className="flex-grow p-0 bg-white">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                  <MessageSquare className="w-16 h-16 mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-700">Welcome to Letta</p>
                  <p className="text-sm text-gray-500">Ask any question to get started.</p>
                </div>
              )}

              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn("flex items-end gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "assistant" && (
                      <Avatar className="w-8 h-8 border flex-shrink-0 bg-gray-100">
                        <AvatarFallback>
                          <Landmark className="h-4 w-4 text-gray-600" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2 max-w-[80%] shadow-sm text-sm whitespace-pre-line",
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-800"
                      )}
                    >
                      <ReactMarkdown>{msg.content.replace(/\\n/g, "\n")}</ReactMarkdown>
                    </div>
                    {msg.role === "user" && (
                      <Avatar className="w-8 h-8 border flex-shrink-0 bg-gray-100">
                        <AvatarFallback>
                          <User size={16} className="text-gray-600" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="border-t p-3 bg-white">
            <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
              <Input
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-grow"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                aria-label="Send"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </CardFooter>
        </Card>

        {/* Forms and PDF Preview Pane (Right) */}
        <Card className="flex flex-col h-full shadow-lg">
          <CardHeader className="border-b bg-white">
            <CardTitle>PDF Preview</CardTitle>
            <CardDescription>Upload, view, or generate a document</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 bg-white flex-grow overflow-hidden">
            <Input type="file" accept="application/pdf" onChange={handlePdfUpload} />

            <div className="space-y-2">
              <p className="text-sm font-medium">Supported Forms:</p>
              <div className="flex flex-col gap-2">
                {formList.map((form) => (
                  <Button
                    key={form}
                    onClick={() => handleGeneratePdf(form)}
                  >
                    {form} Form
                  </Button>
                ))}
              </div>
            </div>

            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                title="PDF Preview"
                className="w-full h-[calc(100%-60px)] border rounded"
              />
            ) : (
              <div className="text-gray-400 text-sm mt-4">No PDF uploaded or generated</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
