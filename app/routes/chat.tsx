import { Outlet } from "@remix-run/react";
import { ChatSidebar } from "~/components/ui/modules/ChatSidebar";

export default function ChatLayout() {
 return (
  <div className="flex min-h-screen">
    <ChatSidebar chats={[]} currentChatId={undefined} />
    <div className="flex-1 flex flex-col">
      <Outlet />
    </div>
  </div>
  )
} 