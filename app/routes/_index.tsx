import { ActionFunctionArgs } from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";
import { memory } from "src/mastra/agents";
import Chat from "~/components/ui/modules/Chat";
import { saveUserInquiry } from "~/services/saveUserInquiry";
import { agentResponseAction } from "~/services/agentResponseAction";

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

    await memory.saveThread({
      thread: newThread,
      memoryConfig: {
        threads: {
          generateTitle: true,
        }
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

  console.log("messages from Mastra:", messages);
  
  // Convert and filter the messages to our app's Message format
  const filteredMessages = messages
    // We need to use any because the Mastra types don't match our app's Message type
    .map((msg: any) => {
      try {
        // Only return messages that match our criteria 
        if ((msg.role === 'user' || msg.role === 'assistant') && msg.type === 'text') {
          // Extract content properly
          let textContent = "";
          
          // Handle different content formats
          if (typeof msg.content === 'string') {
            if (msg.content.trim() === '') {
              return null; // Skip empty messages
            }
            // Try to parse if it looks like JSON
            if (msg.content.startsWith('[') || msg.content.startsWith('{')) {
              try {
                const parsed = JSON.parse(msg.content);
                if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].text) {
                  textContent = parsed[0].text;
                } else {
                  textContent = msg.content; // Fall back to the original
                }
              } catch (e) {
                textContent = msg.content; // If JSON parse fails
              }
            } else {
              textContent = msg.content; // Plain text
            }
          } else if (Array.isArray(msg.content) && msg.content.length > 0) {
            // Direct array format
            textContent = msg.content[0].text || JSON.stringify(msg.content);
          } else {
            // Fallback
            textContent = JSON.stringify(msg.content);
          }
          
          return {
            id: msg.id || crypto.randomUUID(),
            role: msg.role as "user" | "assistant",
            content: textContent,
            type: 'text' as const,
            createdAt: msg.createdAt || new Date().toISOString(),
            threadId: existingThread.id
          };
        }
      } catch (error) {
        console.error("Error processing message:", error, msg);
      }
      return null;
    })
    // Remove null values (messages that didn't match our criteria)
    .filter(msg => msg !== null);

  console.log("filteredMessages for UI:", filteredMessages);

  return {
    messages: filteredMessages
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
      console.log("executeAgent");
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