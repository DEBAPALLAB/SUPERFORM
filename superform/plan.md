SUPERFORM — V1 + V2 MASTER PLAN

THE 60-SECOND YES
Before any layout or flow, understand the psychological sequence a new user must travel through in their first 60 seconds:
0-5s   → "This looks different. What is this?"
5-15s  → "Oh — it's a form builder. But it looks insane."
15-25s → "Wait I can actually try it right here on the page?"
25-40s → "The form just changed styles when I hovered that. 
           How is this a form builder?"
40-50s → "I need to build something with this right now."
50-60s → Account created. First form being built.
Every layout decision, every UX decision, every copy decision in V1 is designed to move someone through that sequence without friction. If any screen breaks that sequence, it gets redesigned.

SECTION 1: USER FLOWS

FLOW A — FIRST VISIT → FIRST FORM (The Critical Path)
Landing Page (/)
    │
    ├── Sees headline + live demo form on right
    │   [User interacts with demo — picks an aesthetic]
    │   [Demo form morphs to that aesthetic in real time]
    │
    ├── Clicks "START BUILDING FREE →"
    │
    ▼
Intent Modal (full-screen overlay, no new page)
    │
    ├── Option 1: Types intent → "I want to..."
    │   [AI generates form in ~3 seconds]
    │   [Loading: rule line animation across screen]
    │   [Result: form title + questions + Art Direction pre-applied]
    │
    ├── Option 2: Picks quick-start chip
    │   (WAITLIST / APPLICATION / EVENT / FEEDBACK)
    │   [Same generation flow, chip pre-fills the intent]
    │
    ▼
Auth Gate (appears after intent submitted, not before)
    │
    ├── "Your form is ready. Create a free account to save it."
    │   [Google OAuth — one click]
    │   [Email — name + email + password, 3 fields max]
    │
    │   CRITICAL: Auth happens AFTER the value moment.
    │   User has already seen their generated form.
    │   They're saving something they want, not registering cold.
    │
    ▼
Builder /builder/[formId]
    │
    ├── Form pre-populated from intent generation
    ├── Art Direction already applied (from AI suggestion)
    ├── Tooltip rail on first visit (4 steps max, dismissible)
    │   Step 1: "These are your questions. Click any to edit."
    │   Step 2: "Switch to DESIGN to style your form."
    │   Step 3: "PREVIEW shows exactly what respondents see."
    │   Step 4: "PUBLISH when ready. Your link is instant."
    │
    ├── User edits questions in BUILD mode
    ├── User switches to DESIGN mode → sees hover-to-preview
    ├── User switches to PREVIEW → sees full respondent experience
    ├── User clicks PUBLISH → pre-flight modal → live link
    │
    ▼
Share moment (/f/[slug] live)
    │
    ├── User copies link, shares it
    ├── "Built with Superform" on ending screen
    │   [This is the organic acquisition loop]
    │
    ▼
First response arrives
    │
    ├── Email notification: "Your first response is in."
    │   [This is the hook back into the product]
    │
    ▼
Response Room /responses/[formId]
    │
    └── User sees Stream view → realizes this is more than 
        a form builder → retention event

FLOW B — RETURNING USER (The Retention Loop)
Dashboard /dashboard
    │
    ├── Sees form cards with response counts
    ├── Red dot on card = new responses since last visit
    │
    ├── Path 1: Clicks form card → goes to builder
    ├── Path 2: Clicks response count on card → 
    │           goes directly to Response Room
    ├── Path 3: Clicks "+ NEW FORM" → Intent modal
    │
    ▼
Response Room (if Path 2)
    │
    ├── Stream view: new responses shown as cards
    ├── Signal view: appears after 10 responses
    │   [Drop-off map shows Q4 losing 40% of respondents]
    │   [User thinks: "I should fix question 4"]
    │
    ├── Clicks "EDIT FORM" from Response Room
    │   → goes to builder with Q4 pre-selected
    │   [Response data informs the edit. 
    │    This is the loop nobody else has.]
    │
    ▼
Builder (edit mode)
    │
    ├── Edits Q4 based on drop-off insight
    ├── Re-publishes
    │
    ▼
Back to Response Room
    │
    └── Watches completion rate improve over next 48 hours
        [This is the moment Superform becomes indispensable]

FLOW C — RESPONDENT FLOW (The Other Side)
/f/[slug] (direct link or embed)
    │
    ├── Form loads instantly (no splash, no loading screen)
    ├── Art Direction applied immediately
    ├── Progress bar at top (2px, fills as questions answered)
    │
    ├── Question 01 centered, large, breathing room
    │   [Respondent types or selects]
    │   [ENTER to advance — hint visible, fades after 3s]
    │
    ├── Transition to Q02:
    │   Minimal: slide up, 200ms
    │   Editorial: fade + slight scale, 250ms
    │   Glass: blur transition, 300ms
    │   Brutalist: instant cut, 0ms
    │   Cinematic: slow pull focus, 600ms ease-in-out
    │
    ├── [Questions continue]
    │
    ├── Final question answered → ENTER
    │
    ▼
Ending screen
    │
    ├── Creator-configured ending type:
    │   SIMPLE: "Thank you, [first name]." 
    │           Cormorant Garamond italic, centered
    │   STATUS: "Your application is under review" 
    │           + estimated timeline card
    │   REDIRECT: 2s branded transition → external URL
    │
    ├── Bottom: "Built with Superform" DM Mono 10px
    │   [Respondent curious → clicks → 
    │    lands on superform.so with this form's 
    │    Art Direction applied to the landing page]
    │
    └── Optional: "Save your details for next time" prompt
        [Respondent account creation — frictionless]
        [Name + email pre-filled from their answers]
        [One checkbox: "Remember me for future forms"]

SECTION 2: LAYOUT PLANS

SCREEN 1 — LANDING PAGE (/)
The job of this page: Move someone from curious to account created in under 60 seconds. No scrolling required for the CTA. Everything above the fold is the product.
┌─────────────────────────────────────────────────────────────┐
│ HEADER — 56px, sticky, border-bottom 1px rule               │
│ [SF]  Superform    FEATURES · SHOWCASE · PRICING    LOG IN  [START BUILDING →]│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ HERO — full viewport height minus header                    │
│                                                             │
│  LEFT HALF (48%)              RIGHT HALF (52%)              │
│                                                             │
│  ┌──────────────────┐         ┌──────────────────────────┐  │
│  │ eyebrow tag:     │         │                          │  │
│  │ FORMS, EVOLVED.  │         │   LIVE DEMO FORM         │  │
│  │                  │         │                          │  │
│  │ YOUR FORM.       │         │   01 / QUESTION          │  │
│  │ THEIR            │         │                          │  │
│  │ EXPERIENCE.      │         │   What defines your      │  │
│  │                  │         │   aesthetic?             │  │
│  │ [subhead italic] │         │                          │  │
│  │ "Build forms so  │         │   ○ Minimal & Clean      │  │
│  │ beautiful,       │         │   ○ Editorial & Dramatic │  │
│  │ people ask what  │         │   ○ Raw & Brutalist      │  │
│  │ you used."       │         │   ○ Cinematic & Luxurious│  │
│  │                  │         │                          │  │
│  │ [START BUILDING] │         │   [form morphs on hover] │  │
│  │                  │         │   [commits on click]     │  │
│  │ No card.         │         │                          │  │
│  │ No branding.     │         │ ← This IS the demo.      │  │
│  │ Free forever.    │         │   Not a screenshot.      │  │
│  └──────────────────┘         └──────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROOF STRIP — 48px, border-top + border-bottom 1px rule     │
│ DM Mono 10px: "500+ FORMS BUILT THIS WEEK  ·               │
│ TRUSTED BY DESIGNERS, FOUNDERS & BUILDERS  ·               │
│ NO TYPEFORM BRANDING TAX"                                   │
│ [scrolling marquee, slow, left to right]                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FEATURES — 3 columns, rule-line separated                   │
│                                                             │
│  01 / DESIGN STUDIO    02 / SMART START    03 / RESPONSE ROOM│
│  ─────────────────     ────────────────    ──────────────── │
│  [mini Art Direction   [intent input box   [mini signal     │
│   cards rendered        with example        card showing    │
│   in their own          prompt text]        drop-off map]   │
│   styles]                                                   │
│                                                             │
│  "5 Art Directions.    "Describe what       "Know exactly   │
│  Infinite expression." you're building.     where you're    │
│                        We'll handle         losing people." │
│                        the rest."                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SHOWCASE — full width, dark background (#0D0D0D)            │
│                                                             │
│  "FORMS THAT MAKE AN IMPRESSION"                            │
│  Bebas Neue 64px, centered, color #E8DCC8                   │
│                                                             │
│  5 form cards in a horizontal scroll rail                   │
│  Each card is a live rendered Superform in different        │
│  Art Directions — actually interactive, not mockups         │
│                                                             │
│  Below: "START WITH YOUR OWN →" — ghost button white       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PRICING — 3 tiers, clean                                    │
│ FREE · CREATOR ₹499/mo · STUDIO ₹1499/mo                   │
│ Each tier as a card, features listed                        │
│ Most popular: CREATOR, highlighted                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FOOTER — border-top 1px rule, 64px                          │
│ Superform wordmark left · Twitter · Github · Contact right  │
└─────────────────────────────────────────────────────────────┘

SCREEN 2 — INTENT MODAL
The job of this screen: Make the user feel like the product already understands them before they've done any work.
┌─────────────────────────────────────────────────────────────┐
│ FULL SCREEN OVERLAY                                         │
│ Background: rgba(250,250,248,0.97) backdrop-blur            │
│                                                             │
│                    [× close, top right]                     │
│                                                             │
│                                                             │
│         ┌─────────────────────────────────────────┐        │
│         │                                         │        │
│         │  WHAT ARE YOU BUILDING?                 │        │
│         │  DM Mono 11px muted, letter-spacing wide│        │
│         │                                         │        │
│         │  ┌───────────────────────────────────┐  │        │
│         │  │                                   │  │        │
│         │  │  I want to...                     │  │        │
│         │  │  [Cormorant Garamond 28px italic   │  │        │
│         │  │   placeholder, auto-focus]         │  │        │
│         │  │                                   │  │        │
│         │  └───────────────────────────────────┘  │        │
│         │  border-bottom only, 2px var(--ink)     │        │
│         │                                         │        │
│         │  OR START WITH:                         │        │
│         │  DM Mono 9px muted                      │        │
│         │                                         │        │
│         │  [WAITLIST] [APPLICATION] [EVENT] [FEEDBACK]     │
│         │  pill chips, border 1px rule             │        │
│         │  hover: fill black                       │        │
│         │                                         │        │
│         │  [GENERATE MY FORM →]                   │        │
│         │  full width, black rectangle, DM Mono   │        │
│         │                                         │        │
│         └─────────────────────────────────────────┘        │
│                                                             │
│                                                             │
│  LOADING STATE (after submit):                             │
│  Rule line animates across full screen width, 3 passes     │
│  Center text: "READING YOUR INTENT..." fades in            │
│  Then: "STRUCTURING YOUR QUESTIONS..."                      │
│  Then: "CHOOSING YOUR AESTHETIC..."                         │
│  [Each line fades in/out, DM Mono 12px muted]              │
│                                                             │
└─────────────────────────────────────────────────────────────┘

SCREEN 3 — DASHBOARD (/dashboard)
The job of this screen: Make it instantly clear what to do next. Never feel empty. Always feel alive.
┌─────────────────────────────────────────────────────────────┐
│ HEADER — same 56px sticky nav                               │
│ [SF] Superform    [avatar]  [+ NEW FORM]                    │
└─────────────────────────────────────────────────────────────┘

┌──────┬──────────────────────────────────────────────────────┐
│      │                                                      │
│  60px│  DASHBOARD MAIN                                      │
│ ICON │                                                      │
│ RAIL │  "YOUR FORMS"  DM Mono 11px  +  response total     │
│      │  border-bottom 1px rule, padding-bottom 16px        │
│  ≡   │                                                      │
│  ○   │  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  ◇   │  │ FORM     │ │ FORM     │ │ NEW FORM │            │
│      │  │ CARD     │ │ CARD     │ │  CARD    │            │
│      │  │          │ │          │ │    +     │            │
│      │  │ [title]  │ │ [title]  │ │          │            │
│      │  │ 3 Q's    │ │ 7 Q's    │ │ "Start   │            │
│      │  │ 24 resp  │ │ 0 resp   │ │  with    │            │
│      │  │ ● 3 new  │ │          │ │  intent" │            │
│      │  │          │ │          │ │          │            │
│      │  │[EDITORIAL│ │[MINIMAL  │ │ dashed   │            │
│      │  │ bg tint] │ │ bg tint] │ │ border   │            │
│      │  └──────────┘ └──────────┘ └──────────┘            │
│      │                                                      │
│      │  Hover on form card reveals:                        │
│      │  [OPEN BUILDER] [VIEW RESPONSES] [SHARE LINK]       │
│      │  3 icon buttons, slide up from bottom of card       │
│      │                                                      │
└──────┴──────────────────────────────────────────────────────┘
Form card Art Direction tints:

Minimal: pure white, thin border
Editorial: #FAF8F4 warm off-white
Glass: very subtle blue-white tint
Brutalist: black card, white text
Cinematic: #0D0D0D dark card, warm text

Empty state (0 forms):
Center of main area:
Large: "NO FORMS YET." — Bebas Neue 64px muted
Small: "Start with an intent, not a blank page." 
       Cormorant Garamond 18px italic
CTA: "WHAT ARE YOU BUILDING?" — single button, opens intent modal

SCREEN 4 — BUILDER (/builder/[formId])
4A — BUILD MODE
┌─────────────────────────────────────────────────────────────┐
│ TOP NAV — 48px                                              │
│ [F] / [Untitled Form▾]    [BUILD] [DESIGN] [PREVIEW]    [PREVIEW ghost] [PUBLISH ■]│
│       (click to edit)      active=black pill                │
│                            right: "SAVED" DM Mono 10px muted│
└─────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────────────────────┬───────────────┐
│ LEFT PANEL   │ CENTER CANVAS                │ RIGHT PANEL   │
│ 260px        │ fluid                        │ 280px         │
│              │                              │               │
│ QUESTIONS    │ ┌─ PREVIEW STUDIO ──────────┐│ CONFIG  STYLE │
│ ─────────── │ │ [DESKTOP][TABLET][MOBILE]  ││ ─────── ───── │
│              │ │          zoom − ◉ +       ││               │
│ ● 01  W...⠿ │ └────────────────────────────┘│ QUESTION TITLE│
│   02  N...⠿ │                              ││ ┌───────────┐ │
│ ▶ 03  N...⠿ │  [form preview centered]     ││ │ New long  │ │
│   (active=   │                              ││ │ text q... │ │
│   left bar)  │  03 →                        ││ └───────────┘ │
│              │                              ││               │
│              │  New long text               ││ DESC / HINT   │
│ ─ TEXT ─────│  question                    ││ ┌───────────┐ │
│ T Short Text │                              ││ │ Optional  │ │
│ ≡ Long Text  │  Type your answer here...    ││ └───────────┘ │
│              │  ─────────────────────────  ││               │
│ ─ CHOICE ───│                              ││ PLACEHOLDER   │
│ ⊙ Multiple  │  [CONTINUE →] PRESS ENTER → ││ ┌───────────┐ │
│ ◉ Yes / No  │                              ││ │ Type here │ │
│ ★ Rating    │                              ││ └───────────┘ │
│              │                              ││               │
│ ─ CONTACT ──│                              ││ ─ VALIDATION ─│
│ @ Email      │                              ││ Required      │
│ # Phone      │                              ││ [    ◉    ]  │
│              │                              ││               │
│              ├──────────────────────────────┤│               │
│              │ QUESTION SCRUBBER (dock)     ││               │
│              │ ← [01 Why...][02 New...][03 ●]→│               │
│              │ 80px height, full canvas width││               │
│              │ border-top 1px rule          ││               │
│              │ active pill = black          ││               │
│ ─────────── │                              ││               │
│[+ ADD QUESTION]                            ││               │
│ full width   │                              ││               │
│ border-top   │                              ││               │
└──────────────┴──────────────────────────────┴───────────────┘
4B — DESIGN MODE
┌─────────────────────────────────────────────────────────────┐
│ TOP NAV — same, DESIGN tab active                           │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────┐
│ LEFT STYLE PANEL — 420px     │ RIGHT PREVIEW — fluid        │
│ padding 32px                 │ background #F5F3F0           │
│                              │ dot grid overlay             │
│ ART DIRECTION                │                              │
│ ─────────────────            │ LIVE PREVIEW      NODE #01   │
│                              │                              │
│ ┌──────────────────────────┐ │   [dot grid bg]              │
│ │ MINIMAL                  │ │                              │
│ │ QUIET, CENTERED, AIRY    │ │  ┌────────────────────────┐  │
│ │ [white, thin border]     │ │  │                        │  │
│ └──────────────────────────┘ │  │  01 →                  │  │
│ ┌──────────────────────────┐ │  │                        │  │
│ │ EDITORIAL                │ │  │  What is your          │  │
│ │ CLEAN BUT DRAMATIC       │ │  │  name?                 │  │
│ │ [warm bg, serif font]    │ │  │                        │  │
│ └──────────────────────────┘ │  │  Type your answer...   │  │
│ ┌──────────────────────────┐ │  │  ─────────────────     │  │
│ │ GLASS                    │ │  │                        │  │
│ │ BLUR, DEPTH, SHEEN       │ │  │  [CONTINUE →]          │  │
│ │ [frosted bg]             │ │  │                        │  │
│ └──────────────────────────┘ │  └────────────────────────┘  │
│ ┌──────────────────────────┐ │                              │
│ │ BRUTALIST                │ │  PREVIEWING BRUTALIST        │
│ │ HARD EDGES, HIGH CONTRAST│ │  [shown on hover only]       │
│ │ [black bg, white text]   │ │  DM Mono 9px #AAA top-left   │
│ └──────────────────────────┘ │                              │
│ ┌──────────────────────────┐ │                              │
│ │ CINEMATIC                │ │                              │
│ │ WIDE, SOFT, LUXURIOUS    │ │                              │
│ │ [dark bg, warm text]     │ │                              │
│ └──────────────────────────┘ │                              │
│                              │                              │
│ ─────────────────────────── │                              │
│ REFINE                       │                              │
│                              │                              │
│ SURFACE                      │                              │
│ [FLAT ■][CARD  ][GLASS ][FRAME]                             │
│                              │                              │
│ TYPOGRAPHY                   │                              │
│ [SM ■][MD ][LG ][XL ]        │                              │
│                              │                              │
│ RADIUS                       │                              │
│ [NONE ■][SM ][MD ][FULL ]    │                              │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ ISSUES BAR — 36px, pinned bottom, full width                │
│ background #FFFBEB, border-top 1px #F0D060                  │
│ "⚠  2 issues need attention before publishing  →"           │
│ DM Mono 11px #92700A                                        │
└─────────────────────────────────────────────────────────────┘
4C — PREVIEW MODE
┌─────────────────────────────────────────────────────────────┐
│ MINIMAL NAV — 48px                                          │
│ ← BACK TO EDITOR (DM Mono 10px left)                        │
│           [DESKTOP][MOBILE] (center)                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PROGRESS BAR — 2px, top of viewport, fills left to right    │
│ color var(--color-ink)                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FULL VIEWPORT — var(--color-canvas) background              │
│                                                             │
│                                                             │
│         ┌─────────────────────────────────────┐            │
│         │                                     │            │
│         │  01 →                               │            │
│         │                                     │            │
│         │  What is your name?                 │            │
│         │                                     │            │
│         │  ___________________________________│            │
│         │  Type your answer here...           │            │
│         │                                     │            │
│         │  [CONTINUE →]    PRESS ENTER →      │            │
│         │                                     │            │
│         └─────────────────────────────────────┘            │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘

SCREEN 5 — RESPONDENT VIEW (/f/[slug])
┌─────────────────────────────────────────────────────────────┐
│ PROGRESS BAR — 2px, top, color inherited from Art Direction │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ FULL VIEWPORT — Art Direction applied                       │
│ Zero Superform branding visible during form                 │
│                                                             │
│         01 →              [DM Mono 10px muted]             │
│                                                             │
│         What is your name?                                  │
│         [Cormorant Garamond, clamp(24px,4vw,48px)]         │
│                                                             │
│         ________________________________                    │
│         [bottom border only, large font]                   │
│                                                             │
│         [CONTINUE →]     PRESS ENTER →                      │
│         [hint fades after 3s, returns on idle]             │
│                                                             │
│                                                             │
│                                                             │
│                                                             │
│                                  Built with Superform       │
│                                  [DM Mono 10px, bottom right│
│                                   very subtle, #CCC]        │
└─────────────────────────────────────────────────────────────┘
Ending Screen:
┌─────────────────────────────────────────────────────────────┐
│ FULL VIEWPORT — same Art Direction                          │
│                                                             │
│                                                             │
│         Thank you, Dev.                                     │
│         [Cormorant Garamond italic 48px]                    │
│                                                             │
│         We'll be in touch within 5 days.                    │
│         [DM Mono 12px muted]                                │
│                                                             │
│                                                             │
│                                                             │
│         ┌────────────────────────────────────┐              │
│         │ Save your details for next time?   │              │
│         │ One click autofill on any Superform│              │
│         │ [SAVE MY DETAILS]  [No thanks]     │              │
│         └────────────────────────────────────┘              │
│         [appears 1.5s after ending text, slides up]         │
│                                                             │
│                                  Built with Superform       │
└─────────────────────────────────────────────────────────────┘

SCREEN 6 — RESPONSE ROOM (/responses/[formId])
6A — STREAM VIEW
┌─────────────────────────────────────────────────────────────┐
│ HEADER — 48px                                               │
│ ← Dashboard · [Form Title] · RESPONSES                      │
│ right: [STREAM ■][SIGNAL][EXPORT]    "47 total" muted       │
└─────────────────────────────────────────────────────────────┘

┌────────────────────┬────────────────────────────────────────┐
│ FILTER RAIL — 200px│ RESPONSE CARDS                         │
│ border-right 1px   │                                        │
│                    │ ┌──────────────────────────────────┐   │
│ STATUS             │ │ dev@lucide.tech        2m 34s    │   │
│ [ALL ■][NEW]       │ │ 3 Apr 2025                       │   │
│ [REVIEWED]         │ │ ─────────────────────────────── │   │
│ [SHORTLISTED]      │ │ WHAT IS YOUR NAME?               │   │
│ [REJECTED]         │ │ Debapallab Das                   │   │
│                    │ │                                  │   │
│ ─────────────────  │ │ WHAT ARE YOU BUILDING?           │   │
│ DATE RANGE         │ │ A premium form builder that...   │   │
│ FROM [    ]        │ │ + 3 more                         │   │
│ TO   [    ]        │ │ ─────────────────────────────── │   │
│                    │ │ [NEW ●]  [★][✓][✗][↗]           │   │
│ ─────────────────  │ └──────────────────────────────────┘   │
│ SEARCH             │                                        │
│ [Search...       ] │ ┌──────────────────────────────────┐   │
│                    │ │ Anonymous #2           4m 12s    │   │
│ ─────────────────  │ │ ...                              │   │
│ COMPLETION         │ └──────────────────────────────────┘   │
│ [COMPLETE][PARTIAL]│                                        │
│                    │ [LOAD MORE] — DM Mono 11px centered    │
└────────────────────┴────────────────────────────────────────┘
Full response drawer (slides from right, 400px):
┌──────────────────────────────────────────┐
│ dev@lucide.tech          [✗ close]        │
│ Submitted 3 Apr · 2m 34s · Complete      │
│ ────────────────────────────────────── │
│ Status: [NEW ▾]  ← dropdown to change   │
│ ────────────────────────────────────── │
│ WHAT IS YOUR NAME?                       │
│ Debapallab Das                           │
│                                          │
│ WHAT ARE YOU BUILDING?                   │
│ A premium form builder that competes     │
│ with Typeform on design and intelligence │
│                                          │
│ [all questions expanded, full text]      │
│ ────────────────────────────────────── │
│ NOTE                                     │
│ ┌──────────────────────────────────────┐ │
│ │ Add a note...                        │ │
│ └──────────────────────────────────────┘ │
│ ────────────────────────────────────── │
│ ← PREV RESPONSE    NEXT RESPONSE →      │
│ [J/K keyboard shortcuts]                │
└──────────────────────────────────────────┘
6B — SIGNAL VIEW
┌─────────────────────────────────────────────────────────────┐
│ HEADER — same, SIGNAL tab active                            │
│ right: "Last updated 12 min ago" DM Mono 10px muted         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ SIGNAL MAIN — 2 column card grid, 24px gap                  │
│                                                             │
│ ┌───────────────────────────┐ ┌───────────────────────────┐ │
│ │ WHERE PEOPLE LEAVE        │ │ COMPLETION RATE           │ │
│ │ DM Mono 11px              │ │                           │ │
│ │                           │ │        74%                │ │
│ │ Q01 ████████████████ 94%  │ │   Bebas Neue 72px         │ │
│ │ Q02 ██████████████   84%  │ │                           │ │
│ │ Q03 ████████████     72%  │ │ Industry avg: 68%         │ │
│ │ Q04 ██████           44%  │ │ ↑ 6% above average        │ │
│ │ Q05 ████████         61%  │ │                           │ │
│ │                           │ │ [sparkline 7-day]         │ │
│ │ "Most drop-off at Q04"    │ │                           │ │
│ │ Cormorant italic 16px     │ │ ● HEALTHY                 │ │
│ └───────────────────────────┘ └───────────────────────────┘ │
│                                                             │
│ ┌───────────────────────────┐ ┌───────────────────────────┐ │
│ │ HOW LONG IT TAKES         │ │ RESPONSE PATTERNS         │ │
│ │                           │ │                           │ │
│ │      2m 34s               │ │ WHAT IS YOUR AESTHETIC?   │ │
│ │  Bebas Neue 48px          │ │                           │ │
│ │                           │ │ Minimal    ████████  42%  │ │
│ │ Estimated: 3m 00s         │ │ Editorial  ██████    31%  │ │
│ │ Actual: 2m 34s ✓          │ │ Brutalist  ████      18%  │ │
│ │                           │ │ Cinematic  ██         9%  │ │
│ │ Per-question bars         │ │                           │ │
│ │ Q04 flagged as slowest    │ │                           │ │
│ └───────────────────────────┘ └───────────────────────────┘ │
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ PATTERN BRIEF                          [↻ Regenerate]   │ │
│ │                                                         │ │
│ │ "Respondents skew toward design-conscious builders      │ │
│ │  who prefer minimal aesthetics but engage most with     │ │
│ │  open-ended questions. Drop-off at Q04 suggests the     │ │
│ │  question is either too complex or too early in the     │ │
│ │  flow for the level of commitment it demands."          │ │
│ │                                                         │ │
│ │  Cormorant Garamond 18px italic, color var(--ink)       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

SECTION 3: UX PRINCIPLES — THE RULES THAT GOVERN EVERYTHING
These are non-negotiable. Every screen, every interaction gets checked against these.

RULE 1: Value before auth.
The user sees a generated form before they create an account. Auth is a save action, not an entry gate. Anyone who hits an auth wall before seeing the product leaves.
RULE 2: The product demonstrates itself.
The landing page demo form, the hover-to-preview in Design mode, the live Art Direction morphing — none of these need explanation. They explain themselves by existing. If something needs a tooltip to be understood, the interaction is wrong.
RULE 3: Every mode feels spatially different.
BUILD = structured, left panel active, canvas is the center of attention.
DESIGN = open, left panel gone, style controls are the center of attention.
PREVIEW = everything gone, only the form exists.
The user's body should feel the mode change, not just read a label.
RULE 4: The form preview is always live.
Every change — question edit, Art Direction pick, radius change — reflects in the canvas preview within 100ms. No "click to refresh". No "save to see changes". The builder is a live instrument, not a form editor.
RULE 5: Transitions are part of the design system.
Minimal = 200ms slide. Brutalist = 0ms cut. Cinematic = 600ms ease. The product's motion language matches the Art Direction. This is a detail nobody will consciously notice but everyone will feel.
RULE 6: Keyboard is a first-class citizen.
Every action in the builder has a keyboard shortcut. Every transition in the respondent view is keyboard-navigable. ENTER to advance. ESC to go back. J/K to navigate responses. B/D/P for Build/Design/Preview. This is what makes power users evangelical.
RULE 7: Error states are human.
"2 Issues" is not an error message. "Your form needs a few things before it's ready" is. Every validation, every warning, every issue is written in the voice of a thoughtful collaborator, not a system alert.
RULE 8: The respondent is a guest, not a data source.
Zero Superform branding during the form experience. The creator's form is the creator's brand. "Built with Superform" appears only on the ending screen, subtly, as a craft credit. This is a strategic inversion of Typeform's model and it is your acquisition loop.
RULE 9: Signal before spreadsheet.
No user should ever see a raw response table in V2. Responses are cards. Data is visualized. Patterns are surfaced automatically. The spreadsheet export exists but it is not the default view. The default view makes the data feel meaningful.
RULE 10: The product should make the user feel capable.
Not powerful. Capable. There's a difference. Powerful implies complexity. Capable implies confidence. A 20-year-old student opening Superform for the first time should feel like they can build something that looks genuinely professional in under 10 minutes. Every UX decision serves that feeling.

SECTION 4: MICRO-INTERACTIONS THAT CREATE THE "MERMERIZED" MOMENT
These are the specific moments where someone goes from "this is nice" to "I need to show everyone this."
Moment 1: The landing page demo morphs.
User hovers "Cinematic & Luxurious" on the demo form. The form card behind the question darkens, the font shifts, the input field takes on a warm glow. They haven't clicked anything. They haven't signed up. The product already showed them its soul.
Moment 2: Art Direction hover-to-preview.
User is in Design mode. They hover BRUTALIST. The live preview on the right instantly snaps to hard edges, black border, heavy type, zero radius. They move to CINEMATIC. Dark, warm, luxurious. They hover back and forth three times just to watch it. This is the moment they decide this is different.
Moment 3: Intent to form.
User types "I want to find 10 serious designers for a 6-week residency program." Three loading states cycle. Then their screen fills with a complete, structured, beautifully named form — 7 questions, in Editorial direction, with a rationale for each question visible in a subtle callout. They didn't write a single question. They feel like the product read their mind.
Moment 4: The respondent transition.
User previews their CINEMATIC form. They hit Enter on question 1. The question doesn't just disappear — it pulls away slowly, focus softening, and question 2 arrives with the gravity of a film cut. They immediately go back and check what BRUTALIST looks like. Instant hard cut. They switch between forms just to feel the difference.
Moment 5: The Signal insight.
User checks their Signal view after 15 responses. There's a bar chart showing Q4 at 44% completion. Below it in Cormorant Garamond italic: "Most drop-off happens at Q4: Tell us about your design philosophy. Consider shortening or reordering this question." They edit the question. Come back in 2 days. Completion is at 67%. The product helped them improve their own outcomes. That's the moment they tell someone else about Superform.

This is the complete V1+V2 plan. Layout, flow, UX rules, and the exact moments that create the yes. Build in this order: landing → intent modal → auth → builder shell → BUILD mode → DESIGN mode → PREVIEW mode → respondent view → publish flow → dashboard → response room stream → signal view. Every screen connects to the next. Every interaction serves the 60-second yes.