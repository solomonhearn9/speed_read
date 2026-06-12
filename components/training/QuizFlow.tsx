'use client';

import { useEffect, useState } from 'react';
import type { QuizQuestionPublic } from '@/lib/training/types';

interface QuizFlowProps {
  questions: QuizQuestionPublic[];
  onComplete: (answers: Array<{ question_id: string; selected_index: number }>) => void;
  onQuestionAnswered?: (questionIndex: number, selectedIndex: number) => void;
}

export default function QuizFlow({
  questions,
  onComplete,
  onQuestionAnswered,
}: QuizFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Array<{ question_id: string; selected_index: number }>>([]);

  useEffect(() => {
    setSelectedIndex(null);
  }, [currentIndex]);

  const question = questions[currentIndex];
  if (!question) return null;

  const handleSelect = (optionIndex: number) => {
    setSelectedIndex(optionIndex);
    (document.activeElement as HTMLElement | null)?.blur();

    const newAnswer = { question_id: question.id, selected_index: optionIndex };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    onQuestionAnswered?.(currentIndex, optionIndex);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 300);
    } else {
      setTimeout(() => onComplete(newAnswers), 300);
    }
  };

  return (
    <div data-theme="learning" className="min-h-screen bg-surface-primary text-content-primary flex flex-col p-6 md:p-8">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
        <p className="text-xs text-content-muted uppercase tracking-widest mb-2 text-center font-semibold">
          Quick Check · {currentIndex + 1} / {questions.length}
        </p>
        <div className="w-full h-2 bg-surface-secondary rounded-full mb-10 overflow-hidden border border-line">
          <div
            className="h-full bg-brand transition-all duration-300 rounded-full"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <h2 className="text-lg md:text-xl font-bold mb-8 leading-relaxed text-content-primary">
          {question.prompt}
        </h2>

        <div className="space-y-3" key={currentIndex}>
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left px-5 py-4 surface-card transition-all duration-200 text-sm md:text-base outline-none ${
                selectedIndex === idx
                  ? 'border-brand bg-brand/5 ring-2 ring-brand/20'
                  : 'hover:border-brand/40 hover:shadow-card-hover'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
