'use client';

import { motion } from 'framer-motion';
import { ProcessedWord } from '@/lib/textProcessor';

interface WordDisplayProps {
  word: ProcessedWord;
}

export default function WordDisplay({ word }: WordDisplayProps) {
  const { text, orpIndex } = word;
  
  // Split word into parts: before anchor, anchor, after anchor
  const beforeAnchor = text.slice(0, orpIndex);
  const anchorChar = text[orpIndex] || '';
  const afterAnchor = text.slice(orpIndex + 1);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Guide lines - vertical line at center with horizontal lines */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Vertical center line (the focus point) */}
        <div className="absolute left-1/2 top-0 w-px h-16 bg-gray-600 -translate-x-1/2" />
        
        {/* Top horizontal line */}
        <div className="absolute top-16 left-0 right-0 h-px bg-gray-700" />
        
        {/* Bottom vertical line */}
        <div className="absolute left-1/2 bottom-[200px] w-px h-16 bg-gray-600 -translate-x-1/2" />
      </div>

      {/* Word display - anchor character fixed at center */}
      <motion.div
        key={word.index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.05 }}
        className="absolute inset-0 flex items-center pb-48"
      >
        {/* Left side - text before anchor, right-aligned to meet the center */}
        <div className="flex-1 flex justify-end">
          <span className="text-white text-7xl font-serif tracking-wide select-none">
            {beforeAnchor}
          </span>
        </div>
        
        {/* Anchor character - always at exact center */}
        <span className="text-red-500 text-7xl font-serif tracking-wide select-none">
          {anchorChar}
        </span>
        
        {/* Right side - text after anchor, left-aligned from center */}
        <div className="flex-1 flex justify-start">
          <span className="text-white text-7xl font-serif tracking-wide select-none">
            {afterAnchor}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

