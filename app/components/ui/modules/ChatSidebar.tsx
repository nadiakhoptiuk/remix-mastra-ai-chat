import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";
import { useMemo } from "react";
import { memory } from "src/mastra/agents";
import { formatRelative } from "date-fns";

interface ChatSidebarProps {
  chats: {
    id: string;
    title: string;
    createdAt: string;
  }[];
  currentChatId?: string;
}

export function ChatSidebar({ chats, currentChatId }: ChatSidebarProps) {
  const generatedChatId = useMemo(() => {
    return memory.generateId();
  }, []);

  const threadsByDate = useMemo(() => {
    return chats.map((chat) => {
      return {
        ...chat,
        createdAt: formatRelative(new Date(chat.createdAt), new Date()),
      };
    });
  }, [chats]);

  return (
    <div className="w-80 border-r min-h-screen bg-muted/40">
      <div className="flex flex-col h-full">
        
        <div className="px-4 py-3 border-b">
          <Link to={`/chat/${generatedChatId}`}>
            <Button className="w-full" variant="outline">
              New Chat
            </Button>
          </Link>
        </div>

        <ScrollArea className="flex-1 px-2">
          <div className="space-y-2 py-2">
            {threadsByDate.map((chat) => (
              <>
                <p>{chat.createdAt}</p>
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
                  {chat.title}
                </Button>
                </Link>
              </>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
} 