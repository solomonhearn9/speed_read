'use client';

import { useMemo } from 'react';
import { buildPuzzleLayout } from '@/lib/puzzles/layout';
import type { PuzzleSegmentState } from '@/lib/puzzles/types';

interface PuzzleBoardProps {
  segmentCount: number;
  segments: PuzzleSegmentState[];
  /** Only set when at least one segment is revealed — never before. */
  imageUrl: string | null;
  freshlyRevealedSegment: number | null;
  /** Segment that the current CTA unlocks — pulse so CTA has a visible target. */
  nextSegmentIndex: number | null;
}

/**
 * Exactly N tiles fill the board (no empty "broken" cells).
 * Unrevealed tiles never receive the image URL — scratch-off treatment only.
 * Revealed tiles clip a full-board image layer so spans stay aligned.
 */
export default function PuzzleBoard({
  segmentCount,
  segments,
  imageUrl,
  freshlyRevealedSegment,
  nextSegmentIndex,
}: PuzzleBoardProps) {
  const layout = useMemo(() => buildPuzzleLayout(segmentCount), [segmentCount]);

  const byIndex = useMemo(() => {
    const map = new Map<number, PuzzleSegmentState>();
    segments.forEach((s) => map.set(s.segment_index, s));
    return map;
  }, [segments]);

  return (
    <div className="puzzle-board" aria-label="Progress puzzle">
      <div
        className="puzzle-grid"
        style={{
          gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
        }}
      >
        {layout.cells.map((cell) => {
          const seg = byIndex.get(cell.segmentIndex);
          const revealed = !!seg?.revealed && !!imageUrl;
          const fresh = freshlyRevealedSegment === cell.segmentIndex;
          const isNext =
            !revealed &&
            nextSegmentIndex != null &&
            nextSegmentIndex === cell.segmentIndex;

          return (
            <div
              key={cell.segmentIndex}
              className={[
                'puzzle-segment',
                revealed ? 'puzzle-segment-revealed' : 'puzzle-segment-obscured',
                fresh && revealed ? 'puzzle-segment-fresh' : '',
                isNext ? 'puzzle-segment-next' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                gridColumn: `${cell.col + 1} / span ${cell.colSpan}`,
                gridRow: `${cell.row + 1} / span ${cell.rowSpan}`,
              }}
              aria-label={
                revealed
                  ? `Revealed piece ${cell.segmentIndex}`
                  : isNext
                    ? `Next piece — complete the current level to uncover`
                    : `Hidden piece ${cell.segmentIndex}`
              }
            >
              {revealed && imageUrl ? (
                <div
                  className="puzzle-segment-img"
                  style={{
                    width: `${(layout.cols / cell.colSpan) * 100}%`,
                    height: `${(layout.rows / cell.rowSpan) * 100}%`,
                    left: `${(-cell.col / cell.colSpan) * 100}%`,
                    top: `${(-cell.row / cell.rowSpan) * 100}%`,
                    backgroundImage: `url(${imageUrl})`,
                  }}
                  role="img"
                  aria-hidden
                />
              ) : (
                <span className="puzzle-segment-frost" aria-hidden="true" />
              )}

              {isNext ? (
                <span className="puzzle-segment-next-badge">Next</span>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
