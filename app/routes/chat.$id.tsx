import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { redirect, useLoaderData, useParams } from "@remix-run/react";
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
  const threadId = params.id;

  if(!threadId) {
    throw redirect("/chat");
  }

  const existingThread = await memory.getThreadById({ threadId });
  console.log("Existing thread: >>>", existingThread);

  if (!existingThread) {
    const newThread = await memory.createThread({
      threadId: threadId,
      resourceId: 'user-1',
      title: "Draft",
      metadata: {
        category: "support", 
      }
    });

    console.log("New thread: >>>", newThread);
    return {
      messages: []
    };
  }
 
  const { uiMessages } = await memory.query({
  threadId: existingThread.id,
  selectBy: {
    last: 50,
    },
  });

  return {
    messages: uiMessages
  };
}

export async function action({ request, params }: ActionFunctionArgs) {
  const threadId = params.id;
  if(!threadId) {
    return {
      messages: []
    };
  }

  const existingThread = await memory.getThreadById({ threadId });

  if(!existingThread) {
    return redirect("/chat");
  }

  const formData = await request.formData();
  const input = formData.get("input");

  await memory.addMessage({
    threadId: existingThread.id,
    content: [{type: "text", text: input as string}],
    role: "user",
    type: "text",
  });

  const response = await executeWeatherAgent(input as string, existingThread.id, 'user-1');
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

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col">
        <Chat
          chatId={id}
          messages={messages}
        />
      </div>
    </div>
  );
} 