import { executeWeatherAgentStream } from "~/services/agent.server";

export async function agentResponseAction(input: string, threadId: string, userId: string) {
  // The executeWeatherAgent function already saves the message to memory
  // through the agent.generate() call, so we don't need to save it again
  const response = await executeWeatherAgentStream(input, threadId, userId);
  
  // No need to manually add the message again
  // await memory.addMessage({
  //   role: 'assistant',
  //   type: 'text',
  //   content: response.content,
  //   threadId: threadId,
  // });

  return response;
}