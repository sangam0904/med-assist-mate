import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { generateThreadTitle } from "@/lib/ai.functions";
import { ThreadList } from "@/components/chat/thread-list";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { MEDICAL_DISCLAIMER } from "@/lib/constants";
import logo from "@/assets/medassist-logo.png";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  validateSearch: (search: Record<string, unknown>): { q?: string } =>
    typeof search["q"] === "string" ? { q: search["q"] } : {},
  head: () => ({
    meta: [
      { title: "Conversation — MedAssist AI" },
      { name: "description", content: "Your private AI health conversation." },
      { property: "og:title", content: "Conversation — MedAssist AI" },
      { property: "og:description", content: "Your private AI health conversation." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ChatThreadPage,
});

function textOf(message: UIMessage) {
  return message.parts
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

function ChatThreadPage() {
  const { threadId } = Route.useParams();
  const { q } = Route.useSearch();
  const [initial, setInitial] = useState<UIMessage[] | null>(null);

  useEffect(() => {
    let active = true;
    setInitial(null);
    supabase
      .from("chat_messages")
      .select("id,role,content,created_at")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) toast.error("Could not load this conversation");
        setInitial(
          (data ?? []).map((row) => ({
            id: row.id,
            role: row.role === "user" ? "user" : "assistant",
            parts: [{ type: "text" as const, text: row.content }],
          })),
        );
      });
    return () => {
      active = false;
    };
  }, [threadId]);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      <aside className="surface-card hidden h-[calc(100vh-8rem)] p-3 lg:block">
        <ThreadList activeId={threadId} />
      </aside>
      {initial === null ? (
        <div className="surface-card flex min-h-[60vh] items-center justify-center">
          <Shimmer>Loading conversation...</Shimmer>
        </div>
      ) : (
        <ChatWindow key={threadId} threadId={threadId} initial={initial} seed={q} />
      )}
    </div>
  );
}

function ChatWindow({
  threadId,
  initial,
  seed,
}: {
  threadId: string;
  initial: UIMessage[];
  seed: string | undefined;
}) {
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const titleFn = useServerFn(generateThreadTitle);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seeded = useRef(false);
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initial,
    transport,
    onError: (error) => {
      console.error(error);
      toast.error("The assistant could not respond. Please try again.");
    },
    onFinish: async ({ message }) => {
      const content = textOf(message);
      if (!content) return;
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { error } = await supabase
        .from("chat_messages")
        .insert({ thread_id: threadId, user_id: uid, role: "assistant", content });
      if (error) console.error("failed to save assistant message", error);
      await supabase
        .from("chat_threads")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", threadId);
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy, threadId]);

  async function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    setInput("");

    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (uid) {
      const { error } = await supabase
        .from("chat_messages")
        .insert({ thread_id: threadId, user_id: uid, role: "user", content: trimmed });
      if (error) toast.error("Message could not be saved to your history");
    }

    void sendMessage({ text: trimmed });

    if (messages.length === 0) {
      try {
        const { title } = await titleFn({ data: { message: trimmed } });
        await supabase.from("chat_threads").update({ title }).eq("id", threadId);
      } catch {
        /* title generation is best-effort */
      }
    }
  }

  useEffect(() => {
    if (seed && !seeded.current && initial.length === 0) {
      seeded.current = true;
      void submit(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return (
    <section className="surface-card flex h-[calc(100vh-8rem)] min-h-[520px] flex-col overflow-hidden">
      <header className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <img src={logo} alt="" width={28} height={28} className="size-7" />
        <div>
          <h1 className="text-sm font-semibold">MedAssist AI</h1>
          <p className="text-xs text-muted-foreground">General health guidance, not a diagnosis</p>
        </div>
      </header>

      <Conversation className="flex-1">
        <ConversationContent className="space-y-1">
          {messages.map((message) => (
            <Message key={message.id} from={message.role === "user" ? "user" : "assistant"}>
              <MessageContent>
                <MessageResponse>{textOf(message)}</MessageResponse>
              </MessageContent>
            </Message>
          ))}
          {status === "submitted" && (
            <div className="px-2 py-3">
              <Shimmer>Thinking...</Shimmer>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3">
        <PromptInput
          onSubmit={(message) => {
            void submit(message.text ?? input);
          }}
        >
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your symptoms or ask a health question..."
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() && !busy} />
          </PromptInputFooter>
        </PromptInput>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">{MEDICAL_DISCLAIMER}</p>
      </div>
    </section>
  );
}
