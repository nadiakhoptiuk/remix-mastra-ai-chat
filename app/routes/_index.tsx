import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { data, useLoaderData } from "@remix-run/react";
import { memory } from "src/mastra/agents";
import Chat from "~/components/ui/modules/Chat";
import { mastra } from "../../src/mastra";
import { agentExecutionManager } from "~/services/agent.server";
import type { Message } from "~/types/chat";
import { saveUserInquiry } from "~/services/saveUserInquiry";
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const streamRequest = url.searchParams.get("_stream") === "true";
  const threadId = "123"; // Fixed threadId for the index route
  
  // Handle streaming request
  if (streamRequest) {
    const userInput = url.searchParams.get("input") || "";
    console.log("Streaming request received for input:", userInput);
    
    // Create a TextEncoder to convert strings to Uint8Array
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log("Stream started, sending thinking state");
          // Send initial "thinking" state - encode the string to Uint8Array
          const thinkingData = encoder.encode(
            `data: ${JSON.stringify({ type: "thinking" })}\n\n`
          );
          controller.enqueue(thinkingData);

          // Get the agent
          const weatherAgent = mastra.getAgent("weatherAgent");
          console.log("Got weather agent");
          
          // Create abort controller for this request
          const abortController = agentExecutionManager.createController(threadId);
          
          // Track the full response to save to memory at the end
          let fullResponse = "";
          const messageId = memory.generateId();
          
          // Stream from the agent
          try {
            console.log("Starting agent stream with input:", userInput);
            const response = await weatherAgent.stream(userInput, {
              threadId,
              resourceId: "user-1",
              abortSignal: abortController.signal,
            });

            console.log("Agent stream started, streaming chunks to client");
            // Stream each chunk to the client
            for await (const chunk of response.textStream) {
              console.log("Chunk received:", chunk);
              fullResponse += chunk;
              const chunkData = encoder.encode(
                `data: ${JSON.stringify({ 
                  type: "chunk", 
                  content: chunk,
                  id: messageId,
                  role: "assistant",
                })}\n\n`
              );
              controller.enqueue(chunkData);
            }

            console.log("Stream completed, saving full response");
            // Save the complete message to memory
            await memory.addMessage({
              threadId,
              role: "assistant",
              content: fullResponse,
              type: "text",
            });

            console.log("Message saved, sending done event");
            // Send completion message
            const doneData = encoder.encode(
              `data: ${JSON.stringify({ 
                type: "done", 
                fullResponse,
                id: messageId
              })}\n\n`
            );
            controller.enqueue(doneData);
          } catch (error) {
            // Check if this was an abort error
            if (error instanceof DOMException && error.name === 'AbortError') {
              console.log("Stream aborted by user");
              const abortedData = encoder.encode(
                `data: ${JSON.stringify({ 
                  type: "aborted", 
                  message: "Generation was stopped by the user",
                  id: messageId
                })}\n\n`
              );
              controller.enqueue(abortedData);
              
              // Save partial response to memory
              if (fullResponse) {
                await memory.addMessage({
                  threadId,
                  role: "assistant",
                  content: fullResponse + " [Generation stopped]",
                  type: "text",
                });
              }
            } else {
              console.error("Stream error:", error);
              throw error; // Re-throw non-abort errors
            }
          } finally {
            // Clean up the abort controller
            agentExecutionManager.abortExecution(threadId);
            controller.close();
          }
        } catch (error) {
          console.error("Stream error:", error);
          const errorData = encoder.encode(
            `data: ${JSON.stringify({ 
              type: "error", 
              message: error instanceof Error ? error.message : "Unknown error"
            })}\n\n`
          );
          controller.enqueue(errorData);
          controller.close();
        }
      }
    });

    // Return the stream as a response
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

  // Regular page load request - load messages
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
  
  // Convert and filter the messages to our app's Message format
  const filteredMessages = messages
    .map((msg) => {
      try {
        // Skip messages that don't match our criteria
        if (msg.role !== 'user' && msg.role !== 'assistant') {
          return null;
        }
        
        // Skip tool call messages
        if ('type' in msg && msg.type === 'tool-call') {
          return null;
        }
        
        // Extract content properly
        let textContent = "";
        
        // Handle different content formats
        if (typeof msg.content === 'string') {
          if (msg.content.trim() === '') {
            return null; // Skip empty messages
          }
          textContent = msg.content;
        } else if (Array.isArray(msg.content) && msg.content.length > 0) {
          // Handle array content format
          const firstItem = msg.content[0];
          if (typeof firstItem === 'string') {
            textContent = firstItem;
          } else if (typeof firstItem === 'object' && firstItem !== null) {
            textContent = 'text' in firstItem ? firstItem.text || '' : JSON.stringify(firstItem);
          } else {
            textContent = JSON.stringify(msg.content);
          }
        } else {
          // Fallback
          textContent = JSON.stringify(msg.content);
        }
        
        // Create and return our app's Message format
        return {
          id: 'id' in msg ? msg.id : crypto.randomUUID(),
          role: msg.role as "user" | "assistant",
          content: textContent,
          type: 'text' as const,
          createdAt: 'createdAt' in msg ? msg.createdAt : new Date().toISOString(),
          threadId: existingThread.id
        };
      } catch (error) {
        console.error("Error processing message:", error, msg);
      }
      return null;
    })
    // Remove null values (messages that didn't match our criteria)
    .filter(Boolean) as Message[];

  console.log("filteredMessages for UI:", filteredMessages);

  return {
    messages: filteredMessages
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const input = formData.get("input") as string;
  const action = formData.get("action") as string;
  const threadId = "123"; // Fixed threadId for the index route

  if (!input && action !== "abort") {
    return data({ success: false, message: "Input is required" }, { status: 400 });
  }

  // Handle the abort action
  if (action === "abort") {
    const aborted = agentExecutionManager.abortExecution(threadId);
    return data({ 
      success: aborted, 
      message: aborted ? "Agent execution aborted successfully" : "No agent execution found" 
    });
  }

  // Save user message to memory
  if (action === "saveUserMessage") {
    try {
      console.log("Saving user message:", input);
      await saveUserInquiry(input, threadId);
      
      return { success: true };
    } catch (error) {
      console.error("Error saving user message:", error);
      return data({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to save message" 
      }, { status: 500 });
    }
  }

  return data({ success: false, message: "Invalid action" }, { status: 400 });
}

export default function IndexPage() {
  const { messages } = useLoaderData<typeof loader>();
  const threadId = "123";

  return (
    <div className="flex min-h-screen">
      <div className="flex-1 flex flex-col">
        <Chat
          chatId={threadId}
          messages={messages || []}
        />
      </div>
    </div>
  );
} 