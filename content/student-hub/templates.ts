/** --------------------
 * Template data
 * Supports variables: {{name}}, {{role}}, {{company}}, {{contact}}, {{portfolio}}
 * -------------------- */
export type TemplateCategory =
  | "Outreach"
  | "Follow-up"
  | "Thank you"
  | "Referral"
  | "Negotiation"
  | "Ghosting"
  | "Recruiter";

export type TemplateItem = {
  key: string;
  title: string;
  category: TemplateCategory;
  tags: string[];
  body: string;
};

export const TEMPLATES: TemplateItem[] = [
  {
    key: "outreach_cold_manager",
    title: "Cold outreach to hiring manager",
    category: "Outreach",
    tags: ["linkedin", "intro", "short"],
    body: `Hi {{contact}},

I'm {{name}}, a {{role}}. I'm reaching out because [one specific thing about your team's work at {{company}}]. I'd like to learn more about the team and where someone with my background could help. My portfolio: {{portfolio}}.

Would you have 15 minutes for a call this week or next?

Best,
{{name}}`,
  },
  {
    key: "follow_up_1wk",
    title: "Application follow-up (1 week)",
    category: "Follow-up",
    tags: ["status", "polite"],
    body: `Hi {{contact}},

I applied for the {{role}} role at {{company}} last week and wanted to check where things stand. I'm still interested, and I'm happy to send anything else that would help.

Thanks,
{{name}}`,
  },
  {
    key: "thanks_after_interview",
    title: "Thank-you after interview",
    category: "Thank you",
    tags: ["gratitude", "brief"],
    body: `Hi {{contact}},

Thanks for talking with me about the {{role}} role. I enjoyed hearing about [something specific they mentioned], and it made me more interested in the work at {{company}}.

Let me know if you need anything else from me.

Best,
{{name}}`,
  },
  {
    key: "referral_warm",
    title: "Referral request (warm)",
    category: "Referral",
    tags: ["network", "linkedin"],
    body: `Hi {{contact}},

Hope you've been well. I'm applying for a {{role}} role at {{company}} and saw that you work there. Would you be comfortable referring me? My portfolio is here: {{portfolio}}, and I can send my resume.

No worries if not. Thanks either way.

{{name}}`,
  },
  {
    key: "negotiation_opener",
    title: "Negotiation opener",
    category: "Negotiation",
    tags: ["comp", "offer"],
    body: `Hi {{contact}},

Thank you for the offer for the {{role}} role at {{company}}. I want to make this work. Based on the scope of the role and what I'm seeing for similar positions, is there room on the base salary or a signing bonus?

Thanks for considering it,
{{name}}`,
  },
  {
    key: "ghosting_nudge",
    title: "Polite nudge after silence",
    category: "Ghosting",
    tags: ["nudge", "status"],
    body: `Hi {{contact}},

I'm following up on the {{role}} process at {{company}}. Is there any update you can share on timing? I'm still interested in the role.

Thanks,
{{name}}`,
  },
  {
    key: "recruiter_reply_inbound",
    title: "Reply to inbound recruiter",
    category: "Recruiter",
    tags: ["inbound", "screen"],
    body: `Hi {{contact}},

Thanks for reaching out. I'd like to hear more about the {{role}} role at {{company}}. My portfolio is here: {{portfolio}}, and I can send a resume too.

Do you have time for a short call this week?

Best,
{{name}}`,
  },

  /** NEW #1 — Follow-up after onsite */
  {
    key: "follow_up_onsite_48h",
    title: "Follow-up after onsite (24–48h)",
    category: "Follow-up",
    tags: ["onsite", "thanks", "timeline"],
    body: `Hi {{contact}},

Thanks for setting up my onsite for the {{role}} role at {{company}}. I enjoyed meeting the team and hearing about [a problem they're working on].

When you have a moment, could you share the timeline for next steps? I'm happy to send anything else you need.

Thanks,
{{name}}`,
  },

  /** NEW #2 — Reschedule interview */
  {
    key: "reschedule_interview_conflict",
    title: "Reschedule interview (conflict)",
    category: "Recruiter",
    tags: ["scheduling", "polite", "conflict"],
    body: `Hi {{contact}},

I'm looking forward to the {{role}} interview with {{company}}, but a conflict has come up at the scheduled time. Could we move it?

These times work for me:
• [Option 1]
• [Option 2]
• [Option 3]

Sorry for the change, and thanks for working with me on it.

Best,
{{name}}`,
  },
];

/** What an unfilled variable shows as, so a copied email still says what goes where. */
export const TEMPLATE_PLACEHOLDERS: Record<string, string> = {
  name: "[your name]",
  role: "[role]",
  company: "[company]",
  contact: "[their name]",
  portfolio: "[portfolio link]",
};

/** Fill {{variables}} from the quick-fill fields. Blank ones become readable placeholders. */
export function renderTemplate(raw: string, vars: Record<string, string | undefined>) {
  return raw.replace(/\{\{(\w+)\}\}/g, (_, k: string) => {
    const value = vars[k]?.trim();
    return value || TEMPLATE_PLACEHOLDERS[k] || `[${k}]`;
  });
}
