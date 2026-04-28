"use client";

import type { LucideIcon } from "lucide-react";
import {
  Compass,
  FileText,
  Mail,
  MessageSquare,
} from "lucide-react";
import type { CoachMode } from "./system-prompts";

export type StarterPrompt = {
  icon: LucideIcon;
  text: string;
};

export const COACH_MODE_META: Record<
  CoachMode,
  { label: string; icon: LucideIcon; intro: string; prompts: StarterPrompt[] }
> = {
  interview: {
    label: "Interview Coach",
    icon: MessageSquare,
    intro: "Start with a focused prompt and build a stronger interview story from there.",
    prompts: [
      { icon: MessageSquare, text: "Help me prepare for a behavioral interview." },
      { icon: MessageSquare, text: "Ask me a mock interview question." },
      { icon: FileText, text: "How do I explain a resume gap?" },
    ],
  },
  resume: {
    label: "Resume Feedback",
    icon: FileText,
    intro: "Refine bullets, clarify impact, or pressure-test how your experience reads.",
    prompts: [
      { icon: FileText, text: "Rewrite this bullet in STAR format." },
      { icon: FileText, text: "How do I list freelance experience?" },
      { icon: FileText, text: "Fix grammar in this bullet." },
    ],
  },
  cover_letter: {
    label: "Cover Letter Help",
    icon: Mail,
    intro: "Draft sharper cover letter language and improve the parts that feel generic.",
    prompts: [
      { icon: Mail, text: "Write a cover letter intro." },
      { icon: Mail, text: "Explain why I want to join this company." },
      { icon: Mail, text: "Improve this paragraph." },
    ],
  },
  career: {
    label: "Career Advice",
    icon: Compass,
    intro: "Use the coach for decision-making, planning, and quick career tradeoff checks.",
    prompts: [
      { icon: Compass, text: "How do I choose between two job offers?" },
      { icon: Compass, text: "Help me plan a promotion roadmap." },
      { icon: Compass, text: "How do I negotiate salary?" },
    ],
  },
};
