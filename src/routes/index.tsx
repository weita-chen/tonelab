import { createFileRoute } from "@tanstack/react-router";
import { Workspace } from "@/components/workshop/Workspace";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <Workspace />;
}
