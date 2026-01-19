"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MessageCircle, Send, Bot, User, Sparkles, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// Type for message parts
type MessagePart = { type: string; text?: string; state?: string };

interface AssistantChatProps {
  className?: string;
}

export function AssistantChat({ className }: AssistantChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localInput, setLocalInput] = useState("");
  
  // Create transport once with useMemo
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  
  const { messages, sendMessage, status, error } = useChat({
    transport,
    messages: [
      {
        id: "welcome",
        role: "assistant",
        parts: [
          {
            type: "text",
            text: "Hi! I'm your Philadelphia Restaurant Week concierge. I can help you find the perfect restaurant for January 18-31, 2026. What are you in the mood for? 🍽️",
          },
        ],
      },
    ],
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSuggestedQuestion = (question: string) => {
    sendMessage({ text: question });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localInput.trim() && !isLoading) {
      sendMessage({ text: localInput });
      setLocalInput("");
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const suggestedQuestions = [
    "Find Italian restaurants with outdoor seating",
    "What's good for a vegan dinner?",
    "Compare Amada and Buddakan",
    "Recommend something for a group of 8",
  ];

  // Extract text content from a message (SDK v6 uses parts array)
  const getMessageContent = (message: UIMessage) => {
    // Check for pending tool calls in parts
    const hasToolCall = message.parts?.some(
      (part: MessagePart) => part.type === "tool-invocation" && 
      (part.state === "call" || part.state === "partial-call")
    );
    
    if (hasToolCall) {
      return null; // Show searching indicator instead
    }
    
    // Extract text from parts
    if (message.parts && Array.isArray(message.parts)) {
      const textContent = message.parts
        .filter((part: MessagePart): part is { type: "text"; text: string } => part.type === "text" && typeof part.text === "string")
        .map((part) => part.text)
        .join("");
      return textContent || null;
    }
    
    return null;
  };

  // Check if message has pending tool calls
  const hasPendingTools = (message: UIMessage) => {
    return message.parts?.some(
      (part: MessagePart) => part.type === "tool-invocation" && 
      (part.state === "call" || part.state === "partial-call")
    );
  };

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
          <div className="flex items-center justify-between">
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
          </div>
        </SheetHeader>

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((message: UIMessage) => {
              const content = getMessageContent(message);
              const showSearching = hasPendingTools(message);

              // Skip messages with no content and no pending tools
              if (!content && !showSearching) return null;

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                      message.role === "user"
                        ? "bg-[#1a2744]"
                        : "bg-[#d4a853]"
                    )}
                  >
                    {message.role === "user" ? (
                      <User className="h-4 w-4 text-white" />
                    ) : (
                      <Bot className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Message bubble */}
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2",
                      message.role === "user"
                        ? "bg-[#1a2744] text-white rounded-br-md"
                        : "bg-white border border-[#1a2744]/10 text-[#1a2744] rounded-bl-md shadow-sm"
                    )}
                  >
                    {showSearching ? (
                      <div className="flex items-center gap-2 text-sm text-[#1a2744]/70">
                        <Search className="h-4 w-4 animate-pulse" />
                        <span>Searching restaurants...</span>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{content}</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {isLoading && !messages.some((m: UIMessage) => hasPendingTools(m)) && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-[#d4a853] flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div className="bg-white border border-[#1a2744]/10 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#1a2744]/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-[#1a2744]/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-[#1a2744]/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                Sorry, something went wrong. Please try again.
              </div>
            )}
          </div>

          {/* Suggested questions (only show at start) */}
          {messages.length <= 1 && (
            <div className="mt-6 space-y-2">
              <p className="text-xs text-[#1a2744]/60 font-medium">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(question)}
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
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="Ask about restaurants..."
              className="flex-1 border-[#1a2744]/20 focus:border-[#d4a853] focus:ring-[#d4a853]/20"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !localInput.trim()}
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
