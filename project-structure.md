# RSVP Speed Reader - Project Structure

## Design Principles
- **Write simple, readable code**
- **Flat is better than nested**
- **Accomplish more with less complexity**
- **Only abstract when there's actual duplication**
- **Start minimal, grow as needed**

## Proposed Structure

```
speed-reader/
├── src/
│   ├── components/
│   │   ├── Reader.ts         # Main reading display logic
│   │   ├── Controls.ts       # Play/pause, speed, navigation
│   │   ├── Progress.ts       # Progress bar and stats
│   │   ├── SavedTexts.ts     # Horizontal saved texts navigation
│   │   └── TextInput.ts      # Text input area
│   ├── utils/
│   │   ├── textProcessor.ts  # Split text, calculate timings
│   │   └── storage.ts        # Local storage for saved texts
│   ├── types.ts              # TypeScript interfaces
│   ├── main.ts               # App initialization
│   └── styles.css            # All styles (mobile-first)
├── index.html                # Minimal HTML shell
├── package.json              # Dependencies (minimal)
├── tsconfig.json             # TypeScript config
└── vite.config.ts            # Build configuration
```

## File Breakdown

### `index.html` (~20 lines)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RSVP Speed Reader</title>
</head>
<body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

### `src/types.ts`
```typescript
export interface ReaderState {
    words: string[];
    currentIndex: number;
    isPlaying: boolean;
    wpm: number;
    activeTextId?: string;
}

export interface SavedText {
    id: string;
    title: string;
    content: string;
    lastPosition?: number;
    createdAt: number;
}

export interface ReaderConfig {
    defaultWPM: number;
    skipPercentage: number;
    maxSavedTexts: number;
}
```

### `src/utils/textProcessor.ts` (~20 lines)
```typescript
export function splitText(text: string): string[] {
    return text.trim().split(/\s+/).filter(word => word.length > 0);
}

export function calculateDelay(wpm: number): number {
    return 60000 / wpm;
}

export function calculateTimeRemaining(wordsLeft: number, wpm: number): string {
    const seconds = (wordsLeft / wpm) * 60;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

### `src/components/SavedTexts.ts`
Horizontal scrollable bar showing saved texts. Each saved text shows title and can be clicked to load. Includes delete option and shows currently active text.

### `src/components/Reader.ts`
Core display logic, word positioning, and rendering. Handles the actual RSVP display with previous/current/next word context. Optimized for small window display.

### `src/components/Controls.ts`
Play/pause, speed slider, navigation buttons. Compact layout for small windows. Touch-friendly buttons.

### `src/components/Progress.ts`
Progress bar and statistics display. Shows reading progress and time remaining in minimal space.

### `src/components/TextInput.ts`
Collapsible text input area. Can be minimized when reading to save space. Auto-saves drafts.

### `src/utils/storage.ts`
```typescript
export function saveText(text: SavedText): void {
    const saved = getSavedTexts();
    saved.unshift(text);
    localStorage.setItem('savedTexts', JSON.stringify(saved.slice(0, 20)));
}

export function getSavedTexts(): SavedText[] {
    return JSON.parse(localStorage.getItem('savedTexts') || '[]');
}

export function deleteText(id: string): void {
    const saved = getSavedTexts().filter(t => t.id !== id);
    localStorage.setItem('savedTexts', JSON.stringify(saved));
}
```

### `src/main.ts`
Wire everything together, handle keyboard shortcuts, manage application state. Responsive layout management.

### `src/styles.css`
Keep all styles in one CSS file - no need to split

## Layout for Small Windows

### Vertical Stack (top to bottom)
```
┌─────────────────────────────┐
│ Saved Texts (scrollable →)  │ ← 40px height
├─────────────────────────────┤
│                             │
│     Current Word Display    │ ← 120px height
│     (Previous | Current |   │
│            Next)            │
├─────────────────────────────┤
│ Controls & Progress         │ ← 60px height
├─────────────────────────────┤
│ Text Input (collapsible)    │ ← Remaining space
└─────────────────────────────┘
```

### Small Window Optimizations
- **Minimum viable size**: 300x400px
- **Touch-friendly**: All buttons minimum 44x44px
- **Readable fonts**: Minimum 14px, current word 24px+
- **Collapsible sections**: Text input can minimize to save space
- **Horizontal scroll**: Saved texts scroll horizontally
- **Compact controls**: Icon-only buttons with tooltips
- **Persistent state**: Remember collapsed/expanded preferences

### Responsive Breakpoints
```css
/* Tiny window (1/9 screen) */
@media (max-width: 400px) {
    /* Stack controls vertically */
    /* Hide text labels, show icons only */
    /* Reduce padding/margins */
}

/* Small window */
@media (max-width: 600px) {
    /* Abbreviated stats */
    /* Smaller fonts where safe */
}
```

## What We're NOT Doing

### ❌ Over-abstraction
- No `AbstractReader`, `IWordDisplay`, `ReaderFactory`
- No dependency injection for a simple speed reader
- No separate files for constants (just use them inline)

### ❌ Over-organization
- No `src/interfaces/`, `src/models/`, `src/services/`
- No barrel exports (`index.ts` in every folder)
- No separate config files for everything

### ❌ Framework overhead
- No Redux/Vuex for state (just use a simple object)
- No routing (it's a single page)
- No component library (we have like 3 UI elements)

## Build Setup (Minimal)

### `package.json`
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

## Saved Texts Feature

### How it works
1. **Auto-title generation**: First 30 chars of text or custom title
2. **Quick save**: Ctrl/Cmd + S to save current text
3. **Resume reading**: Saves last position when switching texts
4. **Storage limit**: Keep last 20 saved texts (FIFO)
5. **Visual indicators**: Highlight currently active text

### SavedTexts Component Structure
```typescript
// Minimal API
interface SavedTextsProps {
    texts: SavedText[];
    activeId?: string;
    onSelect: (text: SavedText) => void;
    onDelete: (id: string) => void;
}
```

### User Flow
1. Type/paste text → Auto-saved as draft
2. Click "Save" or Ctrl+S → Added to saved texts
3. Click saved text → Loads and resumes from last position
4. Hover → Show preview tooltip
5. Right-click → Delete option

## Component Communication

Simple event-based or callback approach:
```typescript
// In main.ts
const state: ReaderState = {
    words: [],
    currentIndex: 0,
    isPlaying: false,
    wpm: 300
};

// Components receive state and callbacks
const controls = new Controls(state, {
    onPlay: () => reader.play(),
    onPause: () => reader.pause(),
    onSpeedChange: (wpm) => reader.setSpeed(wpm)
});
```

## Why This Structure?

1. **Logical separation** - Each file has a clear purpose
2. **Easy to navigate** - Flat structure, descriptive names
3. **No magic** - Explicit imports, no auto-discovery
4. **Testable** - Pure functions in utils, clear component boundaries
5. **Growable** - Easy to add features without restructuring

## Migration Path

1. **Step 1**: Set up Vite and TypeScript
2. **Step 2**: Create layout structure with placeholder components
3. **Step 3**: Port Reader display logic with small window optimizations
4. **Step 4**: Implement SavedTexts with localStorage
5. **Step 5**: Port Controls with compact layout
6. **Step 6**: Add TextInput with collapsible behavior
7. **Step 7**: Wire together in main.ts with responsive handling
8. **Step 8**: Style for small windows first, enhance for larger

Benefits: 
- Modular, typed, easier to maintain
- Works great in tiny windows 
- Persistent saved texts
- Better user workflow