"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { CoachMode } from "./system-prompts";
import { SYSTEM_PROMPTS, MODE_LABELS } from "./system-prompts";
import MessageBubble from "./MessageBubble";
import ClearChatButton from "./ClearChatButton";
import {
  Bot,
  User,
  Mail,
  Compass,
  MessageSquare,
  FileText,
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

type DayGroup = { label: string; items: MsgRow[] };

const MAX_CONTEXT_TURNS = 24; // send only the most recent turns to the model

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function dayLabel(date: Date) {
  const today = new Date();
  const yday = new Date(Date.now() - 86400000);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(date, today)) return "Today";
  if (sameDay(date, yday)) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------ Inner chat UI ----------------------------- */

function InnerChat({ mode }: { mode: CoachMode }) {
  const supabase = useMemo(() => getBrowserSupabase(), []);
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

  // initial load
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!mounted) return;
      if (!user) {
        setUserId(null);
        setMessages([]);
        setLoading(false);
        return;
      }
      setUserId(user.id);
      setLoading(true);
      const { data, error } = await supabase
        .from("messages")
        .select("id,user_id,mode,role,content,created_at")
        .eq("user_id", user.id)
        .eq("mode", mode)
        .order("created_at", { ascending: true });
      if (error) {
        toast({ title: "Failed to load chat", variant: "destructive" });
      } else {
        setMessages((data || []) as MsgRow[]);
      }
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [mode, supabase, toast]);

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

  const grouped: DayGroup[] = useMemo(() => {
    const byDay = new Map<string, MsgRow[]>();
    for (const m of messages) {
      const d = new Date(m.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(m);
    }
    return Array.from(byDay.entries())
      .sort(([a], [b]) => (a > b ? 1 : a < b ? -1 : 0))
      .map(([k, items]) => {
        const [y, mo, da] = k.split("-").map((n) => Number(n));
        const label = dayLabel(new Date(y, mo, da));
        return { label, items };
      });
  }, [messages]);

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

    // save to db and swap id
    const { data: insUser, error: insertUserErr } = await supabase
      .from("messages")
      .insert({ user_id: userId, mode, role: "user", content })
      .select("id,created_at")
      .single();
    if (insertUserErr) {
      toast({ title: "Failed to send message", variant: "destructive" });
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setSending(false);
      return;
    } else if (insUser) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticUser.id
            ? { ...m, id: insUser.id, created_at: insUser.created_at }
            : m
        )
      );
    }

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

      // NEW: show toast when daily/hourly/minute caps hit
      if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        const retry = res.headers.get("Retry-After");
        const mins = retry ? Math.ceil(Number(retry) / 60) : null;
        toast({
          title: data?.error || "Rate limit reached",
          description: mins ? `Try again in ~${mins} min.` : "Please try again later.",
          variant: "destructive",
        });
        setController(null);
        setSending(false);
        return;
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply: string = data?.content || "";

      const optimisticAssistant: MsgRow = {
        id: `tmp_assistant_${Date.now()}`,
        user_id: userId,
        mode,
        role: "assistant",
        content: reply || "(no reply)",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticAssistant]);

      const { data: insAsst, error: insertAsstErr } = await supabase
        .from("messages")
        .insert({ user_id: userId, mode, role: "assistant", content: reply || "" })
        .select("id,created_at")
        .single();
      if (insertAsstErr) {
        toast({ title: "Failed to save reply", variant: "destructive" });
      } else if (insAsst) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticAssistant.id
              ? { ...m, id: insAsst.id, created_at: insAsst.created_at }
              : m
          )
        );
      }
    } catch (e: any) {
      if (e?.name === "AbortError") {
        toast({ title: "Generation stopped" });
      } else {
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
  }, [input, messages, mode, sending, supabase, toast, userId, scrollToBottom]);

  // regenerate last assistant reply (re-send last user message)
  const regenerate = useCallback(() => {
    if (!lastUserMessage || sending) return;
    setInput(lastUserMessage.content);
    setTimeout(() => {
      void send();
    }, 0);
  }, [lastUserMessage, send, sending]);

  return (
    <Card className="flex h-[60vh] sm:h-[70vh] min-h-[400px] flex-col rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-foreground text-lg sm:text-xl">{MODE_LABELS[mode]} Mode</CardTitle>
            <div className="text-sm text-foreground/70">
              {SYSTEM_PROMPTS[mode].split(".")[0] + "."}
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-foreground/60">Response:</span>
            <div className="flex rounded-lg border border-border bg-background/50 p-1">
              <button
                onClick={() => setResponseMode("brief")}
                className={`px-2 sm:px-3 py-1 text-xs rounded-md transition-colors ${
                  responseMode === "brief"
                    ? "bg-indigo-600 text-white"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Brief
              </button>
              <button
                onClick={() => setResponseMode("detailed")}
                className={`px-2 sm:px-3 py-1 text-xs rounded-md transition-colors ${
                  responseMode === "detailed"
                    ? "bg-indigo-600 text-white"
                    : "text-foreground/70 hover:text-foreground"
                }`}
              >
                Detailed
              </button>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex-1 overflow-y-auto" ref={listRef}>
        {/* jump to latest */}
        {showJump && (
          <Button
            size="sm"
            onClick={() => scrollToBottom(true)}
            className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 bg-indigo-600 text-white hover:bg-indigo-500"
          >
            <ChevronsDown className="mr-1 h-4 w-4" /> Jump to latest
          </Button>
        )}

        {loading ? (
          <div className="grid h-full place-items-center text-sm text-foreground/70">Loading…</div>
        ) : messages.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-sm text-foreground/70">
            <div>
              {mode === "interview" && (
                <>
                  <p className="mb-2">Get tailored help for interview prep and practice.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("Help me prepare for a behavioral interview.");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <MessageSquare className="mr-1 h-4 w-4" />
                      Help me prepare for a behavioral interview.
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("Ask me a mock interview question.");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <MessageSquare className="mr-1 h-4 w-4" />
                      Ask me a mock interview question.
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("How do I explain a resume gap?");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      How do I explain a resume gap?
                    </Button>
                  </div>
                </>
              )}

              {mode === "resume" && (
                <>
                  <p className="mb-2">Refine your resume bullets, structure, and impact.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("Rewrite this bullet in STAR format.");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      Rewrite this bullet in STAR format.
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("How do I list freelance experience?");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      How do I list freelance experience?
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("Fix grammar in this bullet.");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <FileText className="mr-1 h-4 w-4" />
                      Fix grammar in this bullet.
                    </Button>
                  </div>
                </>
              )}

              {mode === "cover_letter" && (
                <>
                  <p className="mb-2">Craft personalized and engaging cover letters.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("Write a cover letter intro.");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <Mail className="mr-1 h-4 w-4" />
                      Write a cover letter intro.
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("Explain why I want to join this company.");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <Mail className="mr-1 h-4 w-4" />
                      Explain why I want to join this company.
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("Improve this paragraph.");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <Mail className="mr-1 h-4 w-4" />
                      Improve this paragraph.
                    </Button>
                  </div>
                </>
              )}

              {mode === "career" && (
                <>
                  <p className="mb-2">Career strategy, growth, and decision support.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("How do I choose between two job offers?");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <Compass className="mr-1 h-4 w-4" />
                      How do I choose between two job offers?
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("Help me plan a promotion roadmap.");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <Compass className="mr-1 h-4 w-4" />
                      Help me plan a promotion roadmap.
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => {
                        setInput("How do I negotiate salary?");
                        setTimeout(() => void send(), 0);
                      }}
                    >
                      <Compass className="mr-1 h-4 w-4" />
                      How do I negotiate salary?
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((group, gi) => (
              <div key={gi} className="space-y-3">
                <div className="sticky top-0 z-10 mx-auto w-fit rounded-full border border-border bg-background/80 px-3 py-1 text-xs text-foreground/70 backdrop-blur">
                  {group.label}
                </div>
                {group.items.map((m, idx) => {
                  const isLastAssistant =
                    m.role === "assistant" &&
                    gi === grouped.length - 1 &&
                    idx === group.items.length - 1;
                  return (
                    <div key={m.id} className="flex items-start gap-2">
                      {m.role === "assistant" ? (
                        <Bot className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <User className="order-2 ml-auto mt-0.5 h-5 w-5 text-foreground/70" />
                      )}
                      <div className="flex-1">
                        <MessageBubble role={m.role} content={m.content} />
                        {m.role === "assistant" && (
                          <p className="text-[11px] text-foreground/50 mt-1">💬 Mode: {responseMode}</p>
                        )}
                        <div
                          className={
                            "mt-1 flex items-center justify-between text-[11px] text-foreground/50 " +
                            (m.role === "user" ? "flex-row-reverse" : "")
                          }
                        >
                          <span>{formatTime(m.created_at)}</span>
                          {isLastAssistant && lastUserMessage && (
                            <button
                              onClick={regenerate}
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-400"
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
              <div className="flex items-start gap-2">
                <Bot className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <div className="mb-1 text-xs text-foreground/60">Coach</div>
                  <div className="inline-block max-w-[85%] animate-pulse rounded-xl border border-border bg-indigo-500/10 px-3 py-2 text-sm text-foreground">
                    Coach is typing…
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <ClearChatButton
            disabled={!userId || loading || messages.length === 0}
            onConfirm={async () => {
              if (!userId) return;
              const { error } = await getBrowserSupabase()
                .from("messages")
                .delete()
                .eq("user_id", userId)
                .eq("mode", mode);
              if (!error) {
                toast({ title: "Conversation cleared" });
                setMessages([]);
              } else {
                toast({ title: "Failed to clear", variant: "destructive" });
              }
            }}
          />
        </div>

        <div className="flex flex-1 items-start gap-2">
          <Textarea
            aria-label="Chat input"
            placeholder={userId ? "Type your message..." : "Sign in to chat"}
            className="min-h-[44px] bg-background/80 text-foreground placeholder:text-foreground/40 border-border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
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
              onClick={() => void send()}
              disabled={!userId || loading || !input.trim()}
              className="bg-indigo-600 text-white cursor-pointer hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            >
              <CornerDownRight className="mr-1 h-4 w-4" />
              Send
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={stop}
              className="border-border text-foreground hover:bg-foreground/[0.06]"
            >
              Stop
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

/* ------------------------- Default export with sidebar -------------------- */

export default function Chat({ mode = "interview" as CoachMode }: { mode?: CoachMode }) {
  const [active, setActive] = useState<CoachMode>(mode);

  const getActiveIcon = () => {
    switch (active) {
      case "interview":
        return MessageSquare;
      case "resume":
        return FileText;
      case "cover_letter":
        return Mail;
      case "career":
        return Compass;
      default:
        return MessageSquare;
    }
  };
  const getActiveLabel = () => {
    switch (active) {
      case "interview":
        return "Interview Coach";
      case "resume":
        return "Resume Feedback";
      case "cover_letter":
        return "Cover Letter Help";
      case "career":
        return "Career Advice";
      default:
        return "Interview Coach";
    }
  };

  const ActiveIcon = getActiveIcon();

  return (
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
      <CoachSidebar active={active} onChange={setActive} />
      <section className="min-w-0 flex-1">
        <header className="mb-3 flex items-center gap-2">
          <ActiveIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h1 className="text-lg font-semibold text-foreground">{getActiveLabel()}</h1>
        </header>
        <InnerChat mode={active} />
      </section>
    </div>
  );
}