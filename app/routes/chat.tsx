import { Outlet, useLoaderData } from "@remix-run/react";
import { memory } from "src/mastra/agents";
import { ChatSidebar } from "~/components/ui/modules/ChatSidebar";

export async function loader() {
  const threads = await memory.getThreadsByResourceId({ resourceId: 'user-1' });

  const formattedThreads = threads.map((thread) => ({
    id: thread.id,
    title: thread.title || 'Draft',
    createdAt: thread.createdAt.toISOString(),
  }));

  return { threads: formattedThreads };
}

export default function ChatLayout() {
  const { threads } = useLoaderData<typeof loader>();

 return (
  <div className="flex min-h-screen">
    <ChatSidebar chats={threads || []} currentChatId={undefined} />
    <div className="flex-1 flex flex-col">
      <Outlet />
    </div>
  </div>
  )
} 