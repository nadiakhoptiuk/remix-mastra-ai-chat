import { memory } from 'src/mastra/agents';
import { mastra } from '../../src/mastra';
import type { Message } from '~/types/chat';
import { data } from '@remix-run/react';

// Store for active agent executions by thread ID
class AgentExecutionManager {
  private static instance: AgentExecutionManager;
  private activeExecutions: Map<string, AbortController> = new Map();

  private constructor() {}

  public static getInstance(): AgentExecutionManager {
    if (!AgentExecutionManager.instance) {
      AgentExecutionManager.instance = new AgentExecutionManager();
    }
    return AgentExecutionManager.instance;
  }

  public createController(threadId: string): AbortController {
    // If there's already an active execution for this thread, abort it first
    this.abortExecution(threadId);
    
    // Create a new controller for this thread
    const controller = new AbortController();
    this.activeExecutions.set(threadId, controller);
    return controller;
  }

  public getController(threadId: string): AbortController | undefined {
    return this.activeExecutions.get(threadId);
  }

  public abortExecution(threadId: string): boolean {
    const controller = this.activeExecutions.get(threadId);
    if (controller) {
      controller.abort();
      this.activeExecutions.delete(threadId);
      return true;
    }
    return false;
  }

  public clearAll(): void {
    for (const controller of this.activeExecutions.values()) {
      controller.abort();
    }
    this.activeExecutions.clear();
  }
}


// Export the manager for use in other modules
export const agentExecutionManager = AgentExecutionManager.getInstance();



export async function executeWeatherAgentStream(input: string, threadId: string, resourceId: string) {
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const weatherAgent = mastra.getAgent('weatherAgent');
          const abortController = agentExecutionManager.createController(threadId);

          console.log('stream is gonna start')
          let fullResponse = "";
          const agentStream = await weatherAgent.stream('', {
            threadId,
            resourceId,
            abortSignal: abortController.signal,
          });
          const messageId = memory.generateId();

          for await (const chunk of agentStream.textStream) {
            fullResponse += chunk;
            console.log('chunk', chunk)
            controller.enqueue(`data: ${JSON.stringify({ 
            type: "chunk", 
            content: chunk,
            id: messageId,
            role: "assistant",
          })}\n\n`)
          }
          controller.enqueue(`data: ${JSON.stringify({ type: "done", fullResponse })}\n\n`);
          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.enqueue(`data: ${JSON.stringify({ 
          type: "error", 
          message: error instanceof Error ? error.message : "Unknown error"
        })}\n\n`);
          controller.close();
        }
      },
    });

   // If we completed successfully, remove the controller
    agentExecutionManager.abortExecution(threadId);

    return data(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }

// Function to abort an ongoing agent execution
export function abortAgentExecution(threadId: string): boolean {
  return agentExecutionManager.abortExecution(threadId);
} 