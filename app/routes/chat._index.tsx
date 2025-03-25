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
  return (
    
      <p>Hello</p>

  );
} 