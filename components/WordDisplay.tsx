'use client';

import { motion } from 'framer-motion';
import { ProcessedWord } from '@/lib/textProcessor';
import { useState, useEffect, useRef, useMemo } from 'react';

export type WordDisplayVariant = 'challenge' | 'training' | 'default';
export type WordDisplayLayout = 'fullscreen' | 'inline';

interface WordDisplayProps {
  word: ProcessedWord;
  showGuideLines?: boolean;
  variant?: WordDisplayVariant;
  /** fullscreen = challenge/training viewport; inline = hero ambient demo */
  layout?: WordDisplayLayout;
  /** Disable Framer Motion fade (e.g. prefers-reduced-motion) */
  animate?: boolean;
}

const variantStyles = {
  challenge: {
    bg: 'bg-gradient-to-b from-challenge-bg-start to-challenge-bg-end',
    anchor: 'text-challenge-cta',
    guideV: 'bg-white/20',
    guideH: 'bg-white/10',
  },
  training: {
    bg: 'bg-reader-bg',
    anchor: 'text-reader-pivot',
    guideV: 'bg-white/20',
    guideH: 'bg-reader-border',
  },
  default: {
    bg: 'bg-gradient-to-b from-challenge-bg-start to-challenge-bg-end',
    anchor: 'text-challenge-cta',
    guideV: 'bg-white/15',
    guideH: 'bg-white/10',
  },
} as const;

export default function WordDisplay({
  word,
  showGuideLines = true,
  variant = 'default',
  layout = 'fullscreen',
  animate = true,
}: WordDisplayProps) {
  const { text, orpIndex } = word;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const isInline = layout === 'inline';

  const beforeAnchor = text.slice(0, orpIndex);
  const anchorChar = text[orpIndex] || '';
  const afterAnchor = text.slice(orpIndex + 1);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const fontSize = useMemo(() => {
    const wordLength = text.length;
    const isMobile = containerWidth < 768;

    const baseSize = isInline
      ? (isMobile ? 34 : 48)
      : (isMobile ? 38 : 72);
    const minSize = isInline
      ? (isMobile ? 20 : 28)
      : (isMobile ? 16 : 28);

    if (containerWidth === 0) return baseSize;

    const charWidthRatio = 0.55;
    const maxWordWidth = containerWidth * (isInline ? 0.88 : 0.94);
    const estimatedWordWidth = wordLength * baseSize * charWidthRatio;

    if (estimatedWordWidth > maxWordWidth) {
      const scaleFactor = maxWordWidth / estimatedWordWidth;
      return Math.max(minSize, Math.floor(baseSize * scaleFactor));
    }

    return baseSize;
  }, [text.length, containerWidth, isInline]);

  const styles = variantStyles[variant];
  const shellClass = isInline
    ? 'absolute inset-0 bg-transparent'
    : `min-h-screen ${styles.bg} relative overflow-hidden`;

  const wordClassName = `absolute inset-0 flex items-center ${isInline ? '' : 'pb-32 md:pb-48'}`;
  const wordStyle = { fontSize: `${fontSize}px` };

  const wordContent = (
    <>
      <div className="flex-1 flex justify-end overflow-hidden">
        <span
          className="font-serif select-none text-white whitespace-pre"
          style={{ letterSpacing: '0.02em' }}
        >
          {beforeAnchor}
        </span>
      </div>

      <span
        className={`font-serif select-none flex-shrink-0 ${styles.anchor}`}
        style={{ letterSpacing: '0.02em' }}
      >
        {anchorChar}
      </span>

      <div className="flex-1 flex justify-start overflow-hidden">
        <span
          className="font-serif select-none text-white whitespace-pre"
          style={{ letterSpacing: '0.02em' }}
        >
          {afterAnchor}
        </span>
      </div>
    </>
  );

  return (
    <div ref={containerRef} className={shellClass}>
      {showGuideLines && (
        <div className="absolute inset-0 pointer-events-none z-10">
          <div
            className={`absolute left-1/2 top-0 w-px ${isInline ? 'h-4' : 'h-10 md:h-16'} ${styles.guideV} -translate-x-1/2`}
          />
          <div
            className={`absolute ${isInline ? 'top-4' : 'top-10 md:top-16'} left-0 right-0 h-px ${styles.guideH}`}
          />
        </div>
      )}

      {animate ? (
        <motion.div
          key={word.index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.05 }}
          className={wordClassName}
          style={wordStyle}
        >
          {wordContent}
        </motion.div>
      ) : (
        <div key={word.index} className={wordClassName} style={wordStyle}>
          {wordContent}
        </div>
      )}
    </div>
  );
}
