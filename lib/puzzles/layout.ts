/**
 * Puzzle board layout — always fills the board with exactly N tiles (no empty
 * "missing" cells). When N = cols×rows − 1, the last tile spans the final row.
 */

export interface PuzzleLayoutCell {
  segmentIndex: number;
  /** 0-based column in the logical grid */
  col: number;
  /** 0-based row in the logical grid */
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface PuzzleLayout {
  cols: number;
  rows: number;
  cells: PuzzleLayoutCell[];
}

export function buildPuzzleLayout(segmentCount: number): PuzzleLayout {
  if (segmentCount <= 0) {
    return { cols: 1, rows: 1, cells: [] };
  }

  if (segmentCount === 1) {
    return {
      cols: 1,
      rows: 1,
      cells: [{ segmentIndex: 1, col: 0, row: 0, colSpan: 1, rowSpan: 1 }],
    };
  }

  // Prefer a filled rectangle; if one short, span the last tile across the gap.
  let cols = Math.ceil(Math.sqrt(segmentCount));
  let rows = Math.ceil(segmentCount / cols);

  // Nudge toward a layout where remainder is 0 or allows a clean last-row span.
  while (cols * rows - segmentCount > 1) {
    cols += 1;
    rows = Math.ceil(segmentCount / cols);
  }

  const cells: PuzzleLayoutCell[] = [];
  let index = 1;

  for (let row = 0; row < rows; row++) {
    const isLastRow = row === rows - 1;
    const remaining = segmentCount - index + 1;

    if (isLastRow && remaining < cols && remaining > 0) {
      // Distribute remaining tiles across the full width (equal spans).
      const span = cols / remaining;
      for (let i = 0; i < remaining; i++) {
        const colStart = Math.round(i * span);
        const colEnd = Math.round((i + 1) * span);
        cells.push({
          segmentIndex: index,
          col: colStart,
          row,
          colSpan: Math.max(1, colEnd - colStart),
          rowSpan: 1,
        });
        index += 1;
      }
      break;
    }

    for (let col = 0; col < cols && index <= segmentCount; col++) {
      cells.push({
        segmentIndex: index,
        col,
        row,
        colSpan: 1,
        rowSpan: 1,
      });
      index += 1;
    }
  }

  return { cols, rows, cells };
}

/** CSS background-size / position for a cell covering its share of the full image. */
export function segmentImageStyle(
  cell: PuzzleLayoutCell,
  cols: number,
  rows: number
): { backgroundSize: string; backgroundPosition: string } {
  const widthPct = (cols / cell.colSpan) * 100;
  const heightPct = (rows / cell.rowSpan) * 100;

  const x =
    cols === cell.colSpan
      ? 0
      : (cell.col / Math.max(cols - cell.colSpan, 1)) * 100;
  const y =
    rows === cell.rowSpan
      ? 0
      : (cell.row / Math.max(rows - cell.rowSpan, 1)) * 100;

  return {
    backgroundSize: `${widthPct}% ${heightPct}%`,
    backgroundPosition: `${x}% ${y}%`,
  };
}
