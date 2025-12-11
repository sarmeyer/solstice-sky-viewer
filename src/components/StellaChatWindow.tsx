"use client"

import { useState, useRef, useEffect, FormEvent } from "react"
import type { SkyObjectsResponse } from "../../types/skyObjects"
import type {
  StellaChatMessage,
  StellaChatSuccess,
  StellaChatError,
} from "../../types/stellaChat"

interface StellaChatWindowProps {
  isOpen: boolean
  onClose: () => void
  skyData: SkyObjectsResponse
}

/**
 * Chat window component for interacting with Stella
 */
export default function StellaChatWindow({
  isOpen,
  onClose,
  skyData,
}: StellaChatWindowProps) {
  const [messages, setMessages] = useState<StellaChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm Stella, your friendly sky guide! 🌟 What would you like to know about the objects visible in your night sky?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Reset messages when window opens
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          role: "assistant",
          content:
            "Hi! I'm Stella, your friendly sky guide! 🌟 What would you like to know about the objects visible in your night sky?",
        },
      ])
      setInput("")
    }
  }, [isOpen])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!input.trim() || isLoading) {
      return
    }

    const userMessage: StellaChatMessage = {
      role: "user",
      content: input.trim(),
    }

    // Add user message to conversation
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setIsLoading(true)

    try {
      // Call the Stella chat API
      const response = await fetch("/api/stella-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: skyData.location.resolvedName,
          date: skyData.date,
          objects: skyData.objects,
          messages: newMessages,
        }),
      })

      if (!response.ok) {
        const errorData: StellaChatError = await response.json()
        throw new Error(errorData.error.message)
      }

      const data: StellaChatSuccess = await response.json()

      // Add Stella's reply to conversation
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: data.reply,
        },
      ])
    } catch (error) {
      // Add error message
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Please try again!`,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* Chat Window */}
      <div className="fixed top-40 w-96 h-[500px] z-50 rounded-2xl bg-gray-900/95 border border-gray-800 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white">
              ✨ Chat with Stella
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 5L5 15M5 5l10 10" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-100"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-100 rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask me about the night sky..."
              className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </>
  )
}
