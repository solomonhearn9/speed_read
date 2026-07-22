'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { processText } from '@/lib/textProcessor';
import WordDisplay from '@/components/WordDisplay';

/** Short ambient loop — reads as one sentence, lands on the product promise */
const HERO_RSVP_TEXT = 'One word at a time. This is how fast you can read.';
const AMBIENT_WPM = 200;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}

/**
 * Ambient RSVP demo for the landing hero.
 * Reuses WordDisplay (real ORP renderer). Local timer only — does not touch Zustand.
 */
export default function HeroRsvpDemo() {
  const words = useMemo(() => processText(HERO_RSVP_TEXT, AMBIENT_WPM), []);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(() => Math.floor(words.length / 2));
  const indexRef = useRef(index);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    if (prefersReducedMotion || words.length === 0) return;

    // Start near the beginning so the loop is visible within ~1s of mount
    setIndex(0);
    indexRef.current = 0;

    const tick = () => {
      const current = words[indexRef.current];
      const delay = current?.duration ?? (60 / AMBIENT_WPM) * 1000;
      timerRef.current = setTimeout(() => {
        const next = (indexRef.current + 1) % words.length;
        indexRef.current = next;
        setIndex(next);
        tick();
      }, delay);
    };

    tick();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [prefersReducedMotion, words]);

  if (words.length === 0) return null;

  const word = words[Math.min(index, words.length - 1)];

  return (
    <div
      className="hero-rsvp"
      aria-hidden="true"
      role="presentation"
    >
      <WordDisplay
        word={word}
        variant="challenge"
        layout="inline"
        showGuideLines={false}
        // Instant cuts read clearer at ambient pace; reduced-motion still freezes on one word
        animate={false}
      />
    </div>
  );
}
