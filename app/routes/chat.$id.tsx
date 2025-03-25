import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import { useState } from "react";
import { ChatSidebar } from "~/components/ui/modules/ChatSidebar";
import Chat from "~/components/ui/modules/Chat";
import type { Message } from "~/types/chat";

type LoaderData = {
  chats: Array<{ id: string; firstPrompt: string; createdAt: string }>;
  messages: Message[];
};

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
  // Here we'll use params.id when implementing chat loading
  console.log("Loading chat:", params.id);
  return {
    chats: [],
    messages: []
  };
}

export default function ChatPage() {
  const { chats, messages } = useLoaderData<typeof loader>();
  const { id } = useParams();
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
      // Here you'll implement chat submission
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Something went wrong"));
    } finally {
      setIsLoading(false);
    }
  };

  const stop = () => {
    // Here you'll implement stop functionality
    setIsLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      <ChatSidebar chats={chats} currentChatId={id} />
      <div className="flex-1 flex flex-col">
        <Chat
          chatId={id}
          messages={messages}
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