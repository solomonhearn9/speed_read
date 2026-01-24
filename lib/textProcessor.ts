export interface ProcessedWord {
  text: string;
  orpIndex: number; // Position of red anchor character
  duration: number; // Display time in ms
  sentenceEnd: boolean;
  punctuation: boolean;
  index: number;
}

/**
 * Calculate Optimal Recognition Point (ORP) for a word
 * This is the character position that should be highlighted in red
 */
export function calculateORP(word: string): number {
  const length = word.length;
  if (length <= 2) return 0;
  if (length <= 5) return 1;
  if (length <= 9) return 2;
  if (length <= 13) return 3;
  return 4;
}

/**
 * Check if a word ends a sentence
 */
function isSentenceEnd(word: string): boolean {
  return /[.!?]$/.test(word.trim());
}

/**
 * Check if a word contains punctuation
 */
function hasPunctuation(word: string): boolean {
  return /[,;:!?.]/.test(word);
}

/**
 * Process text into words with ORP and timing information
 */
export function processText(text: string, baseWPM: number): ProcessedWord[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Clean and normalize text
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, ' ')
    .trim();

  if (cleaned.length === 0) {
    return [];
  }

  // Split into words - split on whitespace but keep the words
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);

  if (words.length === 0) {
    return [];
  }

  return words.map((word, index) => {
    const trimmed = word.trim();
    if (trimmed.length === 0) {
      // Fallback for empty words
      return {
        text: ' ',
        orpIndex: 0,
        duration: (60 / baseWPM) * 1000,
        sentenceEnd: false,
        punctuation: false,
        index,
      };
    }

    const orpIndex = Math.min(calculateORP(trimmed), trimmed.length - 1);
    const sentenceEnd = isSentenceEnd(trimmed);
    const punctuation = hasPunctuation(trimmed);

    // Calculate duration based on word length and punctuation
    // Base duration from WPM
    const baseDuration = (60 / baseWPM) * 1000; // ms per word
    
    // Longer words need slightly more time
    const avgWordLength = 5;
    const lengthMultiplier = 1 + Math.max(0, (trimmed.length - avgWordLength) * 0.05);
    
    // Punctuation pauses
    let punctuationMultiplier = 1;
    if (trimmed.includes(',')) punctuationMultiplier = 1.5;
    if (trimmed.includes('.')) punctuationMultiplier = 2.5;
    if (trimmed.includes('!') || trimmed.includes('?')) punctuationMultiplier = 2.5;

    const duration = baseDuration * lengthMultiplier * punctuationMultiplier;

    return {
      text: trimmed,
      orpIndex,
      duration: Math.max(100, Math.round(duration)), // Minimum 100ms, rounded
      sentenceEnd,
      punctuation,
      index,
    };
  });
}

/**
 * Split text into sentences for navigation
 */
export function splitIntoSentences(text: string): string[] {
  return text.split(/([.!?]+[\s\n]+)/).filter(s => s.trim().length > 0);
}

