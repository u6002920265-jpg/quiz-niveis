# 🏗️ Agent Team Review — Quiz Níveis de Pensamento

## Team Roster
| Role | Focus |
|---|---|
| **Sofia** — UX/UI Designer | User experience, visual design, mobile interaction patterns |
| **Marco** — Frontend Architect | Component structure, state management, performance |
| **Ana** — Technical Architect | System design, build pipeline, deployment, scalability |
| **Pedro** — Data & Persistence Expert | Data model, localStorage strategy, obfuscation |
| **Diogo** — Devil's Advocate | Challenges assumptions, finds edge cases, stress-tests decisions |

---

## 🎨 Sofia — UX/UI Designer

### Strengths
- Dark luxury theme matching the image is a strong visual identity choice. Cohesive brand feel.
- Bottom sheet for viewing assigned names is the right mobile pattern — familiar to iOS/Android users.
- Count badges (3/12) are a clean solution for showing state without cluttering the circle.

### Concerns

**1. Drag-and-drop on mobile is a HARD problem.**
The spec says "true drag-and-drop" with dnd-kit. On mobile, dragging conflicts with scrolling. When the user touches a name pill and drags upward toward the circle, the browser may interpret this as a scroll gesture instead. **Recommendation:** Use `touch-action: none` on draggable elements. dnd-kit's `TouchSensor` with an activation constraint (e.g., `distance: 8px` or `delay: 250ms`) will disambiguate drag vs scroll. I recommend a short delay (150ms press) before drag activates.

**2. The circle is only ~300px wide at 390px viewport.**
With 5 slices and angular detection, some targets are tiny. Nível 4 and Génio Estratégico each occupy maybe ~40° of arc — that's a slim wedge. The user dragging a pill with their thumb will cover most of the target.  **Recommendation:** Make the drop detection generous — if the drop point is within the circle radius, always assign to the nearest angular sector. Never reject a drop that's inside the circle.

**3. Opaque overlays hiding names on the image are fragile.**
The overlay divs must be pixel-positioned over the image text. At exactly 390px this works, but any slight rendering difference across browsers/devices will misalign them. **Recommendation:** Make overlays 10-15% larger than strictly needed, with slight feathered edges (gradient from slice-color to transparent) so imprecise alignment still looks natural.

**4. Pool scrolling with 21 pills below the circle.**
The image is ~600px tall at 390px width. The header is ~50px. That leaves maybe ~200px for the pool on a 844px iPhone screen. 21 pills in flex-wrap at small sizes = ~3-4 rows = ~160px. It fits, but barely. After some names are placed, the pool shrinks. **Recommendation:** Keep the pool area a fixed min-height so the layout doesn't jump as pills disappear. Use `min-h-[160px]`.

**5. Bottom sheet + drag-and-drop conflict.**
If the user taps a badge to open the bottom sheet, and then wants to close it to drag another name — the interaction flow could feel clunky. **Recommendation:** Bottom sheet should have a clear close button AND close on backdrop tap. It should also slide down smoothly (300ms ease-out).

### Design Tokens I'd Propose
```
--color-bg: #1a1008
--color-bg-secondary: #2a1a0f  
--color-gold: #d4a34a
--color-gold-light: #e8c675
--color-green-lock: #4ade80
--color-text: #f5e6d0
--color-text-muted: #a08060
```

---

## 🔧 Marco — Frontend Architect

### Component Architecture

```
App
├── WelcomeScreen
├── QuizScreen
│   ├── Header (title, attempts, sound toggle, verify btn)
│   ├── CircleBoard
│   │   ├── CircleImage (nivel.png + overlays)
│   │   └── DropZone × 5 (invisible, angular detection)
│   ├── NamePool
│   │   └── DraggablePill × N
│   └── BottomSheet
│       └── AssignedNamesList
├── ReportScreen
└── LandscapeBlocker
```

### State Management

No Redux/Zustand needed for this size. A single `useReducer` with this shape:

```typescript
interface QuizState {
  screen: 'welcome' | 'quiz' | 'report';
  assignments: Map<string, number>;    // nameId → levelId
  lockedNames: Set<string>;            // nameIds confirmed correct
  attempt: number;                     // 1-3
  shuffledNames: string[];             // shuffled order for pool
  bestScore: number;                   // cumulative best across attempts
  currentScore: number;                // current cumulative locked / 21
  soundEnabled: boolean;
  allTimeBestScore: number;            // persisted across sessions
}
```

### Key Technical Decisions

**1. dnd-kit setup.**
Use `DndContext` with `TouchSensor` and `MouseSensor`. The drop zones are NOT standard dnd-kit `Droppable` components — instead, use `onDragEnd` with the pointer coordinates to do angular detection ourselves. This means we use dnd-kit purely for the drag UX (pickup, drag overlay, pointer tracking) and handle drop logic manually.

**2. Angular detection algorithm.**
```typescript
function getSliceForPoint(x: number, y: number, circleCenter: {x: number, y: number}, circleRadius: number): number | null {
  const dx = x - circleCenter.x;
  const dy = y - circleCenter.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > circleRadius) return null; // outside circle
  
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  angle = (angle + 360) % 360; // normalize to 0-360
  
  // Map angle ranges to slices (tuned from image)
  if (angle >= 230 && angle < 330) return 1; // top = Conformista
  if (angle >= 150 && angle < 230) return 2; // bottom-left = Individualista
  if (angle >= 330 || angle < 60)  return 3; // right = Sintetista
  if (angle >= 120 && angle < 150) return 4; // bottom-center-left = Generativo
  if (angle >= 60 && angle < 120)  return 5; // bottom-center-right = Génio
  return null;
}
```
These angles will need calibration against the actual image.

**3. Performance concern: dnd-kit drag overlay.**
On mobile, the drag overlay (the pill following the finger) must be rendered with `transform: translate3d()` for GPU acceleration. dnd-kit handles this by default with `DragOverlay`, but we need to ensure we're using it and not re-rendering the whole component tree on each pointer move.

**4. Verify animation.**
After clicking "Verificar": 
- Set a `verifying: true` state flag
- Compute results synchronously
- Render all badges with green/red flash simultaneously  
- After 600ms, update state: lock correct names, return wrong names to pool
- If attempt 3 or 100%, transition to report

### Concern: Image as background with overlays
The image coordinates must be determined by measuring the actual pixel positions of the text areas in `nivel.png`. This is manual calibration work. I'll define these as percentage-based coordinates relative to the image dimensions so they scale correctly.

---

## 🏛️ Ana — Technical Architect

### Build & Deploy Pipeline

**Vite config considerations:**
- The `nivel.png` image is 3MB. We MUST optimize it. Convert to WebP for ~70% size reduction while maintaining visual quality. Keep original PNG as fallback.
- Or better: since the image has large areas of solid color/gradient, we could get it down to ~500KB with aggressive PNG compression (pngquant).
- Set `base: '/'` in vite.config for Vercel deployment.

**Recommended project structure:**
```
quiz-app/
├── public/
│   └── nivel.png          (original, used on report screen)
├── src/
│   ├── assets/
│   │   └── nivel-quiz.webp (optimized, used during quiz)
│   ├── components/
│   │   ├── WelcomeScreen.tsx
│   │   ├── QuizScreen.tsx
│   │   ├── CircleBoard.tsx
│   │   ├── NamePool.tsx
│   │   ├── DraggablePill.tsx
│   │   ├── BottomSheet.tsx
│   │   ├── Header.tsx
│   │   ├── ReportScreen.tsx
│   │   └── LandscapeBlocker.tsx
│   ├── data/
│   │   └── quizData.ts     (obfuscated answers)
│   ├── hooks/
│   │   ├── useQuizState.ts
│   │   ├── useSound.ts
│   │   ├── useHaptics.ts
│   │   └── useLocalStorage.ts
│   ├── utils/
│   │   ├── angleDetection.ts
│   │   ├── scoring.ts
│   │   └── obfuscation.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### Sound files
We need 4 short audio files (pop, chime, buzz, celebration). Options:
- Use the Web Audio API to generate tones programmatically (no files needed, ~50 lines of code)
- Bundle tiny MP3/OGG files (~5KB each)

**Recommendation:** Web Audio API synthesis. Zero network requests, tiny bundle, works offline. Generate simple sine/square wave tones with ADSR envelopes.

### Haptics
Use `navigator.vibrate()` — widely supported on Android Chrome, **not supported on iOS Safari**. This is a known limitation. On iOS, there's no web API for haptic feedback. We should document this and degrade gracefully.

### Portrait lock
The Screen Orientation API (`screen.orientation.lock('portrait')`) requires fullscreen mode on most browsers and has limited support. More reliable: detect orientation via `window.matchMedia('(orientation: landscape)')` and show an overlay.

---

## 💾 Pedro — Data & Persistence Expert

### Data Model

```typescript
// Obfuscated at rest, decoded at runtime
interface Level {
  id: number;
  name: string;          // "Conformista"
  fullName: string;      // "Nível 1 — Conformista"
  capacity: number;      // 12
  members: string[];     // decoded from obfuscated source
  // Angular boundaries for drop detection
  angleStart: number;    
  angleEnd: number;
}
```

### Obfuscation Strategy

Base64 is trivially reversible. Better approach — **simple XOR cipher with a static key**. Still easily breakable by a dev, but the data won't be plaintext-readable in a global search or casual source view.

```typescript
// Encode at build time, decode at runtime
const KEY = 'aNossaTurma2024';
function xorCipher(text: string, key: string): string {
  return Array.from(text).map((c, i) => 
    String.fromCharCode(c.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
}
```

Store encoded data as hex strings. Decode on app init.

### localStorage Schema

```typescript
// Key: 'quiz-niveis-state'
interface PersistedQuizState {
  assignments: Record<string, number>; // nameId → levelId
  lockedNames: string[];
  attempt: number;
  shuffledOrder: string[];             // preserve shuffle across reload
}

// Key: 'quiz-niveis-prefs'
interface PersistedPrefs {
  allTimeBestScore: number;
  soundEnabled: boolean;
}
```

**Important:** Use `try/catch` around all localStorage operations. Safari in private browsing mode throws on `setItem` when quota is exceeded (which can be 0 bytes). Degrade gracefully — the quiz works fine without persistence.

### Data integrity concern
If someone manually edits localStorage to set `lockedNames` to all 21 names, they could fake a perfect score. Since we don't care about cheating (it's a fun group quiz), this is acceptable.

---

## 😈 Diogo — Devil's Advocate

### Challenge 1: "True drag-and-drop is the wrong choice for this app."

I'll say it: drag-and-drop on a 390px screen with 21 names and 5 small pie slices is going to be **frustrating**. The user is dragging with their thumb — which covers ~44px of screen — over a circle that's ~300px wide. The slices for Nível 4 and Génio are ~60px across. The thumb obscures the target.

Tap-to-assign (tap name → tap level) would be 10x better UX for this specific layout. But the spec says drag-and-drop, so we commit. **Mitigation:** Make drag pills smaller during drag (scale 0.8), use a drag overlay offset so the pill appears above the thumb, not under it.

### Challenge 2: "Opaque overlays on an image background will look janky."

Even with generous sizing, color-matched overlays on a rasterized image will show seams. The image has gradients, glow effects, and subtle textures. A flat `background-color` div won't match. **Mitigation:** Use `backdrop-filter: blur(8px)` on the overlays with 80% opacity in the slice color. The blur will hide the text underneath while blending naturally with the image.

### Challenge 3: "The 3MB image will destroy the initial load experience."

Users will open this from WhatsApp on mobile data. A 3MB PNG will take 3-5 seconds on a mediocre connection. First impression = blank screen for 5 seconds. **Mitigation:** MUST compress/convert the image. Also implement a loading state with the quiz title visible immediately.

### Challenge 4: "Angular detection won't work perfectly."

The slices in the image aren't mathematically precise pie sectors — they have irregular boundaries, spacing between them, and a center that isn't a perfect mathematical point. Pure angle-based detection will have dead zones and overlapping zones. **Mitigation:** Use angular detection as the primary method but add a dead-zone buffer (if the drop is near a boundary, bias toward the larger/emptier slice). Also detect drops outside the circle radius and snap back.

### Challenge 5: "localStorage persistence creates a weird UX."

If a user starts the quiz, places 10 names, closes the tab, then opens the link again 3 days later — they'll land mid-quiz with a half-forgotten state. They might not remember what they were doing. **Mitigation:** Add a "Continuar" / "Novo Jogo" choice on the welcome screen if there's a saved state. Don't auto-resume silently.

### Challenge 6: "Best score is meaningless if correct names carry over."

Since correct names lock between attempts, the score always improves. The "best cumulative score" is simply the score after the last attempt used. It never goes down. The "best score" stat is really just "how far did you get." This is fine for the fun factor but it means every user will trend toward 100% over 3 attempts. **Mitigation:** This is actually a feature, not a bug. The quiz is designed to be satisfying, not punishing. Accept it.

### Challenge 7: "Web Share API fallback needs care."

`navigator.share()` is not supported on desktop browsers (Firefox, Chrome desktop). The clipboard fallback must be robust. Also, the share text includes a [link] — but the actual URL will depend on where it's deployed. We need to use `window.location.href` dynamically.

---

## 📋 Team Consensus — Implementation Recommendations

Based on the full team review, here are the **critical adjustments** before implementation:

1. **Compress `nivel.png`** — from 3MB to <500KB. Add a loading splash.
2. **dnd-kit touch sensor with delay** — 150ms press delay to distinguish drag from scroll.
3. **Drag overlay offset** — pill appears above thumb, slightly scaled down during drag.
4. **Overlay styling** — use `backdrop-filter: blur()` + semi-transparent slice color, not pure opaque divs.
5. **Welcome screen save detection** — show "Continuar" vs "Novo Jogo" if saved state exists.
6. **Sound via Web Audio API** — no audio files needed, synthesize tones programmatically.
7. **iOS haptics graceful degradation** — `navigator.vibrate` doesn't work on iOS Safari; silently skip.
8. **Generous angular detection** — bias toward nearest non-full slice on boundary drops.
9. **localStorage try/catch** — handle Safari private browsing and quota errors.
10. **Image load state** — show title and loading indicator until nivel.png is loaded.
