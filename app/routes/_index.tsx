import type { MetaFunction , LoaderFunction } from "@remix-run/node";
import Chat from "~/components/ui/modules/Chat";
import { redirect } from "@remix-run/node";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export const loader: LoaderFunction = async () => {
  return redirect("/chat");
};

export default function Index() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-16">
        <Chat messages={[]} input={""} handleInputChange={() => {}} handleSubmit={() => {}} isLoading={false} error={undefined} stop={() => {}} />
      </div>
    </div>
  );
}

