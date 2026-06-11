'use client';

import { motion } from 'framer-motion';
import { ProcessedWord } from '@/lib/textProcessor';
import { useState, useEffect, useRef, useMemo } from 'react';

interface WordDisplayProps {
  word: ProcessedWord;
}

export default function WordDisplay({ word }: WordDisplayProps) {
  const { text, orpIndex } = word;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  
  // Split word into parts: before anchor, anchor, after anchor
  const beforeAnchor = text.slice(0, orpIndex);
  const anchorChar = text[orpIndex] || '';
  const afterAnchor = text.slice(orpIndex + 1);

  // Measure container width
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

  // Calculate responsive font size based on word length and screen width
  const fontSize = useMemo(() => {
    const wordLength = text.length;
    const isMobile = containerWidth < 768;
    
    // Base sizes (in pixels) - significantly smaller on mobile
    const baseSize = isMobile ? 38 : 72;
    const minSize = isMobile ? 16 : 28;
    
    if (containerWidth === 0) return baseSize;
    
    // Reduce font size for longer words
    // Average character width is roughly 0.55 * font size for serif fonts
    const charWidthRatio = 0.55;
    const maxWordWidth = containerWidth * 0.94; // Leave 6% margin
    const estimatedWordWidth = wordLength * baseSize * charWidthRatio;
    
    if (estimatedWordWidth > maxWordWidth) {
      // Scale down to fit
      const scaleFactor = maxWordWidth / estimatedWordWidth;
      const newSize = Math.max(minSize, Math.floor(baseSize * scaleFactor));
      return newSize;
    }
    
    return baseSize;
  }, [text.length, containerWidth]);

  return (
    <div ref={containerRef} className="min-h-screen bg-black relative overflow-hidden">
      {/* Guide lines - vertical line at center with horizontal lines */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Vertical center line (the focus point) */}
        <div className="absolute left-1/2 top-0 w-px h-10 md:h-16 bg-gray-600 -translate-x-1/2" />
        
        {/* Top horizontal line */}
        <div className="absolute top-10 md:top-16 left-0 right-0 h-px bg-gray-700" />
      </div>

      {/* Word display - anchor character ALWAYS at exact center using flexbox */}
      <motion.div
        key={word.index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.05 }}
        className="absolute inset-0 flex items-center pb-32 md:pb-48"
        style={{ fontSize: `${fontSize}px` }}
      >
        {/* Left container - holds text before anchor, right-aligned */}
        <div className="flex-1 flex justify-end overflow-hidden">
          <span 
            className="font-serif select-none text-white whitespace-pre"
            style={{ letterSpacing: '0.02em' }}
          >
            {beforeAnchor}
          </span>
        </div>
        
        {/* Anchor character - this is the fixed center point */}
        <span 
          className="font-serif select-none text-red-500 flex-shrink-0"
          style={{ letterSpacing: '0.02em' }}
        >
          {anchorChar}
        </span>
        
        {/* Right container - holds text after anchor, left-aligned */}
        <div className="flex-1 flex justify-start overflow-hidden">
          <span 
            className="font-serif select-none text-white whitespace-pre"
            style={{ letterSpacing: '0.02em' }}
          >
            {afterAnchor}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
