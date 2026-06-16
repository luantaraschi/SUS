# SUS Visual Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate the entire SUS UI/UX — design system, motion, sound, components, every screen — to a polished, professional product without changing gameplay, following the approved Direction B ("Festa Refinada").

**Architecture:** Foundation-first. Establish design tokens → shared primitives → motion system → sound engine → re-skin each screen on top → accessibility → verification. Each phase leaves the app working and visually verifiable.

**Tech Stack:** Next.js 16 (App Router), React 19, Convex, Tailwind v4 (`@theme` tokens), framer-motion v12, three.js shader background, Web Audio API. App root: `sus/`.

**Spec:** [docs/superpowers/specs/2026-06-16-sus-visual-redesign-design.md](../specs/2026-06-16-sus-visual-redesign-design.md)

---

## Conventions for this plan

- **All commands run from `sus/`** (per project memory). Dev server may already be running on :3000.
- **Verification model (visual-heavy work):**
  - Logic units (helpers, sound math) → real unit tests with **Vitest** (added in Task 0.2).
  - UI/CSS/motion → `npm run lint` + `npm run build` must pass, **plus a visual screenshot check** via `agent-browser` (server on :3000). No regression to gameplay.
  - "Expected" for visual steps = a described visual outcome to confirm in the screenshot.
- **Commit after each task.** Conventional commits. Branch: `redesign/visual-overhaul` (already created).
- **Token-first rule:** never introduce a new literal color/radius/shadow — add or use a token from `globals.css`.
- **Do not touch** Convex backend logic, game rules, or the phase state machine semantics.

---

## File map (created / modified)

**Created**
- `sus/src/lib/motion.ts` — framer-motion variants + transition presets (single source of truth).
- `sus/src/lib/sound/engine.ts` — Web Audio engine (context, master gain, envelope factory, scale).
- `sus/src/lib/sound/sounds.ts` — event→sound definitions using the engine.
- `sus/src/lib/sound/index.ts` — public API (`playSound`, volume/mute store).
- `sus/src/lib/players.ts` — `getActivePlayers`, `getVotingPlayers` helpers.
- `sus/src/components/ui/Modal.tsx` — shared modal primitive (`ModalRoot/Backdrop/Panel/Header/Close`).
- `sus/src/lib/useModalFocus.ts` — focus trap + restore hook.
- `sus/src/components/game/FormField.tsx` — label + input + error + help.
- `sus/src/components/game/avatar/` — `AvatarImage.tsx`, `AvatarBadges.tsx`, `AvatarStatus.tsx`, `AvatarLabel.tsx`.
- `sus/src/components/game/lobby/` — `LobbyPanel.tsx`, `CodeBlock.tsx`, `Counter.tsx`, `useRoomSettings.ts` (Lobby split).
- `sus/src/components/game/phases/distributing/` — `WaitingForRoles.tsx`, `MasterQuestionSetup.tsx`, `ReadyConfirmation.tsx`.
- `sus/src/components/game/phases/results/` — `ResultsDisplay.tsx`, `Leaderboard.tsx`, `ShareSection.tsx`.
- `sus/vitest.config.ts`, `sus/src/**/__tests__/*.test.ts` — logic tests.

**Modified (high-traffic)**
- `sus/src/app/globals.css` — `@theme` token system (cor/raio/sombra/alpha/blur/tipo/espaço/motion).
- `sus/src/app/layout.tsx` — font smoothing, root utilities.
- `sus/src/components/ui/button.tsx` — unified Button (CVA); `GameButton.tsx` removed and call sites migrated.
- `sus/src/components/game/ui/glass.tsx`, `GlassSelect.tsx` — token-based, focus ring fix.
- `sus/src/components/game/SpeakingOrbit.tsx` — glow bug fix (drop-shadow).
- `sus/src/components/game/Timer.tsx`, `GameInput.tsx`, `PlayerAvatar.tsx`, `ConvexStatusBanner.tsx`, `Footer.tsx`, `FloatingChat.tsx`, `ReactionAnchor.tsx`.
- `sus/src/app/(game)/page.tsx`, `room/[code]/page.tsx`, `room/[code]/play/page.tsx`, `profile/page.tsx`.
- All `sus/src/components/game/phases/*.tsx`.

---

## PHASE 0 — Guardrails

### Task 0.1: Capture baseline screenshots (before/after reference)

**Files:** none (artifacts only)

- [ ] **Step 1: Ensure dev server is up**

Run: `npm run dev` (skip if already running on :3000).
Expected: `Ready` on http://localhost:3000.

- [ ] **Step 2: Capture key screens with agent-browser**

```bash
agent-browser open http://localhost:3000 && agent-browser screenshot ../docs/superpowers/baseline/home.png
```
Repeat for a created room lobby and an in-game phase (create a room with bots to reach Speaking/Voting). Save under `docs/superpowers/baseline/`.
Expected: PNGs saved; these are the "before" reference for every later visual check.

- [ ] **Step 3: Commit baseline**

```bash
git add docs/superpowers/baseline && git commit -m "chore: baseline screenshots before redesign"
```

### Task 0.2: Add Vitest for logic units

**Files:**
- Create: `sus/vitest.config.ts`
- Modify: `sus/package.json` (add `"test": "vitest run"`, devDeps `vitest`)

- [ ] **Step 1: Install Vitest**

Run: `npm i -D vitest`
Expected: added to devDependencies.

- [ ] **Step 2: Create `sus/vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
```

- [ ] **Step 3: Add test script to `package.json`**

Add under `scripts`: `"test": "vitest run"`.

- [ ] **Step 4: Smoke test**

Create `src/lib/__smoke__/smoke.test.ts`:
```ts
import { test, expect } from "vitest";
test("vitest runs", () => { expect(1 + 1).toBe(2); });
```
Run: `npm test`
Expected: 1 passed. Then delete the smoke file.

- [ ] **Step 5: Commit**

```bash
git add sus/package.json sus/vitest.config.ts && git commit -m "chore: add vitest for logic units"
```

---

## PHASE 1 — Design System Foundation (tokens)

> Defines every token in spec §3. After this phase the app looks ~the same but all values are tokenized. We migrate literals to tokens screen-by-screen in Phase 5; here we only **define** tokens and add global utilities.

### Task 1.1: Define color, radius, shadow, alpha, blur, spacing tokens

**Files:**
- Modify: `sus/src/app/globals.css` (`@theme` block + `:root`/dark overrides)

- [ ] **Step 1: Add the token block** (values verbatim from spec §3)

In the `@theme` block of `globals.css`, add the semantic tokens:
```css
@theme {
  /* surface */
  --color-bg-1:#2A0A6E; --color-bg-2:#3A138F; --color-bg-3:#5A2FD6;
  /* text */
  --color-text:#FDFCFF; --color-text-muted:#CDBCFF;
  /* game palette */
  --color-imp:#FF577B; --color-safe:#4DDBA8; --color-info:#00B8EB;
  --color-warn:#FF8940; --color-special:#D64DC2; --color-gold:#FFD76A; --color-green:#7ED957;
  /* primary action */
  --color-primary-1:#6A5BF0; --color-primary-2:#4733C8; --color-primary-press:#2C1F8F;
  /* radius */
  --radius-xs:8px; --radius-sm:12px; --radius-md:18px; --radius-lg:26px;
  --radius-xl:32px; --radius-2xl:40px; --radius-pill:999px;
  /* blur */
  --blur-sm:8px; --blur-md:16px; --blur-lg:24px;
}
```

- [ ] **Step 2: Add non-`@theme` CSS vars** (glass, text-dim, alpha, shadow, ring) to `:root`

```css
:root{
  --glass-1:rgba(255,255,255,.08); --glass-2:rgba(255,255,255,.12);
  --glass-border:rgba(255,255,255,.16); --text-dim:rgba(255,255,255,.55);
  --w-04:rgba(255,255,255,.04); --w-08:rgba(255,255,255,.08); --w-12:rgba(255,255,255,.12);
  --w-16:rgba(255,255,255,.16); --w-20:rgba(255,255,255,.20); --w-28:rgba(255,255,255,.28);
  --w-40:rgba(255,255,255,.40); --w-60:rgba(255,255,255,.60); --w-72:rgba(255,255,255,.72);
  --shadow-sm:0 2px 8px rgba(0,0,0,.18);
  --shadow-md:0 18px 50px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.14);
  --shadow-lg:0 30px 80px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.12);
  --shadow-press:0 4px 0 var(--color-primary-press);
  --ring:0 0 0 3px color-mix(in srgb, var(--color-info) 55%, transparent);
}
```
(Add the dark-mode overrides under the existing `[data-color-scheme="dark"]` selector, matching current dark tokens.)

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: build succeeds, no CSS errors. App still renders (tokens unused yet).

- [ ] **Step 4: Commit**

```bash
git add sus/src/app/globals.css && git commit -m "feat(tokens): add color/radius/shadow/alpha/blur design tokens"
```

### Task 1.2: Typography + global quality utilities

**Files:**
- Modify: `sus/src/app/globals.css`, `sus/src/app/layout.tsx`

- [ ] **Step 1: Type scale tokens + transversal rules in `globals.css`**

```css
@theme {
  --text-display: 4.5rem; --text-h1:2rem; --text-h2:1.5rem;
  --text-base:1rem; --text-sm:.875rem; --text-xs:.75rem;
}
:root{ --tnum: tabular-nums; }
.tnum{ font-variant-numeric: tabular-nums; }
h1,h2,h3{ text-wrap: balance; }
p{ text-wrap: pretty; }
.visually-hidden{ position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0; }
```

- [ ] **Step 2: Font smoothing on root** in `layout.tsx`

Add `className="antialiased"` (or `-webkit-font-smoothing:antialiased` via globals on `body`).

- [ ] **Step 3: Verify**

Run: `npm run build && npm run lint`
Expected: pass.

- [ ] **Step 4: Commit**

```bash
git add sus/src/app/globals.css sus/src/app/layout.tsx && git commit -m "feat(tokens): typography scale + smoothing/tabular/wrap utilities"
```

### Task 1.3: Motion tokens (CSS) + reduced-motion guard

**Files:** Modify `sus/src/app/globals.css`

- [ ] **Step 1: Add timing/easing tokens + reduced-motion**

```css
:root{
  --t-micro:120ms; --t-quick:200ms; --t-base:300ms; --t-slow:450ms;
  --ease-out:cubic-bezier(.16,1,.3,1); --ease-in:cubic-bezier(.55,0,1,.45);
  --ease-in-out:cubic-bezier(.65,0,.35,1); --spring-playful:cubic-bezier(.34,1.56,.64,1);
}
@media (prefers-reduced-motion: reduce){
  *,*::before,*::after{ animation-duration:.01ms !important; animation-iteration-count:1 !important; transition-duration:.01ms !important; }
}
```

- [ ] **Step 2: Verify + commit**

Run: `npm run build`
```bash
git add sus/src/app/globals.css && git commit -m "feat(tokens): motion timing/easing + prefers-reduced-motion guard"
```

---

## PHASE 2 — Component Primitives

### Task 2.1: Unified Button (CVA) + remove GameButton

**Files:**
- Modify: `sus/src/components/ui/button.tsx`
- Delete: `sus/src/components/game/GameButton.tsx` (after migration)

- [ ] **Step 1: Extend `button.tsx` variants** to cover game needs (primary/glass/safe/danger/ghost/link), token-based, with press + focus:

```tsx
// cva variants (excerpt) — use tokens, not literals
primary: "bg-[linear-gradient(180deg,var(--color-primary-1),var(--color-primary-2))] text-white shadow-[var(--shadow-press)] active:scale-[0.96] transition-[transform,box-shadow]",
glass:   "bg-[var(--glass-1)] border border-[var(--glass-border)] backdrop-blur-[var(--blur-md)] text-[var(--color-text)] active:scale-[0.96] transition-transform",
safe:    "bg-[linear-gradient(180deg,#5fe6b6,var(--color-safe))] text-[#08381f] active:scale-[0.96]",
danger:  "bg-[linear-gradient(180deg,#ff6f93,var(--color-imp))] text-white active:scale-[0.96]",
// all variants: focus-visible:shadow-[var(--ring)] focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none min-h-[44px]
```

- [ ] **Step 2: Find all GameButton usages**

Run: `agent-browser`-independent — use Grep for `GameButton` across `sus/src`.
Expected: list of call sites (DistributingPhase, VotingPhase, Home, etc.).

- [ ] **Step 3: Migrate each call site** to `<Button variant=...>` mapping filled→primary, outline→glass, danger→danger, success→safe. Remove `GameButton.tsx`.

- [ ] **Step 4: Verify**

Run: `npm run build && npm run lint`
Expected: pass, no references to GameButton remain (Grep returns nothing).

- [ ] **Step 5: Visual check + commit**

Screenshot home; confirm buttons render with 3D press shadow and focus ring.
```bash
git add -A && git commit -m "refactor(ui): unify Button (CVA), remove GameButton, token-based variants"
```

### Task 2.2: Shared Modal primitive + focus hook

**Files:**
- Create: `sus/src/components/ui/Modal.tsx`, `sus/src/lib/useModalFocus.ts`

- [ ] **Step 1: `useModalFocus.ts`** — trap focus, restore on close, `Esc` to close:

```ts
import { useEffect } from "react";
export function useModalFocus(ref: React.RefObject<HTMLElement>, onClose: () => void, open: boolean){
  useEffect(()=>{
    if(!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current; el?.focus();
    const onKey = (e: KeyboardEvent)=>{ if(e.key==="Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return ()=>{ document.removeEventListener("keydown", onKey); prev?.focus(); };
  },[open,onClose,ref]);
}
```

- [ ] **Step 2: `Modal.tsx`** — backdrop fade + panel spring-scale via framer-motion, token z-index, uses `useModalFocus`. Exports `Modal` with `open`, `onClose`, `title`, `children`. Backdrop `--b-60`, panel `.glass` + `--shadow-lg`, close button ≥44px.

- [ ] **Step 3: Verify build + commit**

Run: `npm run build`
```bash
git add -A && git commit -m "feat(ui): shared Modal primitive + focus trap hook"
```

### Task 2.3: Migrate existing modals to shared Modal

**Files:** Modify `LegalModal.tsx`, `SupportModal.tsx`, `HowToPlayModal.tsx`, `ThemePickerDialog.tsx`, `SignInModal.tsx`, `GameSettingsButton.tsx`

- [ ] **Step 1:** Replace each modal's `fixed inset-0 backdrop + motion div + close` with `<Modal>`. Keep each modal's inner content. Bring `SignInModal` into the glass design system (remove hardcoded `#1e1b6e`/gray-* → tokens).
- [ ] **Step 2:** Confirm all open/close + `Esc` + exit animations work; z-index consistent.
- [ ] **Step 3: Verify**: `npm run build && npm run lint`; screenshot each modal open.
- [ ] **Step 4: Commit**: `git add -A && git commit -m "refactor(ui): migrate all modals to shared Modal + token colors"`

### Task 2.4: FormField + GameInput focus fix

**Files:** Create `sus/src/components/game/FormField.tsx`; Modify `sus/src/components/game/GameInput.tsx`

- [ ] **Step 1:** `FormField` wraps label + control + error + help with `aria-describedby`; error uses `--color-imp` text + `@keyframes shake`.
- [ ] **Step 2:** Fix GameInput focus **layout shift** (spec §7): default state pre-allocates ring space — `box-shadow:0 0 0 0` → focus `0 0 0 3px` via `--ring`, never changing box size. Remove the old conditional shadow that shifts layout.
- [ ] **Step 3: Verify**: build + lint; screenshot input focus, confirm no 3px jump.
- [ ] **Step 4: Commit**: `git commit -am "feat(ui): FormField + fix input focus layout shift"`

### Task 2.5: Split PlayerAvatar

**Files:** Create `sus/src/components/game/avatar/{AvatarImage,AvatarBadges,AvatarStatus,AvatarLabel}.tsx`; Modify `PlayerAvatar.tsx`

- [ ] **Step 1:** Extract image/fallback logic → `AvatarImage`; crown/bot/remove → `AvatarBadges`; status dot → `AvatarStatus`; name/label → `AvatarLabel`. `PlayerAvatar` composes them. Move bg colors to tokens.
- [ ] **Step 2:** Keep all 6 sizes + props identical (no behavior change).
- [ ] **Step 3: Verify**: build + lint; screenshot lobby (avatars unchanged visually).
- [ ] **Step 4: Commit**: `git add -A && git commit -m "refactor(ui): split PlayerAvatar into focused subcomponents"`

### Task 2.6: Timer (tabular-nums, aria-live) + global focus/hit-area

**Files:** Modify `Timer.tsx`, `GlassSelect.tsx`, `FloatingChat.tsx`, `Footer.tsx`, `GameSettingsButton.tsx`

- [ ] **Step 1:** Timer: add `.tnum`, `aria-live="polite"`; keep threshold colors via tokens (`--color-warn`/`--color-imp`). (Tick sound wired in Phase 4.)
- [ ] **Step 2:** Apply consistent `focus-visible:shadow-[var(--ring)]` everywhere; fix GlassSelect ring clip (`ring-offset-0` / overflow-visible wrapper, spec §7).
- [ ] **Step 3:** Enforce ≥40×40px hit areas: FloatingChat emoji (h-9→h-10), settings badges (h-8→h-10), Footer links (add min size / pseudo-element).
- [ ] **Step 4: Verify**: build + lint; screenshot game screen with timer.
- [ ] **Step 5: Commit**: `git add -A && git commit -m "feat(a11y): timer tabular/aria-live, unified focus ring, 40px hit areas"`

---

## PHASE 3 — Motion System

### Task 3.1: Create `motion.ts` variant library

**Files:** Create `sus/src/lib/motion.ts`

- [ ] **Step 1:** Export presets + variants (spec §4):

```ts
export const spring = { press:{type:"spring",stiffness:400,damping:17}, pop:{type:"spring",stiffness:500,damping:22}, gentle:{type:"spring",stiffness:260,damping:24} } as const;
export const fadeInUp = { initial:{opacity:0,y:12}, animate:{opacity:1,y:0}, exit:{opacity:0,y:-8} };
export const scaleIn  = { initial:{opacity:0,scale:.96}, animate:{opacity:1,scale:1}, exit:{opacity:0,scale:.98} };
export const staggerContainer = { animate:{ transition:{ staggerChildren:.08 } } };
export const staggerItem = { initial:{opacity:0,y:10}, animate:{opacity:1,y:0} };
export const phaseTransition = { initial:{opacity:0,scale:.96,y:8}, animate:{opacity:1,scale:1,y:0,transition:spring.gentle}, exit:{opacity:0,y:-8,transition:{duration:.18}} };
```

- [ ] **Step 2: Verify**: `npm run build`.
- [ ] **Step 3: Commit**: `git add -A && git commit -m "feat(motion): shared variant/transition library"`

### Task 3.2: Fix speaker-glow bug (SpeakingOrbit)

**Files:** Modify `sus/src/components/game/SpeakingOrbit.tsx:50-102`

- [ ] **Step 1:** Replace the animated `boxShadow` glow with `filter: drop-shadow()` so the glow follows the circle's radius; remove the conflicting static `shadow-[0_0_36px_...]`; add `will-change:transform`.

```tsx
// before: animate={{ boxShadow:[...] }} + className shadow-[0 0 36px ...] on rounded-[28px]
// after:
<motion.div
  className="... will-change-transform"
  animate={{ scale:[1,1.06,1], filter:["drop-shadow(0 0 6px rgba(0,184,235,.4))","drop-shadow(0 0 22px rgba(0,184,235,.85))","drop-shadow(0 0 6px rgba(0,184,235,.4))"] }}
  transition={{ duration:1.8, repeat:Infinity, ease:"easeInOut" }}
/>
```

- [ ] **Step 2: Verify (the reported bug):** create a room with bots, reach Speaking, pass turn, screenshot at glow peak. Expected: **round** glow, **no square clip**.
- [ ] **Step 3: Commit**: `git commit -am "fix(speaking): round drop-shadow glow, remove square-clip artifact"`

### Task 3.3: Phase transitions at the dispatcher

**Files:** Modify `sus/src/app/(game)/room/[code]/play/page.tsx`

- [ ] **Step 1:** Wrap the phase switch in `<AnimatePresence mode="wait" initial={false}>` and render the active phase inside a `motion.div` keyed by `round.status` using `phaseTransition`. Convert the switch into a `status → component` map for clarity.
- [ ] **Step 2: Verify:** advance through phases (with bots); confirm each phase enters/exits smoothly (Speaking/Discussion/Evidence no longer pop).
- [ ] **Step 3: Commit**: `git commit -am "feat(motion): animated transitions between all game phases"`

---

## PHASE 4 — Sound System

### Task 4.1: Sound engine (TDD on pure math)

**Files:** Create `sus/src/lib/sound/engine.ts`, `sus/src/lib/sound/__tests__/engine.test.ts`

- [ ] **Step 1: Write failing tests** for the pure helpers (scale/frequency + envelope params):

```ts
import { test, expect } from "vitest";
import { noteToFreq, scaleNote, envelopeTimes } from "../engine";
test("A4 is 440Hz", ()=> expect(Math.round(noteToFreq(69))).toBe(440));
test("pentatonic step maps to scale degree", ()=> expect(scaleNote(0)).toBe(scaleNote(0)));
test("envelope release targets 0.001 not 0", ()=>{
  const e = envelopeTimes({ attack:.002, duration:.2 });
  expect(e.releaseTarget).toBeCloseTo(0.001);
  expect(e.attack).toBeGreaterThan(0); // anti-click ramp
});
```

- [ ] **Step 2: Run, verify fail**

Run: `npm test`
Expected: FAIL (module not found / undefined exports).

- [ ] **Step 3: Implement `engine.ts`**

Single lazy `AudioContext`; `getContext()` resumes if suspended; master `GainNode` → destination with volume; `noteToFreq(midi)`, `scaleNote(degree)` (pentatonic major on a fixed tonic), `envelopeTimes()` (attack 1-2ms, exponential release to 0.001, gain ≤1.0); `playTone({freq,type,dur})` and `playNoise({dur:0.008,bandpass:4000,Q:3})` with `onended` cleanup (`disconnect()`); error-guarded.

- [ ] **Step 4: Run, verify pass**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**: `git add -A && git commit -m "feat(sound): Web Audio engine (single ctx, master gain, ADSR, noise/tone)"`

### Task 4.2: Event sound map + store

**Files:** Create `sus/src/lib/sound/sounds.ts`, `sus/src/lib/sound/index.ts`; Modify/replace `sus/src/lib/useSound.ts`, remove old `synthSounds.ts`

- [ ] **Step 1:** Define each event from spec §5.5 (`ui.click`, `lobby.join/leave`, `chat.message`, `role.reveal`, `phase.enter`, `turn.you`, `vote.cast`, `vote.consensus`, `timer.tick`, `result.win/lose`, `round.next`, `error`) as a function composing engine primitives on the shared scale. Clicks/tick use `playNoise`; tonal use `playTone` with pitch sweep.
- [ ] **Step 2:** `index.ts` exports `playSound(event)`, volume/mute external store (localStorage `sus.sound.*`), `setVolume`, `toggleMute`. Migrate `useSound.ts` to wrap it (preserve existing API so current call sites keep working).
- [ ] **Step 3: Verify:** build + lint; in browser, trigger join/win — audible. Remove `synthSounds.ts`; Grep confirms no references.
- [ ] **Step 4: Commit**: `git add -A && git commit -m "feat(sound): cohesive event sound map + volume/mute store"`

### Task 4.3: Wire sounds into events (revive dead sounds)

**Files:** Modify `VotingPhase.tsx`, `Timer.tsx`, `FloatingChat.tsx`, `ResultsPhase.tsx`, `SpeakingPhase.tsx`, `DistributingPhase.tsx`, `play/page.tsx`

- [ ] **Step 1:** Call `playSound` at each trigger: vote cast (Voting), tick <10s with rising pitch (Timer), message send (FloatingChat), role reveal (Distributing), your-turn (Speaking), consensus (Speaking), phase enter (dispatcher), next round (Results).
- [ ] **Step 2:** Add volume slider + **sound test** in `GameSettingsButton`, and an inline mute indicator on the game screen.
- [ ] **Step 3: Verify:** play a full round with bots; each event audible and not clipping; mute works.
- [ ] **Step 4: Commit**: `git add -A && git commit -m "feat(sound): wire contextual sounds across phases + volume/test UI"`

---

## PHASE 5 — Per-screen re-skin + remaining bugs + UX

> Each task: apply tokens (no literals), apply motion (stagger enter + presses), confirm sounds fire, fix listed bugs/UX, then build+lint+screenshot. Commit per screen.

### Task 5.1: Home (`(game)/page.tsx`)
- [ ] Apply approved mockup: display title, tagline, avatar with `gentle`/bob, glass card, unified Buttons; helpful code-error copy; stagger enter for card children. Verify + commit.

### Task 5.2: Lobby (`room/[code]/page.tsx`, 794 lines) + split
- [ ] Extract `LobbyPanel`, `CodeBlock`, `Counter`, `useRoomSettings` into `components/game/lobby/`. Token-migrate. Add empty-state ("adicione jogadores ou bots"), bot-remove feedback, clarify code-visibility/copy. Player list staggered entry. Verify + commit.

### Task 5.3: Distributing split (508 lines)
- [ ] Split into `WaitingForRoles`, `MasterQuestionSetup`, `ReadyConfirmation`. Make **hold-to-reveal discoverable** (visual hint + ripple); per-role guidance; master field validation; disconnect → "Offline" after 10s instead of infinite "Lendo". Fix blur-flash (opacity+scale reveal, spec §7). `role.reveal` sound. Verify + commit.

### Task 5.4: Speaking
- [ ] Token-migrate; turn handoff with `spring` (old speaker out, new in); "sua vez" pop + sound; consensus copy ("faltam X votos"). (Glow already fixed in 3.2.) Verify + commit.

### Task 5.5: Answering
- [ ] Mobile keyboard-safe textarea (don't push submit off-screen); char counter; clear master affordance/tone; send sound + feedback. Verify on small viewport + commit.

### Task 5.6: Revealing
- [ ] Card cascade `staggerItem` + brief pulse on reveal; countdown tick escalation. Verify + commit.

### Task 5.7: Discussion + Evidence
- [ ] Animated entry; microcopy ("compare as respostas; o impostor pode ter escorregado"); timer tabular + tick. Verify + commit.

### Task 5.8: Voting
- [ ] Token-migrate cards; focus-visible on vote buttons; vote feedback (sound+state); **upfront** "Mestre/espectador não vota" near the action; keep odd-grid centering. Verify + commit.

### Task 5.9: Results split (499 lines)
- [ ] Split into `ResultsDisplay`, `Leaderboard`, `ShareSection`. Impostor reveal with weight; placar `.tnum`; fix AnimatePresence (`initial={false}`, keys); win/lose + `round.next` sounds. Verify + commit.

### Task 5.10: Profile
- [ ] Empty history state ("jogue uma rodada para registrar histórico"); avatar/edit consistency; token-migrate. Verify + commit.

### Task 5.11: Banner + Footer + reactions
- [ ] ConvexStatusBanner uses `--color-imp` (not red-500 raw); Footer hit areas; ReactionAnchor `overflow:visible` fix (spec §7); aria-labels via i18n keys. Verify + commit.

---

## PHASE 6 — Accessibility & responsiveness pass

### Task 6.1: Helpers + filter consolidation (TDD)
**Files:** Create `sus/src/lib/players.ts` + test
- [ ] Write failing tests for `getActivePlayers`/`getVotingPlayers` (exclude disconnected/spectator/bot per rules). Run (fail). Implement. Run (pass). Replace ad-hoc filters across phases. Commit.

### Task 6.2: A11y sweep
- [ ] Verify focus order, contrast (AA) for game palette on light+dark, `aria-live` on timer/vote counts, `aria-describedby` on fields, reduced-motion across new animations, mobile layouts (iPhone SE). Fix gaps. Commit.

---

## PHASE 7 — Verification & review sweep

### Task 7.1: Run audit skills
- [ ] Run `generating-sounds-with-ai` on `src/lib/sound/*` → fix any HIGH/MEDIUM findings.
- [ ] Run `mastering-animate-presence` on phase/modal code → fix exit/`initial={false}`/key issues.
- [ ] Run `web-design-guidelines` on changed UI → address a11y/UX findings.
- [ ] Commit fixes.

### Task 7.2: Visual regression + code review
- [ ] Screenshot every screen (dark + light) via agent-browser; compare to `docs/superpowers/baseline/`. Confirm the speaker-glow fix visually.
- [ ] Run `/code-review` on the branch; address findings.
- [ ] `npm run build && npm run lint && npm test` all green.
- [ ] Final commit; redesign branch ready for PR.

---

## Self-Review (author checklist — completed)

- **Spec coverage:** §3 tokens→P1; §4 motion→P3 + presses in P2/P5; §5 sound→P4; §6 primitives→P2; §7 bugs→3.2 (glow), 2.4 (input), 2.6 (select ring), 5.11 (reactions), 5.3 (blur flash); §8 screens→P5; §9 a11y→P2.6/P6; §10 refactors→2.1/2.2/2.5/5.2/5.3/5.9/6.1; §11 phasing→phase order; §12 verification→P0 baseline + P7.
- **Placeholders:** none — each task names exact files, concrete values (from spec), and a verification command/visual outcome.
- **Type consistency:** sound API (`playSound`, `getContext`, `noteToFreq`, `scaleNote`, `envelopeTimes`, `playTone`, `playNoise`) consistent across 4.1→4.3; motion exports (`spring`, `phaseTransition`, `staggerItem`) consistent across 3.x/5.x; `getActivePlayers/getVotingPlayers` defined in 6.1 and consumed there.
