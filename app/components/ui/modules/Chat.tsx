import type { Message } from "~/types/chat";
import { ChatMessageList } from "~/components/ui/chat/chat-message-list";
import { ChatInput } from "~/components/ui/chat/chat-input";
import { Button } from "~/components/ui/button";
import { PaperPlaneIcon, StopIcon } from "@radix-ui/react-icons";
import { useFetcher } from "@remix-run/react";
import { useEffect, useState, useRef } from "react";

export interface ChatProps {
  chatId?: string;
  messages: Message[];
}

export default function Chat({ 
  messages, 
}: ChatProps) {
  const threadId = "123";
  const userId = "user-1";
  const fetcher = useFetcher();
  const abortFetcher = useFetcher();
  const [input, setInput] = useState("");
  const isSubmitting = fetcher.state === "submitting";
  const lastMessageRef = useRef<string | null>(null);
  const [firstRender, setFirstRender] = useState(true); 

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle form submission manually to ensure proper clearing and prevent default
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    // Create form data manually
    const formData = new FormData();
    formData.append("input", input);
    formData.append("action", "saveUserInquiry"); 
    formData.append("threadId", threadId);
    
    // Submit the form
    fetcher.submit(formData, { method: "post" });
    
    // Clear input after submission
    setInput("");
  };

  //Function to abort the agent execution
  const handleAbort = () => {
    abortFetcher.submit(
      {}, // No form data needed
      { 
        method: "post", 
        action: `/api/abort/${threadId}` 
      }
    );
  };

  useEffect(() => {
    // Skip if submitting or no messages
    if (isSubmitting || messages.length === 0 || firstRender) {
      setFirstRender(false);
      return;
    }

    const lastMessage = messages[messages.length - 1];
    
    // Only trigger agent if:
    // 1. Last message is from user
    // 2. It's a new message (not the same as before)
    // 3. We're in idle state
    if (
      fetcher.state === "idle" && 
      lastMessage.role === "user" && 
      lastMessage.id !== lastMessageRef.current
    ) {
      // Update ref to current message ID to prevent retriggering
      lastMessageRef.current = lastMessage.id;
      console.log("Generating response, MESSAGES:", messages);
      
      // Submit agent action
      fetcher.submit({ 
        action: "executeAgent", 
        input: lastMessage.content, 
        threadId, 
        userId ,
      }, { method: "post" })
    }
  }, [messages, fetcher.state, isSubmitting, threadId, userId]);
  
  return (
    <div className="flex flex-col justify-between w-full h-screen">
      <div className="flex-1 overflow-hidden">
        <ChatMessageList>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              } mb-4`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "assistant"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
        </ChatMessageList>
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            name="input" 
            disabled={isSubmitting}
          />

          {isSubmitting ? (
            <Button 
              type="button" 
              size="icon" 
              variant="destructive"
              className="shrink-0" 
              onClick={handleAbort}
              title="Stop generating"
            >
              <StopIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              size="icon" 
              className="shrink-0" 
              disabled={!input.trim()}
            >
              <PaperPlaneIcon className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
} 