import { mastra } from '../../src/mastra';
import type { Message } from '~/types/chat';

export async function executeWeatherAgent(input: string): Promise<Message> {
  try {
    const weatherAgent = mastra.getAgent('weatherAgent');
    const response = await weatherAgent.generate([
      { role: "user", content: input }
    ]);
 
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: response.text,
      createdAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Weather agent error:', error);
    
    return {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: error instanceof Error ? error.message : 'Sorry, I encountered an error while fetching the weather information. Please try again.',
      createdAt: new Date().toISOString()
    };
  }
} 