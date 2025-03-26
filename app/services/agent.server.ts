import { memory } from 'src/mastra/agents';
import { mastra } from '../../src/mastra';
import type { Message } from '~/types/chat';

export async function executeWeatherAgent(input: string, threadId: string, resourceId: string): Promise<Pick<Message, 'id' | 'role' | 'content' | 'createdAt'>> {
  try {
    const weatherAgent = mastra.getAgent('weatherAgent');
    const response = await weatherAgent.generate([
      { role: "user", content: input }
    ], {
      threadId: threadId,
      resourceId: resourceId,
    });
 
    return {
      id: memory.generateId(),
      role: 'assistant',
      content: response.text,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Weather agent error:', error);
    
    return {
      id: memory.generateId(),
      role: 'assistant',
      content: error instanceof Error ? error.message : 'Sorry, I encountered an error while fetching the weather information. Please try again.',
      createdAt: new Date().toISOString(),
    };
  }
} 