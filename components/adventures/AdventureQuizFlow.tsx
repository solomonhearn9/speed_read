'use client';

import { useState } from 'react';
import type { AdventureQuestionPublic } from '@/lib/adventures/types';
import './adventure-theme.css';

interface AdventureQuizFlowProps {
  questions: AdventureQuestionPublic[];
  onComplete: (answers: Array<{ question_id: string; selected_index: number }>) => void;
  onQuestionAnswered?: (index: number, selected: number) => void;
}

export default function AdventureQuizFlow({
  questions,
  onComplete,
  onQuestionAnswered,
}: AdventureQuizFlowProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Array<{ question_id: string; selected_index: number }>>([]);

  const question = questions[currentIndex];
  if (!question) return null;

  const handleSelect = (optionIndex: number) => {
    const newAnswer = { question_id: question.id, selected_index: optionIndex };
    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);
    onQuestionAnswered?.(currentIndex, optionIndex);

    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex((i) => i + 1), 350);
    } else {
      setTimeout(() => onComplete(newAnswers), 350);
    }
  };

  return (
    <div className="adventure-bg min-h-screen text-white flex flex-col p-6 md:p-8">
      <div className="max-w-lg mx-auto w-full flex-1 flex flex-col justify-center">
        <p className="text-xs text-purple-400/80 uppercase tracking-widest mb-2 text-center">
          Story choice · {currentIndex + 1} / {questions.length}
        </p>
        <div className="h-1.5 bg-gray-800 rounded-full mb-8 overflow-hidden border border-gray-700">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        <h2 className="text-lg md:text-xl font-semibold mb-8 leading-relaxed text-center">
          {question.prompt}
        </h2>

        <div className="space-y-3">
          {question.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className="w-full text-left px-4 py-4 adventure-card hover:border-cyan-400/50 rounded-lg transition-all text-sm md:text-base"
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
