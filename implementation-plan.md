# RSVP Speed Reader - Implementation Plan

## Overview
Step-by-step plan to migrate from single HTML file to TypeScript + Vite modular architecture with saved texts and small window optimization.

## Progress Tracking

### Phase 1: Project Setup ✅
- [x] Initialize npm project
- [x] Install Vite and TypeScript
- [x] Create folder structure
- [x] Set up configuration files
- [x] Verify build process works

### Phase 2: Basic Layout Structure ✅
- [x] Create index.html shell
- [x] Implement responsive layout CSS
- [x] Create placeholder components
- [x] Test small window display (300x400px)
- [x] Implement collapsible sections
- [x] Add vertical scrollbar for text input area
- [x] Ensure proper overflow handling for main window

### Phase 3: Core Reading Logic ✅
- [x] Port Reader component
- [x] Port text processing utilities
- [x] Implement word display animation
- [x] Add keyboard shortcuts
- [x] Test reading functionality

### Phase 4: Controls & Navigation ✅
- [x] Port Controls component
- [x] Implement Progress component
- [x] Add speed controls
- [x] Implement play/pause/navigation
- [x] Optimize for touch/small screens

### Phase 5: Saved Texts Feature ✅
- [x] Create SavedTexts component
- [x] Implement storage utilities
- [x] Add horizontal scrolling UI
- [x] Implement save/load/delete
- [x] Add resume position feature

### Phase 6: Text Input Enhancement ✅
- [x] Create TextInput component
- [x] Add collapse/expand functionality
- [x] Implement auto-save drafts
- [x] Add save shortcuts (Ctrl+S)
- [x] Test with various text sizes

### Phase 7: Polish & Optimization ✅
- [x] Fine-tune small window layout
- [x] Add loading states
- [x] Implement error handling
- [x] Performance optimization
- [x] Cross-browser testing

### Phase 8: Migration & Deployment ⏳
- [ ] Create migration guide
- [ ] Build production version
- [ ] Test deployment
- [ ] Update documentation
- [ ] Archive old HTML version

---

## Detailed Steps

### Phase 1: Project Setup

#### 1.1 Initialize npm project
```bash
npm init -y
```

#### 1.2 Install dependencies
```bash
npm install -D vite typescript @types/node
```

#### 1.3 Create folder structure
```bash
mkdir -p src/{components,utils}
touch src/{main.ts,types.ts,styles.css}
touch index.html vite.config.ts tsconfig.json
```

#### 1.4 Set up TypeScript config
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "skipLibCheck": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

#### 1.5 Set up Vite config
```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000
  }
})
```

#### 1.6 Update package.json scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### Phase 2: Basic Layout Structure

#### 2.1 Create index.html
- Minimal HTML shell
- Viewport meta for mobile
- Link to main.ts

#### 2.2 Create base styles
- CSS Grid for main layout
- Mobile-first approach
- CSS custom properties for theming
- Vertical scrollbar for text input area (overflow-y: auto)
- Prevent main window scrolling (overflow: hidden on body)
- Ensure textarea is scrollable when content exceeds container

#### 2.3 Create layout components
- `src/components/Layout.ts` - Main container
- Define component interfaces
- Set up event system

### Phase 3: Core Reading Logic

#### 3.1 Define types
```typescript
// src/types.ts
export interface ReaderState {
  words: string[]
  currentIndex: number
  isPlaying: boolean
  wpm: number
  activeTextId?: string
}
```

#### 3.2 Port Reader component
- Extract display logic from HTML
- Implement word positioning
- Add animation handling

#### 3.3 Port text processing
- Move word splitting logic
- Add timing calculations
- Implement ORP if needed

### Phase 4: Controls & Navigation

#### 4.1 Create Controls component
- Play/pause button
- Speed slider
- Navigation buttons
- Compact layout for small screens

#### 4.2 Create Progress component
- Progress bar
- Time remaining
- Word count
- Minimal space usage

### Phase 5: Saved Texts Feature

#### 5.1 Create storage utilities
```typescript
// src/utils/storage.ts
export const storage = {
  save: (text: SavedText) => { /* ... */ },
  load: () => { /* ... */ },
  delete: (id: string) => { /* ... */ }
}
```

#### 5.2 Create SavedTexts component
- Horizontal scrolling container
- Text cards with titles
- Active state indication
- Delete functionality

#### 5.3 Implement persistence
- Save to localStorage
- Handle storage limits
- Implement FIFO eviction

### Phase 6: Text Input Enhancement

#### 6.1 Create TextInput component
- Textarea with auto-resize
- Collapse/expand toggle
- Character/word count

#### 6.2 Add keyboard shortcuts
- Ctrl/Cmd+S to save
- Escape to collapse
- Tab navigation

### Phase 7: Polish & Optimization

#### 7.1 Performance optimization
- Debounce storage operations
- Optimize re-renders
- Lazy load saved texts

#### 7.2 Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support

#### 7.3 Error handling
- Storage quota exceeded
- Invalid text handling
- Graceful degradation

### Phase 8: Migration & Deployment

#### 8.1 Build optimization
```bash
npm run build
```

#### 8.2 Test production build
```bash
npm run preview
```

#### 8.3 Update documentation
- Update README
- Create migration guide
- Update CLAUDE.md

---

## Notes

### Component Communication Pattern
Using simple callbacks to avoid complexity:
```typescript
// Parent (main.ts)
const handleTextSelect = (text: SavedText) => {
  state.words = splitText(text.content)
  state.currentIndex = text.lastPosition || 0
  reader.update(state)
}

// Child component
savedTexts.onSelect = handleTextSelect
```

### State Management
Keep it simple with a single state object:
```typescript
let state: ReaderState = {
  words: [],
  currentIndex: 0,
  isPlaying: false,
  wpm: 300
}
```

### Testing Strategy
- Manual testing for UI/UX
- Focus on small window scenarios
- Test with real texts of various lengths
- Verify localStorage limits

---

## Current Status
**Last Updated**: 2025-06-22
**Current Phase**: Phase 7 Complete, Ready for Phase 8
**Blockers**: None
**Next Step**: Migration guide and production deployment

## Phase 7 Completion Notes
- Created comprehensive small window optimization styles (300x400px target)
- Implemented loading states with visual feedback for async operations
- Added error handling system with user-friendly notifications
- Performance optimizations implemented:
  - Debounced text input and save operations
  - RAF-scheduled display updates for smooth animations
  - Throttled position updates to reduce localStorage writes
- Cross-browser compatibility:
  - Added browser-specific CSS fixes
  - Implemented polyfills for older browsers
  - Tested webkit, Firefox, Edge, and Safari specific issues
- Features added:
  - Loading spinners for saved texts
  - Success/error states for save operations
  - Browser feature detection and warnings
  - Print-friendly styles
  - Dark mode support
  - High contrast mode support
  - Reduced motion support

## Phase 6 Completion Notes
- Created modular TextInput component with enhanced features
- Implemented smooth collapse/expand animation with visual feedback
- Added auto-save drafts with 2-second delay and localStorage persistence
- Integrated word/character count display
- Enhanced keyboard shortcuts (Ctrl/Cmd+S already working)
- Visual feedback for save operations
- Draft recovery on page reload
- Clear draft when saving or loading saved texts
- Features implemented:
  - Responsive design for small screens
  - Visual draft saved indicator
  - Escape key to cancel title editing in saved texts
  - Expand text area when creating new text

## Phase 5 Completion Notes
- Created SavedTexts component with horizontal scrolling UI
- Implemented StorageManager for localStorage persistence
- Added save/load/delete functionality with visual feedback
- Implemented resume position feature with throttled updates
- Added keyboard shortcut (Ctrl/Cmd+S) for saving texts
- Integrated saved texts with main application state
- Features implemented:
  - Auto-generated titles from first line of text
  - Progress tracking (percentage complete)
  - FIFO eviction when storage limit reached (20 texts max)
  - Active text indication
  - Position updates while reading

## Phase 4 Completion Notes
- Created separate Controls and Progress components for better modularity
- Enhanced controls with proper button states and visual feedback
- Added touch gesture support for mobile/tablet users:
  - Tap to play/pause
  - Swipe left/right for navigation
  - Swipe up/down for speed control
- Improved responsive design for small screens
- All controls properly styled with hover states and transitions