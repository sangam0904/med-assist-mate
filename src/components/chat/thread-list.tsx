import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type Thread = { id: string; title: string; updated_at: string };

export async function createThread(): Promise<string | null> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("chat_threads")
    .insert({ user_id: uid, title: "New chat" })
    .select("id")
    .single();
  if (error || !data) {
    toast.error("Could not start a new chat");
    return null;
  }
  return data.id;
}

export function ThreadList({ activeId }: { activeId?: string }) {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const current = activeId ?? params.threadId;
  const [threads, setThreads] = useState<Thread[]>([]);

  async function load() {
    const { data } = await supabase
      .from("chat_threads")
      .select("id,title,updated_at")
      .order("updated_at", { ascending: false });
    setThreads(data ?? []);
  }

  useEffect(() => {
    void load();
  }, [current]);

  async function handleNew() {
    const id = await createThread();
    if (id) navigate({ to: "/chat/$threadId", params: { threadId: id } });
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("chat_threads").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete this chat");
      return;
    }
    setThreads((prev) => prev.filter((t) => t.id !== id));
    if (id === current) navigate({ to: "/chat" });
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <Button onClick={handleNew} className="w-full">
        <MessageSquarePlus className="size-4" /> New chat
      </Button>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {threads.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Your conversations appear here.
          </p>
        )}
        {threads.map((thread) => (
          <div
            key={thread.id}
            className={cn(
              "group flex items-center gap-1 rounded-xl px-1 transition-colors hover:bg-accent",
              thread.id === current && "bg-primary-soft",
            )}
          >
            <Link
              to="/chat/$threadId"
              params={{ threadId: thread.id }}
              className="flex-1 truncate px-2 py-2.5 text-sm"
            >
              {thread.title}
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Delete ${thread.title}`}
              onClick={() => handleDelete(thread.id)}
              className="opacity-0 transition-opacity group-hover:opacity-100"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
