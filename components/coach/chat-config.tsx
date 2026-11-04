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
  { label: string; icon: LucideIcon; subtitle: string; intro: string; prompts: StarterPrompt[] }
> = {
  interview: {
    label: "Interview practice",
    icon: MessageSquare,
    subtitle: "Practice answers you could say out loud in an interview.",
    intro: "Ask for a practice question, or paste an answer you want feedback on.",
    prompts: [
      { icon: MessageSquare, text: "Help me prepare for a behavioral interview." },
      { icon: MessageSquare, text: "Ask me a mock interview question." },
      { icon: FileText, text: "How do I explain a resume gap?" },
    ],
  },
  resume: {
    label: "Resume feedback",
    icon: FileText,
    subtitle: "Feedback on resume bullets, structure, and wording.",
    intro: "Paste a bullet or section and ask how to make it clearer.",
    prompts: [
      { icon: FileText, text: "Rewrite this bullet to show the result." },
      { icon: FileText, text: "How do I list freelance experience?" },
      { icon: FileText, text: "Fix grammar in this bullet." },
    ],
  },
  cover_letter: {
    label: "Cover letter help",
    icon: Mail,
    subtitle: "Help with openings, examples, and closings.",
    intro: "Paste a paragraph that sounds generic, or ask for help with an opening.",
    prompts: [
      { icon: Mail, text: "Write a cover letter intro." },
      { icon: Mail, text: "Explain why I want to join this company." },
      { icon: Mail, text: "Improve this paragraph." },
    ],
  },
  career: {
    label: "Career advice",
    icon: Compass,
    subtitle: "Offers, negotiation, promotions, and next moves.",
    intro: "Talk through an offer, a move, or a raise.",
    prompts: [
      { icon: Compass, text: "How do I choose between two job offers?" },
      { icon: Compass, text: "What should I do to get promoted this year?" },
      { icon: Compass, text: "How do I negotiate salary?" },
    ],
  },
};
