import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

interface ChatSidebarProps {
  chats: {
    id: string;
    firstPrompt: string;
    createdAt: string;
  }[];
  currentChatId?: string;
}

export function ChatSidebar({ chats, currentChatId }: ChatSidebarProps) {
  return (
    <div className="w-80 border-r min-h-screen bg-muted/40">
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b">
          <Link to="/chat">
            <Button className="w-full" variant="outline">
              New Chat
            </Button>
          </Link>
        </div>
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-2 py-2">
            {chats.map((chat) => (
              <Link 
                key={chat.id} 
                to={`/chat/${chat.id}`}
                className="block"
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left h-auto py-3",
                    currentChatId === chat.id && "bg-accent"
                  )}
                >
                  <div className="flex flex-col items-start gap-1">
                    <p className="line-clamp-1 text-sm">{chat.firstPrompt}</p>
                    <span className="text-xs text-muted-foreground">
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 