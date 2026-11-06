/**
 * Student discounts shown in the Student Hub and previewed on the landing page.
 *
 * To suggest one, open an issue or a pull request on GitHub. Link to the
 * vendor's own student page, never an affiliate or coupon site, and describe
 * what a student actually gets today. Run `npm run check:links` after editing.
 */

export type Deal = {
  id: string;
  vendor: string;
  title: string;
  desc: string;
  url: string;
  category: "Dev Tools" | "Productivity" | "Cloud" | "Design" | "Engineering" | "STEM Tools";
  /** Needs a school email or proof of enrollment. */
  requiresEdu?: boolean;
  /** 100 means free while you're a student. */
  percentOff?: number;
};

export const DEALS: Deal[] = [
  {
    id: "github-student-pack",
    vendor: "GitHub",
    title: "Student Developer Pack",
    desc: "GitHub Pro and Copilot, plus free credits and plans from dozens of developer tools. The best single deal on this list if you write any code.",
    url: "https://education.github.com/pack",
    category: "Dev Tools",
    requiresEdu: true,
    percentOff: 100,
  },
  {
    id: "jetbrains-edu",
    vendor: "JetBrains",
    title: "JetBrains Student Pack",
    desc: "Every JetBrains IDE, including IntelliJ IDEA, PyCharm, and WebStorm, free for as long as you're a student.",
    url: "https://www.jetbrains.com/academy/student-pack/",
    category: "Dev Tools",
    requiresEdu: true,
    percentOff: 100,
  },
  {
    id: "notion-student",
    vendor: "Notion",
    title: "Notion for Education",
    desc: "Notion's Plus plan, free with a school email. Good for class notes, project plans, and a job search board.",
    url: "https://www.notion.so/product/notion-for-education",
    category: "Productivity",
    requiresEdu: true,
    percentOff: 100,
  },
  {
    id: "figma-edu",
    vendor: "Figma",
    title: "Figma for Education",
    desc: "Figma's paid features at no cost for verified students. Useful for portfolio pieces and design coursework.",
    url: "https://www.figma.com/education/",
    category: "Design",
    requiresEdu: true,
    percentOff: 100,
  },
  {
    id: "microsoft-azure-student",
    vendor: "Microsoft Azure",
    title: "Azure for Students",
    desc: "Cloud credit and a set of free services for students, with no credit card at sign-up.",
    url: "https://azure.microsoft.com/en-us/free/students/",
    category: "Cloud",
    requiresEdu: true,
    percentOff: 100,
  },
  {
    id: "google-cloud-student",
    vendor: "Google Cloud",
    title: "Google Cloud for Students",
    desc: "Free training paths and student credit programs. Check the page for what's open right now; offers change during the year.",
    url: "https://cloud.google.com/edu/students",
    category: "Cloud",
    requiresEdu: true,
  },
  {
    id: "autodesk-edu",
    vendor: "Autodesk",
    title: "Autodesk Education Access",
    desc: "AutoCAD, Fusion, Revit, Maya, and other Autodesk software, free for eligible students and educators.",
    url: "https://www.autodesk.com/education/edu-software/overview",
    category: "Engineering",
    requiresEdu: true,
    percentOff: 100,
  },
  {
    id: "canva-edu",
    vendor: "Canva",
    title: "Canva for Education",
    desc: "Free for K–12 teachers and their students. College students can still make clean resumes and slides on Canva's free plan.",
    url: "https://www.canva.com/education/",
    category: "Design",
    requiresEdu: true,
  },
  {
    id: "wolfram-alpha",
    vendor: "Wolfram Alpha",
    title: "Wolfram Alpha Pro for Students",
    desc: "Step-by-step solutions for math, physics, and chemistry, at a lower student price.",
    url: "https://www.wolframalpha.com/pro/",
    category: "STEM Tools",
  },
];

export const CATS = [
  "All",
  "Dev Tools",
  "Productivity",
  "Cloud",
  "Design",
  "Engineering",
  "STEM Tools",
] as const;
