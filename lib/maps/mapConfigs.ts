/**
 * Map progression config — single source of truth for both game maps.
 *
 * ─── HOW TO TUNE NODE POSITIONS ──────────────────────────────────────────────
 * Node `x` / `y` are PERCENTAGES (0–100) relative to the rendered map image:
 *   x: 0 = left edge, 100 = right edge
 *   y: 0 = top edge,  100 = bottom edge
 * Mobile and desktop use DIFFERENT images with DIFFERENT compositions, so each
 * breakpoint has its own node list. After changing values, visually check BOTH
 * a narrow window (<768px) and a wide window (>=768px) and nudge x/y until the
 * nodes sit on the painted path/landmarks. Region labels work the same way.
 *
 * ─── HOW TO SWAP MAP IMAGES ──────────────────────────────────────────────────
 * Replace the files in /public and update `image` + `aspectRatio` below.
 * aspectRatio = imageWidth / imageHeight (e.g. 1024/1536, 1448/1086).
 *
 * ─── HOW TO ADD A NEW LEVEL ──────────────────────────────────────────────────
 * 1. Add a meta entry to `levels` (id, levelNumber, title, region, wpm, xp).
 * 2. Add a coordinate entry with the SAME id to BOTH `layouts.mobile.nodes`
 *    and `layouts.desktop.nodes`.
 * 3. If the level exists in the database it is matched by position (level 1 ↔
 *    first DB level, etc.) and becomes playable; otherwise it renders as a
 *    "coming soon" locked node.
 */

export type MapTheme = 'adult' | 'kids';

export interface MapNodeCoord {
  /** Must match a `levels[].id` entry. */
  id: string;
  /** 0–100, % from the left edge of the map image. TUNE VISUALLY. */
  x: number;
  /** 0–100, % from the top edge of the map image. TUNE VISUALLY. */
  y: number;
}

export interface MapRegionLabel {
  label: string;
  /** 0–100 percentage coords, same system as nodes. TUNE VISUALLY. */
  x: number;
  y: number;
}

export interface MapLayout {
  /** Path under /public. */
  image: string;
  /** imageWidth / imageHeight — keeps the overlay aligned with the art. */
  aspectRatio: number;
  nodes: MapNodeCoord[];
  regionLabels: MapRegionLabel[];
}

export interface MapLevelMeta {
  id: string;
  levelNumber: number;
  /** Fallback title — overridden by the real DB title when one exists. */
  title: string;
  description: string;
  region: string;
  /** Fallback target WPM — overridden by DB value when available. */
  targetWpm: number | null;
  /** Fallback XP reward — overridden by DB value when available. */
  xpReward: number | null;
}

export interface MapConfig {
  id: MapTheme;
  title: string;
  subtitle: string;
  theme: MapTheme;
  levels: MapLevelMeta[];
  layouts: {
    mobile: MapLayout;
    desktop: MapLayout;
  };
}

export const mapConfigs: Record<MapTheme, MapConfig> = {
  /* ════════════════════════════ ADULT MAP ════════════════════════════ */
  adult: {
    id: 'adult',
    title: "The Reader's Journey",
    subtitle: 'Build speed and comprehension with short reading challenges.',
    theme: 'adult',
    levels: [
      {
        id: 'adult-1',
        levelNumber: 1,
        title: 'The Book Nobody Can Read',
        description: 'Warm up at base camp with your first timed reading rep.',
        region: 'Base Camp',
        targetWpm: 200,
        xpReward: 25,
      },
      {
        id: 'adult-2',
        levelNumber: 2,
        title: 'Why Your Brain Feels Full',
        description: 'Push a little faster and keep your comprehension sharp.',
        region: 'Base Camp',
        targetWpm: 250,
        xpReward: 25,
      },
      {
        id: 'adult-3',
        levelNumber: 3,
        title: 'The Animal That Refuses to Die',
        description: 'Enter Focus Canyon — fewer regressions, steadier eyes.',
        region: 'Focus Canyon',
        targetWpm: 300,
        xpReward: 25,
      },
      {
        id: 'adult-4',
        levelNumber: 4,
        title: 'The Secret History of Time',
        description: 'Hold your pace through denser material.',
        region: 'Focus Canyon',
        targetWpm: 350,
        xpReward: 25,
      },
      {
        id: 'adult-5',
        levelNumber: 5,
        title: 'The Fastest Mind in the Room',
        description: 'Speed Ridge — chunk words and trust your eyes.',
        region: 'Speed Ridge',
        targetWpm: 450,
        xpReward: 25,
      },
      {
        id: 'adult-6',
        levelNumber: 6,
        title: 'How Memory Tricks You',
        description: 'High-altitude reading. Keep recall above the pass line.',
        region: 'Speed Ridge',
        targetWpm: 550,
        xpReward: 25,
      },
      {
        id: 'adult-7',
        levelNumber: 7,
        title: 'Into Flow State',
        description: 'The Flow State Peaks — reading without subvocalizing.',
        region: 'Flow State Peaks',
        targetWpm: 650,
        xpReward: 25,
      },
      {
        id: 'adult-8',
        levelNumber: 8,
        title: 'The Master Reader Trial',
        description: 'The summit. Prove total command of speed and recall.',
        region: 'Mastery Summit',
        targetWpm: 750,
        xpReward: 40,
      },
    ],
    layouts: {
      mobile: {
        image: '/adult-mobile.png',
        aspectRatio: 1024 / 1536,
        // TUNE: nudge x/y so nodes sit on the glowing trail (test at <768px).
        nodes: [
          { id: 'adult-1', x: 36, y: 83 },
          { id: 'adult-2', x: 51, y: 73 },
          { id: 'adult-3', x: 43, y: 62 },
          { id: 'adult-4', x: 54, y: 52 },
          { id: 'adult-5', x: 46, y: 42 },
          { id: 'adult-6', x: 55, y: 32 },
          { id: 'adult-7', x: 48, y: 22 },
          { id: 'adult-8', x: 52, y: 12 },
        ],
        regionLabels: [
          { label: 'Base Camp', x: 78, y: 78 },
          { label: 'Focus Canyon', x: 21, y: 55 },
          { label: 'Speed Ridge', x: 80, y: 38 },
          { label: 'Flow State Peaks', x: 22, y: 26 },
          { label: 'Mastery Summit', x: 78, y: 11 },
        ],
      },
      desktop: {
        image: '/adult-desktop.png',
        aspectRatio: 1448 / 1086,
        // TUNE: the mountain occupies the left half of the desktop art —
        // keep nodes on the glowing trail (test at >=768px).
        nodes: [
          { id: 'adult-1', x: 26, y: 85 },
          { id: 'adult-2', x: 44, y: 75 },
          { id: 'adult-3', x: 39, y: 64 },
          { id: 'adult-4', x: 47, y: 54 },
          { id: 'adult-5', x: 41, y: 44 },
          { id: 'adult-6', x: 47, y: 34 },
          { id: 'adult-7', x: 42, y: 24 },
          { id: 'adult-8', x: 40, y: 12 },
        ],
        regionLabels: [
          { label: 'Base Camp', x: 13, y: 78 },
          { label: 'Focus Canyon', x: 16, y: 56 },
          { label: 'Speed Ridge', x: 21, y: 36 },
          { label: 'Flow State Peaks', x: 24, y: 18 },
          { label: 'Mastery Summit', x: 51, y: 7 },
        ],
      },
    },
  },

  /* ════════════════════════════ KIDS MAP ═════════════════════════════ */
  kids: {
    id: 'kids',
    title: 'The Lost Crystal Dragon',
    subtitle: 'Read story quests, collect clues, and unlock new chapters.',
    theme: 'kids',
    levels: [
      {
        id: 'kids-1',
        levelNumber: 1,
        title: 'The Missing Dragon Egg',
        description: 'The village wakes to find the dragon egg gone. Find the first clue!',
        region: 'Village',
        targetWpm: 250,
        xpReward: 25,
      },
      {
        id: 'kids-2',
        levelNumber: 2,
        title: 'The Forest Clue',
        description: 'Strange tracks lead into the glowing forest. Follow them carefully.',
        region: 'Forest',
        targetWpm: 250,
        xpReward: 25,
      },
      {
        id: 'kids-3',
        levelNumber: 3,
        title: 'The Deep Mine Door',
        description: 'A sealed door deep in the mines hides the next secret.',
        region: 'Deep Mines',
        targetWpm: 250,
        xpReward: 25,
      },
      {
        id: 'kids-4',
        levelNumber: 4,
        title: 'The Glowing Portal',
        description: 'The purple portal hums with power. Are you brave enough to step through?',
        region: 'Nether Portal',
        targetWpm: 250,
        xpReward: 25,
      },
      {
        id: 'kids-5',
        levelNumber: 5,
        title: 'The Crystal Dragon',
        description: 'The final chapter — face the lair and bring the dragon home.',
        region: 'Dragon Lair',
        targetWpm: 250,
        xpReward: 125,
      },
    ],
    layouts: {
      mobile: {
        image: '/kids-mobile.png',
        aspectRatio: 1024 / 1536,
        // TUNE: village → forest → mines → portal → lair (test at <768px).
        nodes: [
          { id: 'kids-1', x: 29, y: 80 },
          { id: 'kids-2', x: 63, y: 65 },
          { id: 'kids-3', x: 26, y: 52 },
          { id: 'kids-4', x: 72, y: 36 },
          { id: 'kids-5', x: 59, y: 16 },
        ],
        regionLabels: [
          { label: 'Village', x: 72, y: 81 },
          { label: 'Forest', x: 81, y: 62 },
          { label: 'Deep Mines', x: 13, y: 44 },
          { label: 'Nether Portal', x: 32, y: 30 },
          { label: 'Dragon Lair', x: 24, y: 14 },
        ],
      },
      desktop: {
        image: '/kids-desktop.png',
        aspectRatio: 1448 / 1086,
        // TUNE: wider composition — spread nodes across the scene (>=768px).
        nodes: [
          { id: 'kids-1', x: 16, y: 80 },
          { id: 'kids-2', x: 46, y: 72 },
          { id: 'kids-3', x: 31, y: 57 },
          { id: 'kids-4', x: 64, y: 42 },
          { id: 'kids-5', x: 62, y: 12 },
        ],
        regionLabels: [
          { label: 'Village', x: 8, y: 67 },
          { label: 'Forest', x: 50, y: 79 },
          { label: 'Deep Mines', x: 16, y: 50 },
          { label: 'Nether Portal', x: 80, y: 36 },
          { label: 'Dragon Lair', x: 78, y: 10 },
        ],
      },
    },
  },
};
