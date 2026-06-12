'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface XPToastProps {
  xp: number;
  show: boolean;
}

export default function XPToast({ xp, show }: XPToastProps) {
  return (
    <AnimatePresence>
      {show && xp > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 bg-brand text-white font-semibold rounded-badge shadow-badge text-sm md:text-base"
        >
          +{xp} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}
