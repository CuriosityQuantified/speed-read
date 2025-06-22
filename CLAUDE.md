# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a standalone RSVP (Rapid Serial Visual Presentation) speed reading web application implemented as a single HTML file with embedded CSS and JavaScript.

## Development Environment

**No build tools or dependencies** - This is a pure HTML/CSS/JavaScript application that runs directly in the browser.

**Browser Requirements**: Any modern browser with ES6+ JavaScript support

## Running the Application

```bash
# Open directly in browser
open speed_reader.html  # macOS
# OR
start speed_reader.html  # Windows
# OR
xdg-open speed_reader.html  # Linux

# Serve locally with Python (optional)
python -m http.server 8000
# Then navigate to http://localhost:8000/speed_reader.html
```

## Code Architecture

### Single-File Structure
All code is contained within `speed_reader.html`:
- **HTML** (lines 1-312): Application structure and UI elements
- **CSS** (lines 7-252): Embedded styles in `<style>` tag
- **JavaScript** (lines 313-577): Application logic in `<script>` tag

### Key JavaScript Components

**Global State Variables**:
- `words`: Array of words from the input text
- `currentIndex`: Current word position
- `isPlaying`: Playback state
- `interval`: Timer reference for word display

**Core Functions**:
- `startReading()`: Initiates the reading session
- `togglePlayPause()`: Controls playback state
- `displayWord()`: Handles word presentation with ORP calculation
- `updateProgress()`: Updates progress bar and statistics
- `calculateOptimalRecognitionPoint()`: Implements ORP algorithm for word centering

### User Interface Features

1. **Input Area**: Textarea for text input
2. **Control Panel**: 
   - WPM slider (100-1000)
   - Play/Pause, Rewind, Fast Forward buttons
   - Progress bar
3. **Display Area**: 
   - Previous words context
   - Current word with ORP highlighting
   - Next words preview
4. **Statistics**: Word count, elapsed time, estimated time

### Keyboard Shortcuts

- **Space/Enter**: Toggle play/pause
- **Left Arrow**: Rewind (10 words back)
- **Right Arrow**: Fast forward (10 words)
- **Up Arrow**: Increase speed (+50 WPM)
- **Down Arrow**: Decrease speed (-50 WPM)

## Making Changes

### Adding Features
When adding new features, maintain the single-file architecture unless absolutely necessary. Key areas to consider:

1. **New Controls**: Add HTML elements in the control panel section
2. **Styling**: Add CSS rules within the existing `<style>` tag
3. **Logic**: Add JavaScript functions after the existing helper functions
4. **Event Listeners**: Add new listeners in the initialization section

### Common Modifications

**Changing Word Display Timing**:
```javascript
// In displayWord() function
const msPerWord = 60000 / wpm;  // Modify this calculation
```

**Adjusting Context Words**:
```javascript
// In displayWord() function
const prevWordsToShow = 2;  // Change these values
const nextWordsToShow = 2;
```

**Modifying ORP Algorithm**:
See `calculateOptimalRecognitionPoint()` function for the word centering logic.

## Testing Approach

Since there's no formal testing framework:
1. Test all keyboard shortcuts manually
2. Verify speed calculations (WPM accuracy)
3. Test with various text lengths and formats
4. Check responsive design on different screen sizes
5. Validate progress tracking and statistics

## Deployment

This is a static file that can be deployed anywhere:
- GitHub Pages
- Netlify/Vercel (drop file)
- Any static web server
- Local file system (file:// protocol)