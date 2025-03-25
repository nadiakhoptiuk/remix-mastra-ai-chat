import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect, useLoaderData, useParams } from "@remix-run/react";
import { useState } from "react";
import { Memory } from "@mastra/memory";
import Chat from "~/components/ui/modules/Chat";
import type { Message } from "~/types/chat";
import { executeWeatherAgent } from "~/services/agent.server";

const memory = new Memory();
type LoaderData = {
  messages: Message[];
};

export async function loader({ params }: LoaderFunctionArgs): Promise<LoaderData> {
  // Here we'll use params.id when implementing chat loading
  console.log("Loading chat:", params.id);
  const threadId = params.id;

  if(!threadId) {
    return {
      messages: []
    };
  }

  const [existingThread] = await memory.getThreadsByResourceId({ resourceId: threadId });
  
  if (!existingThread) {
    const newThread = await memory.createThread({
      resourceId: threadId,
      title: "Support Conversation",
      metadata: {
        category: "support", 
      }
    });
    console.log("New thread: >>>", newThread);
    return {
      messages: []
    };
  }
 
  const { messages } = await memory.query({
  threadId: existingThread.id,
  selectBy: {
    last: 50,
    },
  });
  
  // console.log("Messages:", messages);

  return {
    messages: messages
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const threadId = params.id;
  if(!threadId) {
    return {
      messages: []
    };
  }

  const [existingThread] = await memory.getThreadsByResourceId({ resourceId: threadId });

  if(!existingThread) {
    return redirect("/chat");
  }

  const formData = await request.formData();
  const input = formData.get("input");

  await memory.addMessage({
    threadId: existingThread.id,
    content: input as string,
    role: "user",
    type: "text",
  });

  const response = await executeWeatherAgent(input as string);
  await memory.addMessage({
    threadId: existingThread.id,
    content: response.content,
    role: response.role,
    type: "text",
  });

  return response;
}

export default function ChatPage() {
  const { messages } = useLoaderData<typeof loader>();
  const { id } = useParams();
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col">
        <Chat
          chatId={id}
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
        />
      </div>
    </div>
  );
} 