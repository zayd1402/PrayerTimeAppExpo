---
name: PrayerTimeApp
description: A calm, trustworthy companion for daily Islamic practice — prayer times, duas, hadith, and spiritual growth.
colors:
  primary: "#C27A2D"
  primary-dark: "#9E5C1A"
  primary-light: "#F0D9B0"
  gold: "#B8860B"
  gold-light: "#D4A843"
  gold-pale: "#FBF0D5"
  hero-bg: "#3D2415"
  neutral-bg: "#FDF8F0"
  neutral-surface: "#F8F1E5"
  neutral-card: "#F2E8D5"
  neutral-elevated: "#F5ECD8"
  neutral-pressed: "#EBDFC5"
  text-primary: "#2D2010"
  text-secondary: "#6B5030"
  text-muted: "#8C7855"
  red: "#C4553B"
  border: "rgba(45,32,16,0.08)"
  border-strong: "rgba(45,32,16,0.15)"
typography:
  display:
    fontFamily: "BodoniModa_700Bold"
    fontSize: "32px"
    fontWeight: "700"
    lineHeight: 1.15
  headline:
    fontFamily: "BodoniModa_700Bold"
    fontSize: "22px"
    fontWeight: "700"
    lineHeight: 1.25
  title:
    fontFamily: "Jost_600SemiBold"
    fontSize: "16px"
    fontWeight: "600"
    lineHeight: 1.3
  body:
    fontFamily: "Jost_400Regular"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: 1.55
  label:
    fontFamily: "Jost_500Medium"
    fontSize: "12px"
    fontWeight: "500"
    lineHeight: 1.3
  caption:
    fontFamily: "Jost_500Medium"
    fontSize: "10px"
    fontWeight: "500"
    lineHeight: 1.2
rounded:
  sm: "12px"
  md: "14px"
  lg: "16px"
  xl: "24px"
fonts:
  display: "Bodoni Moda"
  body: "Jost"
---

# Design System: PrayerTimeApp

## 1. Overview

**Creative North Star: "The Warm Courtyard"**

A quiet courtyard at golden hour. Warm limestone underfoot, gold leaf inscriptions catching the last light, aged paper, polished bronze. The Warm Courtyard is a space of serene warmth — never cold, never clinical. It welcomes and recedes, always ready when you are.

The visual language draws from Islamic material heritage through warmth and proportion, not ornamentation. The palette is drawn from natural materials — warm stone, aged gold, dark walnut, amber — rather than screens. A graded warm-amber family carries the surface, with dark gold accents marking the sacred.

**Key Characteristics:**

- Warm tonal layering over shadows — depth through color warmth, not elevation
- One accent family — amber carries active states; gold marks sacred content
- BodoniModa for headings, Jost for body — premium serif + clean geometric sans
- Tactile precision — rounded forms feel pressed, not clicked
- Arabic and English side by side — bidirectional typography as a feature

**Explicit rejections:**

- No green (the Islamic-app default)
- No gamification (no streaks-as-competition, no leaderboards)
- No cold corporate SaaS (no dashboard-gray, no navy-and-gold fintech)
- No shadows on cards at rest
- No gradient text, no glassmorphism

## 2. Colors

The palette is drawn from a sun-warmed courtyard: amber tile, gold inscription, dark walnut wood, warm stone.

### Primary — Burnished Amber (#C27A2D)
Active states, confirmation, navigation indicators, the "now" prayer. Used on tab indicators, check circles, active backgrounds, and success states. Covers ~8-12% of any given screen.
- **Amber Dark** (#9E5C1A): Pressed states, emphasis
- **Amber Pale** (#F0D9B0): Tinted backgrounds for today highlight, active rows

### Accent — Inscription Gold (#B8860B)
Sacred content markers, the daily hadith accent, timer countdowns. Used sparingly — a hadith card accent, the progress ring, section headers. Its rarity is the point.
- **Gold Light** (#D4A843): Hover and secondary gold states
- **Gold Wash** (#FBF0D5): Gold-tinted backgrounds for sacred content cards

### Neutral — Warm Stone
- **Base** (#FDF8F0): Every screen's background. Warm cream, like aged paper.
- **Surface** (#F8F1E5): Cards, rows. Parchment warmth.
- **Card** (#F2E8D5): Elevated surfaces. Deeper warm tone.
- **Elevated** (#F5ECD8): Slightly lifted cards.
- **Pressed** (#EBDFC5): Active press states.

### Hero — Dark Walnut (#3D2415)
Deep warm brown-black for the hero card and More menu header. The darkest surface; creates maximum contrast for light text and gold accents.

### Text — Warm Brown Spectrum
- **Primary** (#2D2010): Body text. 10.5:1 contrast on bgBase.
- **Secondary** (#6B5030): Supporting text, metadata.
- **Muted** (#8C7855): Hints, Arabic transliterations, inactive states. 5.2:1 contrast on bgBase — meets WCAG AA.

### Semantic
- **Red/Terracotta** (#C4553B): Errors and danger states.

### Borders
- **Subtle Border** (rgba(45,32,16,0.08)): Card and row separators.
- **Defined Border** (rgba(45,32,16,0.15)): Stronger separators.

### Shadow
- Single shadow token (rgba(61,36,21,0.10), offset 0/4, radius 12): Hero card only — separates dark header from status bar.

### Named Rules

**The Warm Gradient Rule.** Depth is conveyed through background color warmth (Base → Surface → Card → Elevated), never through shadows at rest. A surface that needs to lift uses a warmer or more saturated tone, not a drop shadow.

**The One Accent Family Rule.** Amber appears on ≤12% of any given screen. Gold appears on ≤8%. Together they never exceed 18% of the visible surface. The restraint is what makes them feel premium.

**The Flat-By-Default Rule.** Surfaces rest flat. The only shadow is on the hero card. Everything else uses background warmth for depth.

## 3. Typography

**Display font:** Bodoni Moda (400, 500, 600, 700). Premium serif for screen titles, hero display, and section headings. Adds warmth and refinement.

**Body font:** Jost (300, 400, 500, 600, 700). Clean geometric sans for labels, body text, UI elements, and data. Reads comfortably at small sizes.

### Hierarchy

- **Display** (32px, 700, 1.15, BodoniModa): The next prayer name in the hero card. Once per screen.
- **Headline** (22px, 700, 1.25, BodoniModa): Screen titles — "Islamic Calendar", "Worship Tracker", "Hadith".
- **Title** (16px, 600, 1.3, Jost): Prayer names, card titles, section headers. The workhorse label.
- **Body** (14px, 400, 1.55, Jost): Descriptions, hadith text, dua meanings. Max line length ~65 characters.
- **Label** (12px, 500, 1.3, Jost): Metadata, Arabic text, badges.
- **Caption** (10px, 500, 1.2, Jost): Navigation labels, grade badges. Smallest size.

### Named Rules

**The Warm Typography Rule.** BodoniModa headings carry the warmth; Jost body carries the clarity. Never swap — serif on labels feels fussy, sans on display titles feels cold.

**The Breathable Line Rule.** Body text gets ≥1.5 line-height. Arabic text gets ≥1.6 for its taller character forms. Crowded lines feel anxious; this app is calm.

## 4. Elevation

Tonal layering exclusively. No drop shadows on cards, rows, or surfaces at rest:

- **Base layer** (#FDF8F0): The ground. Every screen starts here.
- **Surface layer** (#F8F1E5): Cards, rows, inputs — lifted one step above the ground.
- **Card layer** (#F2E8D5): Elevated or interactive cards. Warmer = more prominent.
- **Tinted layer** (Amber Pale #F0D9B0, Gold Wash #FBF0D5): Active or sacred surfaces.
- **Deep layer** (Dark Walnut #3D2415): Hero card. Darkest, most saturated surface.

## 5. Components

### Prayer Rows
- **Shape:** 18px radius on `prayerRowWrap`.
- **Default:** `surfaceElevated` background, `textPrimary` title, `textSecondary` time, empty check circle (`borderStrong` border).
- **Next prayer:** `bgCard` background, `primary` text, 1.5px border.
- **Active (now):** `surfaceElevated` background, 1.5px `primary` border, gentle pulsing scale animation (1.008 ↔ 1.0, 4s cycle).
- **Completed:** Reduced opacity (0.75), line-through text, filled `primary` check circle.
- **Swipe reveal:** `primary` background slides in, white checkmark + "Prayed" label.

### Hadith Cards
- **Shape:** 18px radius, `surfaceElevated` background.
- **Header:** Gold (#B8860B) "Hadith of the Day" label with book icon.
- **Body:** 14px italic text, max 3 lines.
- **Source:** 12px `textMuted` attribution, right-aligned.

### Tab Bar
- **Container:** `bgSurface` background, subtle top border.
- **Item:** 22px Ionicons, 10px Jost label. `textMuted` default, `primary` when active.
- **Active indicator:** 4px amber dot above the icon.

### Cards
- **Shape:** 16-18px radius, `bgSurface` or `bgCard` background depending on elevation.
- No shadows at rest. Depth via background warmth.

### Chips & Badges
- **10px radius pill.** Tinted background at 15% opacity, colored text.
- Amber for active/confirmed, gold for sacred, warm umber for general.

### Inputs
- **Style:** `bgSurface` background, 18px radius, `border`, 14px text.
- **Focus:** `primary` border (1.5px).
- **Placeholder:** `textMuted` with proper contrast.

## 6. Do's and Don'ts

### Do:
- **Do** use tonal layering (background warmth shifts) before reaching for shadows.
- **Do** use amber (#C27A2D) for all active/confirmed states — one color, one meaning.
- **Do** use gold (#B8860B) exclusively for sacred content markers and the timer.
- **Do** keep Arabic text at 12px minimum with ≥1.6 line-height.
- **Do** use BodoniModa for headings, Jost for body — never swap.
- **Do** ensure every interactive element has a clear pressed state.
- **Do** match the radius scale: sm (12px) for badges, md (14px) for icon wraps, lg (16px) for tabs, xl (24px) for hero.

### Don't:
- **Don't** use green. The app deliberately avoids the Islamic-app default.
- **Don't** gamify worship. Affirm completion; don't penalize absence.
- **Don't** use cold corporate SaaS aesthetics.
- **Don't** use gradient text.
- **Don't** use glassmorphism or backdrop-filter blur.
- **Don't** use shadows on cards at rest.
- **Don't** animate layout properties (width, height, top, left). Use transform/opacity.
- **Don't** ship motion without a `prefers-reduced-motion` fallback.
- **Don't** use 1px border + shadow on the same element (ghost-card pattern).
- **Don't** use side-stripe borders greater than 1px.
