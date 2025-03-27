import type { Message } from "~/types/chat";
import { ChatMessageList } from "~/components/ui/chat/chat-message-list";
import { ChatInput } from "~/components/ui/chat/chat-input";
import { Button } from "~/components/ui/button";
import { PaperPlaneIcon, StopIcon } from "@radix-ui/react-icons";
import { useFetcher, useRevalidator } from "@remix-run/react";
import { useEffect, useState, useRef } from "react";

export interface ChatProps {
  chatId?: string;
  messages: Message[];
}

export default function Chat({ 
  messages: initialMessages, 
  chatId
}: ChatProps) {
  const threadId = chatId || "123";
  const fetcher = useFetcher();
  const abortFetcher = useFetcher();
  const { revalidate } = useRevalidator();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState<Message | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  
  // Update local messages when prop messages change
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  // Handle form submission by starting SSE streaming
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    
    // Create a new user message and add it immediately for better UX
    const userMessage: Message = {
      id: crypto.randomUUID(), // Client-side ID that will be replaced after reload
      role: "user",
      content: input,
      type: "text",
      createdAt: new Date().toISOString(),
      threadId
    };
    
    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    
    // Save the user message to the database first using the existing fetcher
    const formData = new FormData();
    formData.append("input", input);
    formData.append("action", "saveUserMessage");
    
    // Submit the form to save the user message
    fetcher.submit(formData, { 
      method: "post"// Explicitly set the action to the root path
    });
    
    // Store the current input for streaming
    const currentInput = input;
    
    // Clear input field
    setInput("");
    
    // Start streaming the response after a short delay to ensure message is saved
    setTimeout(() => {
      startStreaming(currentInput);
    }, 100);
  };



  // Function to start streaming from the server
  const startStreaming = (userInput: string) => {
    // Clean up any existing EventSource
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    setIsGenerating(true);
    
    // Create an empty assistant message that will be progressively filled
    setCurrentStreamingMessage({
      id: "temp-" + crypto.randomUUID(), // Temp ID that will be replaced with actual ID from server
      role: "assistant",
      content: "Connecting to weather service...",
      type: "text",
      createdAt: new Date().toISOString(),
      threadId
    });
    
    try {
      // Setup SSE connection with proper query param
      const url = `/?_stream=true&input=${encodeURIComponent(userInput)}&_=${Date.now()}`; // Add cache-busting
      console.log("Creating EventSource connection to:", url);
      
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;
      
      // Set up onopen handler to confirm connection was established
      eventSource.onopen = (event) => {
        console.log("EventSource connection established:", event);
        setCurrentStreamingMessage(prev => {
          if (!prev) return null;
          return {
            ...prev,
            content: "Connected. Waiting for response..."
          };
        });
      };
      
      // Handle incoming SSE messages
      eventSource.onmessage = (event) => {
        console.log("Received SSE message:", event.data);
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case "thinking":
              // Agent is thinking, could display a typing indicator here
              setCurrentStreamingMessage(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  content: "Thinking..."
                };
              });
              break;
              
            case "chunk":
              // Update the streaming message with new content chunk
              setCurrentStreamingMessage(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  id: data.id, // Use server-provided ID
                  content: prev.content === "Thinking..." || prev.content === "Connected. Waiting for response..." ? 
                    data.content : 
                    prev.content + data.content
                };
              });
              break;
              
            case "done":
              // Streaming complete, clean up
              closeStream();
              
              // We will let the revalidation update the messages
              setTimeout(() => {
                revalidate();
                setCurrentStreamingMessage(null);
              }, 100);
              break;
              
            case "aborted":
              // User aborted the generation
              closeStream();
              
              // Add note that generation was stopped
              setCurrentStreamingMessage(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  id: data.id,
                  content: prev.content + " [Generation stopped]"
                };
              });
              
              // Revalidate to get updated messages
              setTimeout(() => {
                revalidate();
                setCurrentStreamingMessage(null);
              }, 100);
              break;
              
            case "error":
              // Handle error from the server
              console.error("Error from stream:", data.message);
              closeStream();
              
              // Show error message
              setCurrentStreamingMessage(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  content: `Error: ${data.message}`
                };
              });
              
              // Revalidate after error
              setTimeout(() => {
                revalidate();
                setCurrentStreamingMessage(null);
              }, 100);
              break;
              
            default:
              console.warn("Unknown message type:", data.type);
          }
        } catch (error) {
          console.error("Error parsing SSE message:", error, "Raw data:", event.data);
          setCurrentStreamingMessage(prev => {
            if (!prev) return null;
            return {
              ...prev,
              content: "Error processing response. Please try again."
            };
          });
          closeStream();
          
          setTimeout(() => {
            setCurrentStreamingMessage(null);
          }, 2000);
        }
      };
      
      // Handle SSE errors
      eventSource.onerror = (error) => {
        console.error("EventSource error:", error);
        closeStream();
        
        // Update UI to show error
        setCurrentStreamingMessage(prev => {
          if (!prev) return null;
          return {
            ...prev,
            content: "Failed to connect to server. Please try again."
          };
        });
        
        // Revalidate to ensure we have the latest messages
        setTimeout(() => {
          revalidate();
          setCurrentStreamingMessage(null);
        }, 2000);
      };
    } catch (error) {
      console.error("Error creating EventSource:", error);
      setCurrentStreamingMessage(prev => {
        if (!prev) return null;
        return {
          ...prev,
          content: "Error connecting to server: " + (error instanceof Error ? error.message : String(error))
        };
      });
      setTimeout(() => {
        setIsGenerating(false);
        setCurrentStreamingMessage(null);
      }, 2000);
    }
  };
  


  // Helper to close the stream
  const closeStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setIsGenerating(false);
  };



  // Function to abort the agent execution
  const handleAbort = () => {
    // Close the event source
    closeStream();
    
    // Call the abort API to stop the agent on the server
    abortFetcher.submit(
      { action: "abort", threadId }, 
      { method: "post" }
    );
    
    // Add note that generation was stopped (UI feedback while waiting for server)
    setCurrentStreamingMessage(prev => {
      if (!prev) return null;
      return {
        ...prev,
        content: prev.content + " [Stopping...]"
      };
    });
  };
  


  // Combine persisted messages with current streaming message
  const allMessages = [...messages];
  if (currentStreamingMessage && !messages.some(m => m.id === currentStreamingMessage.id)) {
    allMessages.push(currentStreamingMessage);
  }
  
  return (
    <div className="flex flex-col justify-between w-full h-screen">
      <div className="flex-1 overflow-hidden">
        <ChatMessageList>
          {allMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "assistant" ? "justify-start" : "justify-end"
              } mb-4`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  message.role === "assistant"
                    ? "bg-muted"
                    : "bg-primary text-primary-foreground"
                }`}
              >
                {message.content}
                {message.id === currentStreamingMessage?.id && isGenerating && (
                  <span className="ml-1 animate-pulse">▋</span>
                )}
              </div>
            </div>
          ))}
        </ChatMessageList>
      </div>

      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <ChatInput
            value={input}
            onChange={handleInputChange}
            placeholder="Type a message..."
            name="input" 
            disabled={isGenerating}
          />

          {isGenerating ? (
            <Button 
              type="button" 
              size="icon" 
              variant="destructive"
              className="shrink-0" 
              onClick={handleAbort}
              title="Stop generating"
            >
              <StopIcon className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              type="submit" 
              size="icon" 
              className="shrink-0" 
              disabled={!input.trim()}
            >
              <PaperPlaneIcon className="h-4 w-4" />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
} 