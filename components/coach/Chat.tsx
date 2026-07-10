"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { CoachMode } from "./system-prompts";
import { SYSTEM_PROMPTS, MODE_LABELS } from "./system-prompts";
import MessageBubble from "./MessageBubble";
import ClearChatButton from "./ClearChatButton";
import ChatStarterPrompts from "./ChatStarterPrompts";
import { COACH_MODE_META } from "./chat-config";
import {
  formatTime,
  groupMessagesByDay,
  MAX_CONTEXT_TURNS,
  type DayGroup,
} from "./chat-utils";
import {
  Bot,
  User,
  CornerDownRight,
  RotateCcw,
  ChevronsDown,
} from "lucide-react";
import CoachSidebar from "./CoachSidebar";

interface MsgRow {
  id: string;
  user_id: string;
  mode: CoachMode;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

/* ------------------------------ Inner chat UI ----------------------------- */

function InnerChat({ mode }: { mode: CoachMode }) {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const router = useRouter();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [input, setInput] = useState("");
  const [showJump, setShowJump] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);
  const [responseMode, setResponseMode] = useState<"brief" | "detailed">("brief");

  const listRef = useRef<HTMLDivElement | null>(null);

  // draft persistence per mode
  const DRAFT_KEY = `offervia:coachDraft:${mode}`;
  useEffect(() => {
    try {
      const d = localStorage.getItem(DRAFT_KEY);
      if (d) setInput(d);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, input);
    } catch {}
  }, [DRAFT_KEY, input]);

  const loadMessages = useCallback(
    async (nextUserId: string | null, nextMode: CoachMode) => {
      if (!nextUserId) {
        setMessages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id,user_id,mode,role,content,created_at")
        .eq("user_id", nextUserId)
        .eq("mode", nextMode)
        .order("created_at", { ascending: true });

      if (error) {
        toast({ title: "Failed to load chat", variant: "destructive" });
      } else {
        setMessages((data || []) as MsgRow[]);
      }
      setLoading(false);
    },
    [supabase, toast]
  );

  // initial load
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!mounted) return;
      if (!user) {
        setUserId(null);
        await loadMessages(null, mode);
        return;
      }
      setUserId(user.id);
      await loadMessages(user.id, mode);
    });
    return () => {
      mounted = false;
    };
  }, [loadMessages, mode, supabase]);

  // auto-scroll & jump button
  const scrollToBottom = useCallback((smooth = true) => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);
  useEffect(() => {
    scrollToBottom(true);
  }, [messages, sending, scrollToBottom]);
  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    const onScroll = () => {
      const nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
      setShowJump(!nearBottom);
    };
    onScroll(); // set initial
    node.addEventListener("scroll", onScroll, { passive: true });
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  const grouped: DayGroup<MsgRow>[] = useMemo(() => groupMessagesByDay(messages), [messages]);

  // find the last user message (for regenerate)
  const lastUserMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") return messages[i];
    }
    return null;
  }, [messages]);

  const stop = useCallback(() => {
    if (controller) {
      controller.abort();
      setController(null);
      setSending(false);
    }
  }, [controller]);

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || !userId || sending) return;

    setSending(true);

    // optimistic user msg
    const optimisticUser: MsgRow = {
      id: `tmp_user_${Date.now()}`,
      user_id: userId,
      mode,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");

    // call AI (abortable) with compacted context
    const ctrl = new AbortController();
    setController(ctrl);
    try {
      const system = { role: "system", content: SYSTEM_PROMPTS[mode] } as const;
      const trimmedHistory = messages
        .slice(-MAX_CONTEXT_TURNS)
        .map((m) => ({ role: m.role, content: m.content }));
      const payload = { mode, responseMode, messages: [system, ...trimmedHistory, { role: "user", content }] };

      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });

      // Rate limit: show toast and stop
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const retry = res.headers.get("Retry-After");
        const mins = retry ? Math.ceil(Number(retry) / 60) : null;
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
        toast({
          title: data?.error || "Rate limit reached",
          description: mins ? `Try again in ~${mins} min.` : "Please try again later.",
          variant: "destructive",
        });
        setController(null);
        setSending(false);
        return;
      }

      // Plan limit: show server message + upgrade CTA
      if (res.status === 403) {
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
        if (data?.error === "PLAN_LIMIT_REACHED") {
          toast({
            title: "Limit reached",
            description: data?.message ?? "You've reached your monthly AI coaching limit. Upgrade to Pro to continue.",
            variant: "upgrade",
            duration: 8000,
            action: (
              <Button
                size="default"
                className="cursor-pointer bg-primary-button text-primary-button-foreground hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                onClick={() => router.push("/upgrade")}
              >
                Upgrade to Pro
              </Button>
            ),
          });
        } else {
          toast({
            title: data?.message ?? data?.error ?? "Access denied",
            variant: "destructive",
          });
        }
        setController(null);
        setSending(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data?.message ?? data?.error ?? `Request failed (${res.status})`;
        if (data?.userMessage?.id) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimisticUser.id
                ? ({
                    ...data.userMessage,
                    mode,
                  } as MsgRow)
                : m
            )
          );
        } else {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
        }
        if (res.status >= 500) {
          toast({
            title: "AI is temporarily unavailable. Try again soon.",
            variant: "destructive",
          });
        } else {
          toast({ title: message, variant: "destructive" });
        }
        setController(null);
        setSending(false);
        return;
      }
      const data = await res.json();
      const persistedUser = data?.userMessage as MsgRow | undefined;
      const assistantMessage = data?.assistantMessage as MsgRow | undefined;

      setMessages((prev) => {
        const withUser = prev.map((m) =>
          m.id === optimisticUser.id && persistedUser ? { ...persistedUser, mode } : m
        );
        return assistantMessage ? [...withUser, { ...assistantMessage, mode }] : withUser;
      });
    } catch (e: unknown) {
      if (e instanceof Error && e.name === "AbortError") {
        toast({ title: "Generation stopped" });
        await loadMessages(userId, mode);
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
        toast({
          title: "AI is temporarily unavailable. Try again soon.",
          variant: "destructive",
        });
      }
    } finally {
      setController(null);
      setSending(false);
      // ensure we end at the bottom after completion
      setTimeout(() => {
        scrollToBottom(true);
      }, 0);
    }
  }, [input, loadMessages, messages, mode, responseMode, sending, toast, userId, scrollToBottom, router]);

  // regenerate last assistant reply (re-send last user message)
  const regenerate = useCallback(() => {
    if (!lastUserMessage || sending) return;
    setInput(lastUserMessage.content);
    setTimeout(() => {
      void send();
    }, 0);
  }, [lastUserMessage, send, sending]);

  const meta = COACH_MODE_META[mode];
  const ModeIcon = meta.icon;

  return (
    <Card className="flex h-[62vh] min-h-[440px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-white/5 sm:h-[72vh] dark:ring-black/10">
      <CardHeader className="border-b border-border/60 pb-3">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-primary-button/20 text-primary ring-1 ring-primary/20">
              <ModeIcon className="size-5" />
            </span>
            <div className="min-w-0">
              <CardTitle className="truncate text-base text-foreground sm:text-lg">
                {MODE_LABELS[mode]}
              </CardTitle>
              <p className="truncate text-xs text-foreground/60 sm:text-sm">
                {SYSTEM_PROMPTS[mode].split(".")[0] + "."}
              </p>
            </div>
          </div>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <span className="text-xs text-foreground/50">Reply</span>
            <div
              className="flex rounded-lg border border-border bg-background/50 p-0.5"
              role="tablist"
              aria-label="Reply style"
            >
              {(["brief", "detailed"] as const).map((rm) => (
                <button
                  key={rm}
                  type="button"
                  role="tab"
                  aria-selected={responseMode === rm}
                  onClick={() => setResponseMode(rm)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                    responseMode === rm
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/60 hover:text-foreground"
                  }`}
                >
                  {rm}
                </button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex-1 space-y-4 overflow-y-auto py-4" ref={listRef}>
        {/* jump to latest */}
        {showJump && (
          <Button
            size="sm"
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-full bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
          >
            <ChevronsDown className="mr-1 h-4 w-4" /> Jump to latest
          </Button>
        )}

        {loading ? (
          <div className="grid h-full place-items-center text-sm text-foreground/70">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-sm text-foreground/70">
            <ChatStarterPrompts
              mode={mode}
              onPrompt={(prompt) => {
                setInput(prompt);
                setTimeout(() => void send(), 0);
              }}
            />
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map((group, gi) => (
              <div key={gi} className="space-y-4">
                <div className="sticky top-0 z-10 mx-auto w-fit rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-foreground/70 backdrop-blur">
                  {group.label}
                </div>
                {group.items.map((m, idx) => {
                  const isUser = m.role === "user";
                  const isLastAssistant =
                    m.role === "assistant" &&
                    gi === grouped.length - 1 &&
                    idx === group.items.length - 1;
                  return (
                    <div
                      key={m.id}
                      className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
                    >
                      <span
                        className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ring-1 ${
                          isUser
                            ? "bg-foreground/[0.06] text-foreground/70 ring-border"
                            : "bg-gradient-to-br from-primary/25 to-primary-button/20 text-primary ring-primary/20"
                        }`}
                      >
                        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                      </span>
                      <div className={`flex min-w-0 max-w-[85%] flex-col ${isUser ? "items-end" : "items-start"}`}>
                        <MessageBubble role={m.role} content={m.content} />
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-foreground/45">
                          <span>{formatTime(m.created_at)}</span>
                          {isLastAssistant && lastUserMessage && (
                            <button
                              onClick={regenerate}
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                              title="Regenerate reply"
                            >
                              <RotateCcw className="h-3 w-3" /> Regenerate
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
            {sending && (
              <div className="flex items-start gap-2.5">
                <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/25 to-primary-button/20 text-primary ring-1 ring-primary/20">
                  <Bot className="h-4 w-4" />
                </span>
                <div className="inline-flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-background/70 px-4 py-3 shadow-sm">
                  <span className="size-2 typing-dot rounded-full bg-primary/60 [animation-delay:-0.32s]" />
                  <span className="size-2 typing-dot rounded-full bg-primary/60 [animation-delay:-0.16s]" />
                  <span className="size-2 typing-dot rounded-full bg-primary/60" />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex-col items-stretch gap-2 border-t border-border/60 pt-3">
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background/70 p-1.5 shadow-sm transition-colors focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/20">
          <Textarea
            aria-label="Chat input"
            placeholder={userId ? "Ask a question or paste a draft for feedback…" : "Sign in to chat"}
            className="max-h-40 min-h-[44px] resize-none border-0 bg-transparent px-2.5 py-2 text-foreground shadow-none placeholder:text-foreground/40 focus-visible:ring-0"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!userId || loading || sending}
            onKeyDown={(e) => {
              const isEnter = e.key === "Enter";
              const modSend = (e.metaKey || e.ctrlKey) && isEnter;
              if (isEnter && !e.shiftKey) {
                e.preventDefault();
                void send();
              } else if (modSend) {
                e.preventDefault();
                void send();
              }
            }}
          />
          {!sending ? (
            <Button
              size="icon"
              onClick={() => void send()}
              disabled={!userId || loading || !input.trim()}
              aria-label="Send message"
              className="size-10 shrink-0 cursor-pointer rounded-xl bg-primary-button text-primary-button-foreground hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <CornerDownRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={stop}
              className="h-10 shrink-0 rounded-xl border-border text-foreground hover:bg-foreground/[0.06]"
            >
              Stop
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-1">
          <ClearChatButton
            disabled={!userId || loading || messages.length === 0}
            onConfirm={async () => {
              if (!userId) return;
              const res = await fetch(`/api/coach?mode=${encodeURIComponent(mode)}`, {
                method: "DELETE",
              });
              if (res.ok) {
                toast({ variant: "success", title: "Chat cleared" });
                setMessages([]);
              } else {
                toast({ title: "Failed to clear chat", variant: "destructive" });
              }
            }}
          />
          <span className="hidden text-[11px] text-foreground/40 sm:block">
            Enter to send · Shift+Enter for a new line
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}

/* ------------------------- Default export with sidebar -------------------- */

export default function Chat({ mode = "interview" as CoachMode }: { mode?: CoachMode }) {
  const [active, setActive] = useState<CoachMode>(mode);

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <CoachSidebar active={active} onChange={setActive} />
      <section className="min-w-0 flex-1">
        <InnerChat mode={active} />
      </section>
    </div>
  );
}
