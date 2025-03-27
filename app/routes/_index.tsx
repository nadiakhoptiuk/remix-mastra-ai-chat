import { ActionFunctionArgs } from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";
import { memory } from "src/mastra/agents";
import Chat from "~/components/ui/modules/Chat";
import { saveUserInquiry } from "~/services/saveUserInquiry";
import { agentResponseAction } from "~/services/agentResponseAction";
import { Message } from "~/types/chat";

export async function loader() {
  const threadId = "123";

  if(!threadId) {
    throw redirect("/chat");
  }

  const existingThread = await memory.getThreadById({ threadId });

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

  // Convert and filter the messages to our app's Message format
  const filteredMessages = uiMessages.filter(msg => msg.content !== '' && (msg.role === 'assistant' || msg.role === 'user'));

  console.log("filteredMessages for UI:", filteredMessages);

  return {
    messages: filteredMessages as Message[]
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const input = formData.get("input");
  const threadId = formData.get("threadId");
  const userId = formData.get("userId");
  const action = formData.get("action");

  switch (action) {
    case "saveUserInquiry":
      await saveUserInquiry(input as string, threadId as string);
      break;
    
    case "executeAgent":
      await agentResponseAction(input as string, threadId as string, userId as string);
      break; 
  }

  return {
    success: true,
  }
}

export default function IndexPage() {
  const { messages } = useLoaderData<typeof loader>();
  const id = "123";

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col">
        <Chat
          chatId={id}
          messages={messages || []}
        />
      </div>
    </div>
  );
} 