"use client";

import { useState, useRef, useEffect } from "react";
import { Streamdown } from "streamdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Send, Bot, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AssistantChatProps {
  className?: string;
}

export function AssistantChat({ className }: AssistantChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm your Philadelphia Restaurant Week concierge. I can help you find the perfect restaurant for January 18-31, 2026. What are you in the mood for? 🍽️",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
    };

    const assistantMessageId = (Date.now() + 1).toString();
    const newMessages = [...messages, userMessage];
    
    setMessages([
      ...newMessages,
      { id: assistantMessageId, role: "assistant", content: "" }
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) throw new Error("Failed to fetch");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: accumulatedContent }
              : m
          )
        );
      }

      // If no content was received, show an error
      if (!accumulatedContent.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? { ...m, content: "Sorry, I couldn't process that. Please try again." }
              : m
          )
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return; // Request was cancelled, don't show error
      }
      console.error("Chat error:", error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessageId
            ? { ...m, content: "Sorry, something went wrong. Please try again." }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const suggestedQuestions = [
    "Italian",
    "Seafood",
    "Vegan-friendly",
    "Top rated",
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          className={cn(
            "fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg",
            "bg-[#d4a853] hover:bg-[#c49943] text-white",
            "transition-all duration-300 hover:scale-105",
            className
          )}
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="sr-only">Open AI Assistant</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-full sm:w-[440px] p-0 flex flex-col h-full bg-[#faf8f5]"
      >
        {/* Header */}
        <SheetHeader className="px-4 py-3 bg-[#1a2744] text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#d4a853] flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <SheetTitle className="text-white font-semibold">
                Restaurant Week AI
              </SheetTitle>
              <SheetDescription className="text-xs text-white/70">
                Your dining concierge
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === "user" ? "bg-[#1a2744]" : "bg-[#d4a853]"
                  )}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2",
                    message.role === "user"
                      ? "bg-[#1a2744] text-white rounded-br-md"
                      : "bg-white border border-[#1a2744]/10 text-[#1a2744] rounded-bl-md shadow-sm"
                  )}
                >
                  {message.role === "assistant" ? (
                    message.content ? (
                      <div className="text-sm prose prose-sm prose-neutral max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-strong:text-[#1a2744]">
                        <Streamdown>{message.content}</Streamdown>
                      </div>
                    ) : (
                      <div className="flex gap-1 py-1">
                        <span className="w-2 h-2 bg-[#1a2744]/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-[#1a2744]/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-[#1a2744]/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-[#1a2744]/60 font-medium">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(question)}
                    disabled={isLoading}
                    className="text-xs bg-white border border-[#1a2744]/20 rounded-full px-3 py-1.5 text-[#1a2744]/80 hover:bg-[#1a2744]/5 transition-colors disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-[#1a2744]/10 bg-white shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about restaurants..."
              className="flex-1 border-[#1a2744]/20 focus:border-[#d4a853] focus:ring-[#d4a853]/20"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-[#d4a853] hover:bg-[#c49943] text-white shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
