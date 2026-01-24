# Speed Reader

A modern speed reading application using Rapid Serial Visual Presentation (RSVP) technology with Optimal Recognition Point (ORP) highlighting.

## Features

- **RSVP Reading**: Words appear one at a time in the center of the screen
- **Red Anchor Character**: Optimal Recognition Point (ORP) highlighted in red for eye focus
- **Multiple Input Methods**:
  - Direct text paste
  - PDF file upload
  - DOCX/DOC file upload
  - URL web scraping
- **Speed Control**: Adjustable reading speed from 100 to 1000 words per minute
- **Navigation**: 
  - Play/pause controls
  - Skip forward/backward by word or sentence
  - Full text view with current word highlighting
- **Keyboard Shortcuts**:
  - `Space`: Play/Pause
  - `←`: Previous sentence
  - `→`: Next sentence
  - `↑`: Increase speed (+25 WPM)
  - `↓`: Decrease speed (-25 WPM)
  - `ESC`: Switch to full text view

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
npm start
```

## How It Works

### Optimal Recognition Point (ORP)

The red anchor character is positioned based on word length:
- **1-2 letters**: First character
- **3-5 letters**: Second character
- **6-9 letters**: Third character
- **10-13 letters**: Fourth character
- **14+ letters**: Fifth character

This follows research showing optimal fixation points for word recognition.

### Reading Speed

Words are displayed with adaptive timing:
- Base duration calculated from WPM setting
- Longer words get slightly more display time
- Punctuation pauses: commas (1.5x), periods/exclamation/question marks (2.5x)

## Technology Stack

- **Next.js 14**: React framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Framer Motion**: Smooth animations
- **Zustand**: State management
- **PDF.js**: PDF parsing
- **Mammoth**: DOCX parsing
- **Cheerio**: Web scraping

## Project Structure

```
speed_read/
├── app/
│   ├── api/scrape/     # URL scraping API route
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/
│   ├── ContentInput.tsx    # Input methods UI
│   ├── ReadingView.tsx     # RSVP reading interface
│   ├── ReadingControls.tsx # Control panel
│   ├── PageView.tsx        # Full text view
│   └── WordDisplay.tsx     # Word display component
├── lib/
│   ├── textProcessor.ts    # Text processing & ORP calculation
│   ├── store.ts            # Zustand state management
│   └── contentParsers.ts   # File parsing utilities
└── package.json
```

## License

MIT


# speed_read
