import type { Message } from "~/types/chat";
import { ChatMessageList } from "~/components/ui/chat/chat-message-list";
import { ChatInput } from "~/components/ui/chat/chat-input";
import { Button } from "~/components/ui/button";
import { Send, StopCircle } from "lucide-react";

export interface ChatProps {
  chatId?: string;
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  error?: Error;
  stop: () => void;
}

export default function Chat({ 
  messages, 
  input, 
  handleInputChange, 
  handleSubmit, 
  isLoading, 
  error, 
  stop
}: ChatProps) {
  return (
    <div className="flex flex-col justify-between w-full h-full">
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
            disabled={isLoading}
          />
          {isLoading ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={stop}
              className="shrink-0"
            >
              <StopCircle className="h-4 w-4" />
            </Button>
          ) : (
            <Button type="submit" size="icon" className="shrink-0" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          )}
        </form>
        {error && (
          <p className="text-sm text-destructive mt-2">{error.message}</p>
        )}
      </div>
    </div>
  );
} 