# Design System: "Pop-Art Ticket"

A white-based, high-contrast, poster/carnival-ticket aesthetic. Hard black outlines, flat offset "stamped" shadows (no blur), and bursts of red, hot pink, and yellow carry the energy — no gradients, no glows, no soft grey SaaS shadows.

Use this document as the single source of truth for any new page, component, or feature in this style. If a rule below isn't covered, default to the _principles_ section rather than inventing something generic.

---

## 1. Color

```css
:root {
  /* Base */
  --paper: #ffffff; /* primary background */
  --warm: #fffbf7; /* alternate section background, slightly warm off-white */
  --ink: #171310; /* text, outlines, borders — a true warm-black, never pure #000 or a tinted grey-black */

  /* Accents */
  --red: #ff3b30; /* primary — CTAs, prices, key emphasis */
  --pink: #ff2d78; /* secondary — tags, highlights, hover accents */
  --yellow: #ffd400; /* tertiary — badges, bursts, secondary buttons */

  /* Optional tints (derived, use sparingly for backgrounds only) */
  --pink-tint: #fff0f5; /* light pink section/card background */
  --yellow-tint: #fffae0; /* light yellow section/card background */
}
```

**Usage rules:**

- `--paper` is the default background. `--warm` is used to alternate sections so they don't blend together — never use both on adjacent sections.
- `--red` is reserved for primary actions and prices/values. Don't dilute it by using it for decoration.
- `--pink` is for tags, secondary emphasis, and hover states.
- `--yellow` is for badges, bursts, and secondary buttons — it should never carry body text on top of it without checking contrast (pair yellow backgrounds with `--ink` text, not white).
- Never introduce navy, purple, or dark-blue-adjacent hues. If a "cooler" accent is ever needed, reach for teal or green before blue/purple.
- Text is always `--ink` on light backgrounds, or `#FFFFFF` on `--red`/`--ink` backgrounds.

---

## 2. Typography

```css
/* Google Fonts import */
@import url("https://fonts.googleapis.com/css2?family=Anton&family=DM+Sans:wght@400;500;700;900&display=swap");

--font-display:
  "Anton", sans-serif; /* headlines, prices, big numbers — always uppercase */
--font-body:
  "DM Sans", sans-serif; /* everything else: body copy, nav, buttons, labels */
```

**Type scale (desktop → mobile):**

| Role                | Font    | Size (desktop) | Size (mobile) | Weight                       | Notes                               |
| ------------------- | ------- | -------------- | ------------- | ---------------------------- | ----------------------------------- |
| Hero H1             | display | 4.4rem         | 2.8rem        | 400 (Anton is single-weight) | line-height 0.98, uppercase         |
| Section H2          | display | 2.6rem         | 2rem          | 400                          | uppercase                           |
| Card / stub H3      | display | 2rem           | 1.6rem        | 400                          | uppercase                           |
| Big price/number    | display | 2.4–2.8rem     | 1.8–2rem      | 400                          | color `--red` or `--ink`            |
| Body / lede         | body    | 1.15rem        | 1rem          | 500                          | line-height 1.55                    |
| Small meta/labels   | body    | 0.85–0.9rem    | same          | 700                          | sentence case, not tracked-out caps |
| Nav links / buttons | body    | 0.9–1rem       | same          | 700                          |                                     |

**Rules:**

- `--font-display` (Anton) is _always_ uppercase — that's the one place uppercase is used deliberately, because it's a condensed poster face designed for it. Do not additionally apply uppercase or letter-spacing to body/UI labels — that reads as generic AI template chrome.
- Never use more than these two font families.
- Don't accent a single word in a headline with bold/italic — if a word needs color emphasis (like "lucky" in the hero), give it a real treatment: a flat accent color plus an outline (`-webkit-text-stroke`), not just a color swap.

---

## 3. Spacing & Layout

```css
--container-max: 1180px;
--container-pad: 32px; /* horizontal padding on .wrap, drops to 20px under 480px */

--section-pad-y: 100px; /* vertical padding for full sections, drops to 64px on mobile */
--gap-lg: 48px;
--gap-md: 28px;
--gap-sm: 16px;
```

- Content wrapper: `max-width: var(--container-max); margin: 0 auto; padding: 0 var(--container-pad);`
- Sections alternate `--paper` / `--warm` backgrounds to create rhythm without needing dividers.
- Grid layouts (hero, steps, stub) use CSS Grid, not flex, when columns need to align. Flex is for horizontal scroll rows (winners strip) and inline groups (button rows, nav).
- Breakpoint: **800–900px** is the single mobile breakpoint used throughout (collapses grids to 1 column, hides nav links). Don't add extra breakpoints unless a specific component needs one.

---

## 4. Borders, Shadows & the "Stamped" Signature

This is the core visual signature of the system — reuse it on every new interactive or card element.

```css
--border-width: 3px;
--border-color: var(--ink);

/* Hard offset shadow, no blur — the "stamped" look */
--shadow-sm: 3px 3px 0 var(--ink);
--shadow-md: 5px 5px 0 var(--ink);
--shadow-lg: 6px 6px 0 var(--ink);
--shadow-xl: 8px 8px 0 var(--ink);

.stamped {
  border: var(--border-width) solid var(--border-color);
  box-shadow: var(--shadow-lg);
}
```

**Rules:**

- Never use a soft/blurred `box-shadow` (e.g. `rgba(0,0,0,0.1)` with blur) anywhere in this system — that's the generic SaaS-card look this design deliberately avoids.
- Shadows are always flat black (`var(--ink)`), offset only, no blur radius. A shadow can use a color other than `--ink` for special emphasis (see the featured-draw stub, which uses a pink shadow), but this should be rare — one accent-color shadow per page, max.
- Borders are always `3px solid var(--ink)` (occasionally `4px` for a hero focal element like the starburst). Never use a 1px hairline border in this system.

---

## 5. Buttons

```css
.btn {
  font-weight: 700;
  font-size: 1rem;
  padding: 16px 30px;
  border: var(--border-width) solid var(--ink);
  box-shadow: var(--shadow-md);
  transition:
    transform 0.12s,
    box-shadow 0.12s;
  display: inline-block;
}

.btn:hover {
  transform: translate(3px, 3px);
  box-shadow: 2px 2px 0 var(--ink); /* shadow "compresses" as button moves toward it */
}

.btn-red {
  background: var(--red);
  color: #ffffff;
}
.btn-yellow {
  background: var(--yellow);
  color: var(--ink);
}
.btn-outline {
  background: var(--paper);
  color: var(--ink);
}
```

**The interaction pattern (this is the animation you liked):** on hover, the element physically moves toward its own shadow (`translate(3px, 3px)`) while the shadow itself shrinks (`8px 8px` → `2px 2px` or similar ratio). It should look like the button is being pressed down onto the page. Always pair a `box-shadow` change with a matching `transform: translate()` — moving one without the other breaks the illusion.

Never use this hover pattern with border-radius/pill buttons — it's built for hard-edged shapes only. No rounded corners anywhere in this system except perfect circles (badges, winner avatars).

---

## 6. Signature Components (patterns, not just CSS)

These are the recurring _shapes of information_, not just style — reuse the concept even if content changes.

- **Starburst badge** — a jagged star shape (`clip-path: polygon(...)`) used once per page for the single most important number (jackpot amount, biggest prize). Gently wiggles (`rotate(-3deg)` to `rotate(3deg)`, ease-in-out, ~5s loop). Only ever one per page — it's the "spend your boldness in one place" element.
- **Raffle stub** — the featured item/prize card, styled like a physical ticket: two-column layout split by a dotted "perforation" (`radial-gradient` dots or a dashed border), diagonal hatch pattern as a background texture on one side.
- **Torn-paper step cards** — sequence steps (only use numbered steps for content that's genuinely sequential) shown as slightly-rotated sticky-note-like cards, alternating tint backgrounds (`--warm`, `--pink-tint`, `--yellow-tint`).
- **Color-blob hero background** — 2–3 large soft-edged circles in accent colors, layered behind hero content at low z-index, one large (yellow), one medium (pink), one small/faint (red) for depth.
- **Circular avatar tiles** — used for winners/testimonials, a solid accent-color circle with a short label inside, never a photo placeholder box.

---

## 7. Motion Principles

- One deliberate animated moment per page (the starburst wiggle). Don't add scroll-triggered fade-ins on every section — that's generic AI-template motion.
- A hero carousel may auto-advance if the top-of-page story needs motion, but keep it confined to the hero and use the same snappy slide timing as the button hover states. Avoid adding more ambient animation anywhere else on the page.
- Hover states are functional, not decorative: buttons press down (see §5), links may shift color but shouldn't move.
- All transitions are fast and snappy: `0.12s`–`0.15s` ease. Nothing should feel slow or floaty in this system — the brand voice is energetic, not elegant.

---

## 8. Voice & Copy

- Sentence case everywhere except the display font (which is visually uppercase by nature of the typeface, not because labels are tracked-out caps).
- Active, plain language: "Get your entry," "Watch it live" — not "Submit" or "Learn More."
- No em-dash-joined labels, no middle-dot meta strings, no tracked-out eyebrow labels. Small kicker labels (e.g. "The process," "Featured draw") are simple sentence-case phrases in `--pink`, not decorated.
- Numbers and prices are always set in the display font for weight and excitement.

---

## 9. Full Token Reference (copy-paste)

```css
:root {
  /* Color */
  --paper: #ffffff;
  --warm: #fffbf7;
  --ink: #171310;
  --red: #ff3b30;
  --pink: #ff2d78;
  --yellow: #ffd400;
  --pink-tint: #fff0f5;
  --yellow-tint: #fffae0;

  /* Type */
  --font-display: "Anton", sans-serif;
  --font-body: "DM Sans", sans-serif;

  /* Layout */
  --container-max: 1180px;
  --container-pad: 32px;
  --section-pad-y: 100px;
  --gap-lg: 48px;
  --gap-md: 28px;
  --gap-sm: 16px;

  /* Borders & shadows */
  --border-width: 3px;
  --border-color: var(--ink);
  --shadow-sm: 3px 3px 0 var(--ink);
  --shadow-md: 5px 5px 0 var(--ink);
  --shadow-lg: 6px 6px 0 var(--ink);
  --shadow-xl: 8px 8px 0 var(--ink);

  /* Motion */
  --transition-fast: 0.12s ease;
  --transition-med: 0.15s ease;
}
```

---

## 10. Scroll-aware navigation

The header is transparent at the top of the page and fades to a solid `--paper` background with an `--ink` bottom border as the user scrolls, with the fade tied to scroll _progress_ (not a hard toggle at a threshold).

- Fade distance: 120px of scroll completes the transition.
- Both `background-color` and `border-bottom-color` interpolate together from `rgba(255,255,255,0)` → `rgba(255,255,255,1)` and `rgba(23,19,16,0)` → `rgba(23,19,16,1)` respectively, driven by the same 0–1 progress value.
- Throttle the scroll listener with `requestAnimationFrame` and register it with `{ passive: true }`.
- Rule of thumb for implementation: anything that's a _continuously computed_ value (scroll-driven opacity, drag position, etc.) is set via inline style / direct DOM manipulation, not a utility class — utility classes are for discrete, static states.
- If nav content (logo, links) is dark-on-transparent and the hero behind it is also light, either give the nav text a light variant while transparent (crossfade two logo/text treatments), or ensure the hero content directly under the nav has enough contrast regardless of scroll state.

**Reference implementation (React + Tailwind + TypeScript):**

```ts
// hooks/useScrollProgress.ts
import { useEffect, useState } from "react";

export function useScrollProgress(fadeDistance = 120): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let ticking = false;
    const update = () => {
      setProgress(Math.min(window.scrollY / fadeDistance, 1));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [fadeDistance]);
  return progress;
}
```

```tsx
// components/Navbar.tsx
const progress = useScrollProgress(120)

<nav
  className="sticky top-0 z-50 transition-colors duration-fast"
  style={{
    backgroundColor: `rgba(255, 255, 255, ${progress})`,
    borderBottom: `3px solid rgba(23, 19, 16, ${progress})`,
  }}
>
  {/* nav content */}
</nav>
```

---

## 11. Tailwind config mapping (for React + Tailwind + TypeScript builds)

When this system is implemented in Tailwind, map the tokens into `tailwind.config.ts` rather than only relying on raw CSS variables, so components can use utility classes:

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FFFFFF",
        warm: "#FFFBF7",
        ink: "#171310",
        red: "#FF3B30",
        pink: "#FF2D78",
        yellow: "#FFD400",
        "pink-tint": "#FFF0F5",
        "yellow-tint": "#FFFAE0",
      },
      fontFamily: {
        display: ["Anton", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        sm: "3px 3px 0 #171310",
        DEFAULT: "5px 5px 0 #171310",
        lg: "6px 6px 0 #171310",
        xl: "8px 8px 0 #171310",
        pressed: "2px 2px 0 #171310",
      },
      borderWidth: { DEFAULT: "3px" },
      transitionDuration: { fast: "120ms" },
    },
  },
  plugins: [],
} satisfies Config;
```

**Rule for an AI building components in Tailwind against this system:** use the mapped utility classes (`bg-red`, `shadow-lg`, `font-display`, `border-ink`, `duration-fast`, etc.) for anything static. Only drop to inline `style` props for values that are continuously computed at runtime (scroll progress, drag position, animated counters) — never hardcode raw hex/px values in a component when a token/utility already exists for it.

---

## 12. Instructions for an AI building new pages in this system

When asked to build a new page, component, or feature for this brand:

1. Load this file first and use the token values in §9 verbatim — don't invent new hex values or font sizes.
2. Default background is `--paper`; alternate with `--warm` section by section.
3. Any card, button, or interactive element gets a `3px solid var(--ink)` border and a flat offset shadow from §4 — never a soft blurred shadow, never a border-radius above "pill/circle."
4. Any primary action button uses the hover-press pattern in §5 exactly (shadow shrinks, element translates toward it).
5. Only one animated "hero" element per page (starburst-style wiggle or equivalent) — everything else stays static except functional hovers.
6. Reuse the signature components in §6 conceptually for equivalent content (e.g., a "featured item" always gets stub-card treatment; a numbered process always gets torn-paper steps).
7. Never introduce navy, indigo, or purple as a primary color. Red, pink, yellow, white/warm-white, and ink-black are the full palette — additional accent colors (if ever needed) should be tested against this rule first.
8. Keep copy in plain, active, sentence-case language per §8.
9. If building in React + Tailwind + TypeScript: use the token mapping in §11 as utility classes for all static styling, and only use inline `style` for continuously-computed runtime values (see §10 for the scroll-aware nav as the reference pattern).
