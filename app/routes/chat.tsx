import { Outlet, useLoaderData, useMatches } from "@remix-run/react";
import { memory } from "src/mastra/agents";
import { ChatSidebar } from "~/components/ui/modules/ChatSidebar";

export async function loader() {
  const threads = await memory.getThreadsByResourceId({ resourceId: 'user-1' });
  console.log("Threads: >>>", threads);

  const formattedThreads = threads.map((thread) => ({
    id: thread.id,
    title: thread.title || 'Draft',
    createdAt: thread.createdAt.toISOString(),
  }));

  const sortedThreads = formattedThreads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return { threads: sortedThreads,  };
}

export default function ChatLayout() {
  const { threads } = useLoaderData<typeof loader>();
  const matches = useMatches();

  const currentChatId = matches.find((match) => match.id === "routes/chat.$id")?.params.id;

 return (
  <div className="flex min-h-screen">
    <ChatSidebar chats={threads || []} currentChatId={currentChatId} />
    <div className="flex-1 flex flex-col">
      <Outlet />
    </div>
  </div>
  )
} 