/**
 * Learning, practice, and career resources for the Student Hub.
 *
 * `free: true` means there's a real free tier you can keep using, not a
 * trial. `verified: true` means the listing is the organization's own site.
 * Run `npm run check:links` after editing.
 */

export type Resource = {
  id: string;
  title: string;
  desc: string;
  url: string;
  category: "Learning" | "Practice" | "Tools" | "Career";
  tags: string[];
  free?: boolean;
  verified?: boolean;
};

export const CATALOG: Resource[] = [
  // Learning
  {
    id: "khan-academy",
    title: "Khan Academy",
    desc: "Free lessons and practice in math, science, economics, and computing. Good for brushing up before a technical screen.",
    url: "https://www.khanacademy.org/",
    category: "Learning",
    tags: ["math", "science", "foundations"],
    free: true,
    verified: true,
  },
  {
    id: "mitocw",
    title: "MIT OpenCourseWare",
    desc: "Lecture notes, problem sets, and videos from real MIT courses, free to use.",
    url: "https://ocw.mit.edu/",
    category: "Learning",
    tags: ["engineering", "science", "economics"],
    free: true,
    verified: true,
  },
  {
    id: "freecodecamp",
    title: "freeCodeCamp",
    desc: "Free coding curriculum with projects you can put on a resume, from web basics to data analysis.",
    url: "https://www.freecodecamp.org/",
    category: "Learning",
    tags: ["coding", "projects", "certificates"],
    free: true,
    verified: true,
  },
  {
    id: "edx",
    title: "edX",
    desc: "Courses from universities like MIT and Harvard. Most can be audited for free; certificates cost extra.",
    url: "https://www.edx.org/",
    category: "Learning",
    tags: ["online learning", "certificates", "university"],
    free: true,
    verified: true,
  },
  {
    id: "coursera",
    title: "Coursera",
    desc: "University and industry courses in data, business, health, and more. Many can be audited free; check whether your school gives you full access.",
    url: "https://www.coursera.org/",
    category: "Learning",
    tags: ["online courses", "certificates", "university"],
    verified: true,
  },
  {
    id: "linkedin-learning",
    title: "LinkedIn Learning",
    desc: "Short courses on software, business, and creative skills. Many universities and public libraries give free access, so check yours before paying.",
    url: "https://www.linkedin.com/learning/",
    category: "Learning",
    tags: ["skills", "certificates", "library"],
    verified: true,
  },

  // Practice
  {
    id: "leetcode",
    title: "LeetCode",
    desc: "Coding interview practice. The free problem set covers most of what new-grad interviews ask.",
    url: "https://leetcode.com/",
    category: "Practice",
    tags: ["coding interview", "algorithms"],
    free: true,
    verified: true,
  },
  {
    id: "quizlet",
    title: "Quizlet",
    desc: "Flashcards and practice tests. Handy for certification exams and industry terms you keep forgetting.",
    url: "https://quizlet.com/",
    category: "Practice",
    tags: ["study", "flashcards", "certifications"],
    free: true,
  },
  {
    id: "magoosh",
    title: "Magoosh",
    desc: "Prep courses for the GRE, GMAT, LSAT, and MCAT if grad school is part of the plan.",
    url: "https://magoosh.com/",
    category: "Practice",
    tags: ["test prep", "graduate school"],
  },

  // Tools
  {
    id: "grammarly",
    title: "Grammarly",
    desc: "Catches typos and awkward sentences in emails, cover letters, and applications. The free version is enough for most people.",
    url: "https://www.grammarly.com/",
    category: "Tools",
    tags: ["writing", "proofreading"],
    free: true,
  },
  {
    id: "canva",
    title: "Canva",
    desc: "Templates for slides, posters, and portfolio pieces. Keep your actual resume simple so applicant tracking systems can read it.",
    url: "https://www.canva.com/",
    category: "Tools",
    tags: ["design", "portfolio", "presentation"],
    free: true,
  },
  {
    id: "figma",
    title: "Figma",
    desc: "Design and prototyping tool, free to start. Students can get the paid features through Figma for Education.",
    url: "https://www.figma.com/",
    category: "Tools",
    tags: ["design", "ux", "prototyping"],
    free: true,
  },
  {
    id: "lucidchart",
    title: "Lucidchart",
    desc: "Flowcharts and diagrams for projects and case interviews, with free education accounts.",
    url: "https://lucid.co/lucidchart/use-cases/education",
    category: "Tools",
    tags: ["diagrams", "education"],
    free: true,
  },
  {
    id: "zotero",
    title: "Zotero",
    desc: "Free reference manager for papers, theses, and research projects.",
    url: "https://www.zotero.org/",
    category: "Tools",
    tags: ["citations", "research", "academic"],
    free: true,
    verified: true,
  },

  // Career
  {
    id: "handshake",
    title: "Handshake",
    desc: "Internships and entry-level jobs from employers that recruit at your school, plus career fair listings.",
    url: "https://joinhandshake.com/",
    category: "Career",
    tags: ["internships", "jobs", "career fairs"],
    free: true,
    verified: true,
  },
  {
    id: "bls-ooh",
    title: "Occupational Outlook Handbook",
    desc: "The U.S. Bureau of Labor Statistics guide to what a job involves, what it pays, and whether it's growing.",
    url: "https://www.bls.gov/ooh/",
    category: "Career",
    tags: ["salary", "career paths", "government"],
    free: true,
    verified: true,
  },
  {
    id: "careerone",
    title: "CareerOneStop",
    desc: "U.S. Department of Labor site with job search help, salary lookups, and local training programs.",
    url: "https://www.careeronestop.org/",
    category: "Career",
    tags: ["salary", "training", "government"],
    free: true,
    verified: true,
  },
  {
    id: "levels-fyi",
    title: "Levels.fyi",
    desc: "Real salary and offer data shared by employees, mostly in tech. Look here before you negotiate.",
    url: "https://www.levels.fyi/",
    category: "Career",
    tags: ["salary", "negotiation", "offers"],
    free: true,
  },
  {
    id: "goinglobal",
    title: "GoinGlobal",
    desc: "Country guides for working abroad, including visa basics and local job sites. Many universities include access.",
    url: "https://goinglobal.com/",
    category: "Career",
    tags: ["international", "visas", "abroad"],
  },
];

export const CATEGORIES = ["All", "Learning", "Practice", "Tools", "Career"] as const;
