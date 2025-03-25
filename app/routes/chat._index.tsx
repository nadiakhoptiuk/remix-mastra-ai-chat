import { useNavigate } from "@remix-run/react";
import { useState } from "react";
import { ChatSidebar } from "~/components/ui/modules/ChatSidebar";
import Chat from "~/components/ui/modules/Chat";
import type { Message } from "~/types/chat";

type LoaderData = {
  chats: Array<{ id: string; firstPrompt: string; createdAt: string }>;
  messages: Message[];
};

export async function loader(): Promise<LoaderData> {
  return {
    chats: [],
    messages: []
  };
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      setIsLoading(true);
      const newChatId = crypto.randomUUID();
      navigate(`/chat/${newChatId}`);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Something went wrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const stop = () => {
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      <ChatSidebar chats={[]} currentChatId={undefined} />
      <div className="flex-1 flex flex-col">
        <Chat
          messages={[]}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          error={error}
          stop={stop}
        />
      </div>
    </div>
  );
} 