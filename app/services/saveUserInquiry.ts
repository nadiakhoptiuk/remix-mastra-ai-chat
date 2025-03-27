import { memory } from "src/mastra/agents";

export async function saveUserInquiry(input: string, threadId: string) {
  const response = await memory.addMessage({
    role: 'user',
    type: 'text',
    content: [{type: "text", text: input as string}],
    threadId: threadId,
  });

  return {
    id: response.id,
    role: response.role,
    type: response.type,
    content: response.content,
    threadId: response.threadId,
    createdAt: response.createdAt,
  };
}