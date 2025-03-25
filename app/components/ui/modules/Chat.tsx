import type { Message } from "~/types/chat";
import { ChatMessageList } from "~/components/ui/chat/chat-message-list";
import { ChatInput } from "~/components/ui/chat/chat-input";
import { Button } from "~/components/ui/button";
import { PaperPlaneIcon } from "@radix-ui/react-icons";
import { useFetcher } from "@remix-run/react";

export interface ChatProps {
  chatId?: string;
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function Chat({ 
  messages, 
  input, 
  handleInputChange,
}: ChatProps) {
  const fetcher = useFetcher();
  
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
        <fetcher.Form method="post" className="flex gap-2">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
          />
        
          <Button type="submit" size="icon" className="shrink-0">
            <PaperPlaneIcon className="h-4 w-4" />
          </Button>  
        </fetcher.Form>
      </div>
    </div>
  );
} 