export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: 'text' | 'tool-call' | 'tool-result';
  createdAt: string;
  threadId: string;
}