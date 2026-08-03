import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MessageSquareHeart } from "lucide-react";
import { ThreadList, createThread } from "@/components/chat/thread-list";
import { Button } from "@/components/ui/button";
import { SUGGESTED_QUESTIONS } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({
    meta: [
      { title: "AI Doctor Chat — MedAssist AI" },
      {
        name: "description",
        content: "Ask health questions and get calm, structured AI guidance in your language.",
      },
      { property: "og:title", content: "AI Doctor Chat — MedAssist AI" },
      {
        property: "og:description",
        content: "Ask health questions and get calm, structured AI guidance in your language.",
      },
    ],
  }),
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function start(seed?: string) {
    setBusy(true);
    const id = await createThread();
    setBusy(false);
    if (!id) return;
    navigate({
      to: "/chat/$threadId",
      params: { threadId: id },
      search: seed ? { q: seed } : undefined,
    });
  }

  useEffect(() => {
    document.title = "AI Doctor Chat — MedAssist AI";
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="surface-card hidden h-[70vh] p-3 lg:block">
        <ThreadList />
      </aside>

      <section className="surface-card flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
          <MessageSquareHeart className="size-7" />
        </span>
        <h1 className="mt-5 text-2xl font-semibold">How are you feeling today?</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Describe your symptoms or ask any health question. MedAssist AI answers in English,
          Hindi or Hinglish and tells you when to see a doctor.
        </p>
        <div className="mt-6 grid w-full max-w-xl gap-2 sm:grid-cols-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => start(q)}
              disabled={busy}
              className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
            >
              {q}
            </button>
          ))}
        </div>
        <Button className="mt-6" onClick={() => start()} disabled={busy}>
          Start a new chat
        </Button>
      </section>
    </div>
  );
}
