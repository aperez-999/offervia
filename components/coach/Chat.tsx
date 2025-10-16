"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { getBrowserSupabase } from "@/lib/supabase/client";
import type { CoachMode } from "./system-prompts";
import { SYSTEM_PROMPTS, MODE_LABELS } from "./system-prompts";
import MessageBubble from "./MessageBubble";
import ClearChatButton from "./ClearChatButton";
import { Bot, User, MessageSquare, FileText, Mail, Compass } from "lucide-react";

interface MsgRow {
  id: string;
  user_id: string;
  mode: CoachMode;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

type DayGroup = { label: string; items: MsgRow[] };

export default function Chat({ mode }: { mode: CoachMode }) {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }: { data: { user: any } }) => {
      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }
      setUserId(user.id);
      setLoading(true);
      supabase
        .from("messages")
        .select("id,user_id,mode,role,content,created_at")
        .eq("user_id", user.id)
        .eq("mode", mode)
        .order("created_at", { ascending: true })
        .then(({ data, error }: { data: any; error: any }) => {
          if (error) {
            toast({ title: "Failed to load chat", variant: "destructive" });
          } else if (data) {
            setMessages(data as MsgRow[]);
          }
          setLoading(false);
        });
    });
  }, [mode, supabase, toast]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    } else {
      scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, sending]);

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
      year: "numeric"
    });
  }

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

  async function send() {
    const content = input.trim();
    if (!content || !userId || sending) return;
    setSending(true);

    const optimisticUser: MsgRow = {
      id: `tmp_user_${Date.now()}`,
      user_id: userId,
      mode,
      role: "user",
      content,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setInput("");

    const { error: insertUserErr } = await supabase
      .from("messages")
      .insert({ user_id: userId, mode, role: "user", content });
    if (insertUserErr) {
      toast({ title: "Failed to send message", variant: "destructive" });
      setMessages((prev) => prev.filter((m) => m.id !== optimisticUser.id));
      setSending(false);
      return;
    }

    try {
      const system = { role: "system", content: SYSTEM_PROMPTS[mode] } as const;
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const payload = { mode, messages: [system, ...history, { role: "user", content }] };
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const reply: string = data?.content || "";

      const optimisticAssistant: MsgRow = {
        id: `tmp_assistant_${Date.now()}`,
        user_id: userId,
        mode,
        role: "assistant",
        content: reply || "(no reply)",
        created_at: new Date().toISOString()
      };
      setMessages((prev) => [...prev, optimisticAssistant]);

      const { error: insertAsstErr } = await supabase
        .from("messages")
        .insert({ user_id: userId, mode, role: "assistant", content: reply || "" });
      if (insertAsstErr) {
        toast({ title: "Failed to save reply", variant: "destructive" });
      }
    } catch {
      toast({ title: "AI is temporarily unavailable. Try again soon.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="flex h-[70vh] min-h-[420px] flex-col rounded-lg border bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-gray-900">{MODE_LABELS[mode]} Mode</CardTitle>
        <div className="text-sm text-gray-600">
          {SYSTEM_PROMPTS[mode].split(".")[0] + "."}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto" ref={listRef}>
        {loading ? (
          <div className="h-full grid place-items-center text-sm text-gray-600">
            Loading...
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full grid place-items-center text-center text-sm text-gray-600">
            <div>
              {mode === "interview" && (
                <>
                  <p className="mb-2">Get tailored help for interview prep and practice.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setInput("Help me prepare for a behavioral interview."); setTimeout(() => send(), 0); }}>
                      <MessageSquare className="h-4 w-4" /> Help me prepare for a behavioral interview.
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setInput("Ask me a mock interview question."); setTimeout(() => send(), 0); }}>
                      <MessageSquare className="h-4 w-4" /> Ask me a mock interview question.
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setInput("How do I explain a resume gap?"); setTimeout(() => send(), 0); }}>
                      <FileText className="h-4 w-4" /> How do I explain a resume gap?
                    </Button>
                  </div>
                </>
              )}

              {mode === "resume" && (
                <>
                  <p className="mb-2">Refine your resume bullets, structure, and impact.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setInput("Rewrite this bullet in STAR format."); setTimeout(() => send(), 0); }}>
                      <FileText className="h-4 w-4" /> Rewrite this bullet in STAR format.
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setInput("How do I list freelance experience?"); setTimeout(() => send(), 0); }}>
                      <FileText className="h-4 w-4" /> How do I list freelance experience?
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setInput("Fix grammar in this bullet."); setTimeout(() => send(), 0); }}>
                      <FileText className="h-4 w-4" /> Fix grammar in this bullet.
                    </Button>
                  </div>
                </>
              )}

              {mode === "cover_letter" && (
                <>
                  <p className="mb-2">Craft personalized and engaging cover letters.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setInput("Write a cover letter intro."); setTimeout(() => send(), 0); }}>
                      <Mail className="h-4 w-4" /> Write a cover letter intro.
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setInput("Explain why I want to join this company."); setTimeout(() => send(), 0); }}>
                      <Mail className="h-4 w-4" /> Explain why I want to join this company.
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setInput("Improve this paragraph."); setTimeout(() => send(), 0); }}>
                      <Mail className="h-4 w-4" /> Improve this paragraph.
                    </Button>
                  </div>
                </>
              )}

              {mode === "career" && (
                <>
                  <p className="mb-2">Career strategy, growth, and decision support.</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setInput("How do I choose between two job offers?"); setTimeout(() => send(), 0); }}>
                      <Compass className="h-4 w-4" /> How do I choose between two job offers?
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setInput("Help me plan a promotion roadmap."); setTimeout(() => send(), 0); }}>
                      <Compass className="h-4 w-4" /> Help me plan a promotion roadmap.
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setInput("How do I negotiate salary?"); setTimeout(() => send(), 0); }}>
                      <Compass className="h-4 w-4" /> How do I negotiate salary?
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
                <div className="sticky top-0 z-10 mx-auto w-fit rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600">
                  {group.label}
                </div>
                {group.items.map((m) => (
                  <div key={m.id} className="flex items-start gap-2">
                    {m.role === "assistant" ? (
                      <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                    ) : (
                      <User className="h-5 w-5 text-gray-600 mt-0.5 ml-auto order-2" />
                    )}
                    <div className="flex-1">
                      <MessageBubble role={m.role} content={m.content} />
                      <div
                        className={
                          "mt-1 text-[11px] text-gray-500 " +
                          (m.role === "user" ? "text-right" : "text-left")
                        }
                      >
                        {formatTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
            {sending && (
              <div className="flex items-start gap-2">
                <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="mb-1 text-xs text-gray-500">Coach</div>
                  <div className="inline-block max-w-[85%] rounded-xl px-3 py-2 text-sm border border-gray-200 bg-blue-50 text-gray-700 animate-pulse">
                    Coach is typing…
                  </div>
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <ClearChatButton
          disabled={!userId || loading || messages.length === 0}
          onConfirm={async () => {
            if (!userId) return;
            const { error } = await supabase
              .from("messages")
              .delete()
              .eq("user_id", userId)
              .eq("mode", mode);
            if (!error) {
              setMessages([]);
              toast({ title: "Conversation cleared" });
            } else {
              toast({ title: "Failed to clear", variant: "destructive" });
            }
          }}
        />
        <div className="flex items-center gap-2 flex-1">
          <Textarea
            placeholder={userId ? "Type your message..." : "Sign in to chat"}
            className="min-h-[44px]"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!userId || loading || sending}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
          />
          <Button onClick={send} disabled={!userId || loading || sending || !input.trim()}>
            {sending ? "Sending..." : "Send"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}