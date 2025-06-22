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
import { Send, Loader2, User, MessageSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import ReactMarkdown from "react-markdown"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function LettaChatApp() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: "smooth" })
    }
  }, [messages])

  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    const userInput = input
    setInput("")
    sendMessage(userInput)
  }

  const sendMessage = async (prompt: string) => {
    setIsLoading(true)
    const assistantMessageId = Date.now().toString() + "-assistant"
    setMessages((prev) => [...prev, { id: assistantMessageId, role: "assistant", content: "" }])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
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

      // process remaining buffer
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

  return (
    <div className="h-full flex justify-center p-4">
      <Card className="w-full max-w-3xl flex flex-col h-full">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center">
            <Avatar className="w-8 h-8 mr-2 border">
              <AvatarImage src="/placeholder.svg?text=SA" alt="Letta" />
              <AvatarFallback>LT</AvatarFallback>
            </Avatar>
            Letta
          </CardTitle>
          <CardDescription>Chat with your digital caseworker assistant.</CardDescription>
        </CardHeader>

        <CardContent className="flex-grow p-0">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                <MessageSquare className="w-16 h-16 mb-4" />
                <p className="text-lg font-medium">Welcome to Letta</p>
                <p className="text-sm">Ask any question to get started.</p>
              </div>
            )}

            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn("flex items-end gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
                >
                  {msg.role === "assistant" && (
                    <Avatar className="w-8 h-8 border flex-shrink-0">
                      <AvatarImage src="/placeholder.svg?text=SA" alt="Letta" />
                      <AvatarFallback>LT</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 max-w-[80%] shadow-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {msg.role === "user" && (
                    <Avatar className="w-8 h-8 border flex-shrink-0">
                      <AvatarFallback>
                        <User size={16} />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter className="border-t p-3">
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
    </div>
  )
}
