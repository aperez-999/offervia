---
name: Offervia
colors:
  light:
    background: "oklch(0.962 0.008 335)"
    card: "oklch(0.985 0.004 335)"
    foreground: "oklch(0.25 0.03 330)"
    primary: "oklch(0.40 0.11 337)"
    highlight: "oklch(0.91 0.18 119)"
    highlight-foreground: "oklch(0.27 0.05 125)"
    muted-foreground: "oklch(0.47 0.03 332)"
    border: "oklch(0.88 0.016 335)"
  dark:
    background: "oklch(0.225 0.02 330)"
    card: "oklch(0.265 0.024 330)"
    foreground: "oklch(0.94 0.01 330)"
    primary: "oklch(0.83 0.075 337)"
    highlight: "oklch(0.875 0.18 120)"
    highlight-foreground: "oklch(0.25 0.05 125)"
    muted-foreground: "oklch(0.75 0.025 330)"
    border: "oklch(0.37 0.025 330)"
typography:
  display: "Bricolage Grotesque (variable, opsz)"
  body: "Atkinson Hyperlegible Next"
  mono: "Geist Mono (code only)"
radius: "0.75rem base"
motion:
  ease: "cubic-bezier(0.22, 1, 0.36, 1) (ease-out-quint)"
  app-duration: "150-250ms"
icons: "Phosphor. Regular weight in the app; duotone in nav and on the landing page; fill for the active nav item"
---

# Design System: Offervia

## 1. Overview

Plum ink on a faintly plum-tinted page, with a lime highlighter. The idea comes from the product itself: the scanner literally highlights the keywords your resume matches. The app is calm and readable. The landing page is louder, with bigger display type and real previews of the app.

All tokens live in `app/globals.css` and are exposed to Tailwind through `@theme inline`. Components use token classes (`bg-card`, `text-primary`, `bg-highlight`), never raw palette classes. The one exception is the printed resume paper in `components/resume/TailoredResumeDocument.tsx`, which stays white like real paper.

## 2. Colors

### Primary
Plum ink, `#6B2D5C` in light mode. Used for primary actions, links, focus rings, and the active nav item. In dark mode it becomes a soft plum (`#E7B6D9`), and filled buttons switch to dark text.

### Highlight
Marker lime, `#D7F25A`. Used only to mark meaning: matched keywords, wins, the current item, and one word in the hero. Text on it always uses `--highlight-foreground` (a dark olive). Plain ink on the highlighter fails contrast in dark mode.

### Reward
For offers and top scores. Olive in light mode so it reads as text; lime in dark mode.

### Neutral
Page `--background`, raised `--card`, deeper `--sidebar`. Every neutral is tinted toward plum (hue ~335), so nothing is pure white or pure black.

### Rules
- **One highlight per idea.** If you're about to highlight a second thing in the same view, ask which one matters.
- **No raw palette classes.** Use `warning` and `info`, not `amber-500` and `blue-600`.

## 3. Typography

Bricolage Grotesque is for headings only: `h1`–`h3` pick it up automatically from the base layer. Atkinson Hyperlegible Next handles everything else, including UI, labels, body, and numbers (use `tabular-nums` for data).

### Hierarchy
- Landing hero: `clamp(2.5rem, 6vw, 4.75rem)`, weight 700, tracking -0.03em
- Page title (app): `text-2xl`/`text-3xl`, weight 600
- Section title: `text-lg`, weight 600
- Body: `text-sm`/`text-base`, line length capped at about 70ch

## 4. Elevation

Mostly flat. Cards use a 1px border and at most `shadow-sm`. Hover lift (`.card-hover`) is a 1px translate plus a soft plum-tinted shadow. Popovers and dialogs sit on `--overlay`.

## 5. Components

### Buttons
`components/ui/button.tsx`. The default is a plum fill with `--primary-button-foreground`. Every button has hover, focus-visible ring, active, disabled, and loading states.

### Highlighter
- `.hl`: marker swipe that animates in (420ms, ease-out-quint). Set `--hl-delay` to stagger.
- `.hl-static`: no animation (lists, frequently re-rendered UI).
- `.hl-soft`: a lighter mark for small text and chips.

### Navigation
Six sections in the sidebar (from `lib/nav.ts`) on `--sidebar`, with Phosphor duotone icons and the active one filled on `--sidebar-accent`. Sections with more than one page get a tab bar (`components/layout/SectionTabs.tsx`).

### Brand panels
One full-bleed brand moment per screen. `--drench` (plum) is used for the Student Hub band and the sign-up panel. The sign-in panel uses `--highlight` with plum ink.

### Cards
Use them only when grouping really helps. Never nest cards. Don't build grids of identical icon + heading + text cards.

## 6. Motion

- App: state changes only, 150–250ms, ease-out-quint.
- Landing: one staged hero entrance, then reveals suited to each section.
- Reduced motion: the global rule in `globals.css` ends animations instantly. Content is always visible without them.
- Never bounce, never elastic.
