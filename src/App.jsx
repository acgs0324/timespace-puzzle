import { useEffect, useMemo, useState } from "react";
import { RotateCw, FlipHorizontal, RefreshCw, Lightbulb, CheckCircle2, Eraser } from "lucide-react";
import "./App.css";

function Button({ className = "", variant, ...props }) {
  const base = "inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-xl border transition";
  const style =
    variant === "outline"
      ? "border-slate-300 bg-white hover:bg-slate-50"
      : "border-slate-900 bg-slate-900 text-white hover:bg-slate-800";
  return <button className={`${base} ${style} ${className}`} {...props} />;
}

function Card({ className = "", children }) {
  return <div className={`bg-white ${className}`}>{children}</div>;
}

function CardHeader({ className = "", children }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}

function CardTitle({ className = "", children }) {
  return <h2 className={`font-semibold ${className}`}>{children}</h2>;
}

function CardContent({ className = "", children }) {
  return <div className={`px-6 pb-6 ${className}`}>{children}</div>;
}

function TargetField({ label, value, onChange, options }) {
  return (
    <label className="target-field">
      <span className="target-field-label">{label}</span>
      <select className="target-select" value={value} onChange={onChange}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BOARD_ROWS = 7;
const BOARD_COLS = 8;
const CELL = 48;
const BOARD_PADDING = 24;

const PIECES = [
  {
    id: "plus",
    name: "Plus",
    color: "bg-blue-500",
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
  },
  {
    id: "l1",
    name: "L",
    color: "bg-violet-400",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
  },
  {
    id: "l2",
    name: "L",
    color: "bg-violet-600",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
    ],
  },
  {
    id: "p",
    name: "P",
    color: "bg-rose-400",
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ],
  },
  {
    id: "square",
    name: "Square",
    color: "bg-red-500",
    cells: [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ],
  },
  {
    id: "bar3",
    name: "3-bar",
    color: "bg-amber-700",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
    ],
  },
  {
    id: "z1",
    name: "Z",
    color: "bg-fuchsia-500",
    cells: [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
  },
  {
    id: "z2",
    name: "Z",
    color: "bg-fuchsia-700",
    cells: [
      [0, 0],
      [1, 1],
      [1, 0],
      [2, 1],
    ],
  },
  {
    id: "long-z",
    name: "Long-Z",
    color: "bg-purple-400",
    cells: [
      [0, 0],
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
    ],
  },
  {
    id: "bar2",
    name: "Two-bar",
    color: "bg-pink-300",
    cells: [
      [0, 0],
      [0, 1],
    ],
  },
  {
    id: "t",
    name: "T",
    color: "bg-emerald-600",
    cells: [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
  },
  {
    id: "little-l",
    name: "Little L",
    color: "bg-cyan-400",
    cells: [
      [0, 0],
      [0, 1],
      [1, 1],
    ],
  },
];

function normalize(cells) {
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells
    .map(([x, y]) => [x - minX, y - minY])
    .sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
}

function rotateOnce(cells) {
  return normalize(cells.map(([x, y]) => [y, -x]));
}

function flipCells(cells) {
  return normalize(cells.map(([x, y]) => [-x, y]));
}

function applyOrientation(cells, rotation, flipped) {
  let out = normalize(cells);
  if (flipped) out = flipCells(out);
  for (let i = 0; i < rotation; i += 1) out = rotateOnce(out);
  return normalize(out);
}

function getUniqueTransforms(cells) {
  const seen = new Set();
  const transforms = [];
  for (const flipped of [false, true]) {
    for (let rotation = 0; rotation < 4; rotation += 1) {
      const shape = applyOrientation(cells, rotation, flipped);
      const key = JSON.stringify(shape);
      if (!seen.has(key)) {
        seen.add(key);
        transforms.push(shape);
      }
    }
  }
  return transforms;
}

function makeBoard() {
  const valid = new Set();
  const labels = new Map();
  const types = new Map();

  for (let c = 2; c <= 6; c += 1) valid.add(`0,${c}`);
  ["Mon", "Tue", "Wed", "Thu", "Fri"].forEach((label, i) => {
    labels.set(`0,${i + 2}`, label);
    types.set(`0,${i + 2}`, "weekday");
  });

  const monthPairs = [
    ["Jan", "Jul"],
    ["Feb", "Aug"],
    ["Mar", "Sep"],
    ["Apr", "Oct"],
    ["May", "Nov"],
    ["Jun", "Dec"],
  ];

  for (let r = 1; r <= 6; r += 1) {
    valid.add(`${r},0`);
    valid.add(`${r},1`);
    labels.set(`${r},0`, monthPairs[r - 1][0]);
    labels.set(`${r},1`, monthPairs[r - 1][1]);
    types.set(`${r},0`, "month");
    types.set(`${r},1`, "month");
  }

  valid.add("1,2");
  valid.add("1,3");
  labels.set("1,2", "Sat");
  labels.set("1,3", "Sun");
  types.set("1,2", "weekday");
  types.set("1,3", "weekday");

  let day = 1;
  for (let c = 4; c <= 7; c += 1) {
    valid.add(`1,${c}`);
    labels.set(`1,${c}`, String(day));
    types.set(`1,${c}`, "date");
    day += 1;
  }
  for (let r = 2; r <= 5; r += 1) {
    for (let c = 2; c <= 7; c += 1) {
      valid.add(`${r},${c}`);
      labels.set(`${r},${c}`, String(day));
      types.set(`${r},${c}`, "date");
      day += 1;
    }
  }
  for (let c = 2; c <= 4; c += 1) {
    valid.add(`6,${c}`);
    labels.set(`6,${c}`, String(day));
    types.set(`6,${c}`, "date");
    day += 1;
  }

  const monthCellByName = new Map();
  const weekdayCellByName = new Map();
  const dateCellByNumber = new Map();

  for (const [key, label] of labels.entries()) {
    const t = types.get(key);
    if (t === "month") monthCellByName.set(label, key);
    if (t === "weekday") weekdayCellByName.set(label, key);
    if (t === "date") dateCellByNumber.set(Number(label), key);
  }

  return { valid, labels, types, monthCellByName, weekdayCellByName, dateCellByNumber };
}

const BOARD = makeBoard();
const PIECE_BY_ID = Object.fromEntries(PIECES.map((piece) => [piece.id, piece]));
const TRANSFORMS = Object.fromEntries(PIECES.map((piece) => [piece.id, getUniqueTransforms(piece.cells)]));

function cellKey(r, c) {
  return `${r},${c}`;
}

function parseKey(key) {
  const [r, c] = key.split(",").map(Number);
  return { r, c };
}

function getTargetCells(monthIndex, weekdayIndex, day) {
  const monthName = MONTHS[monthIndex];
  const weekdayName = WEEKDAYS[weekdayIndex];
  return [
    BOARD.monthCellByName.get(monthName),
    BOARD.weekdayCellByName.get(weekdayName),
    BOARD.dateCellByNumber.get(day),
  ];
}

function buildPlacements(blockedSet) {
  const placementsByPiece = {};
  const placementsByCellAndPiece = new Map();

  for (const piece of PIECES) {
    const all = [];
    for (const shape of TRANSFORMS[piece.id]) {
      const width = Math.max(...shape.map(([x]) => x)) + 1;
      const height = Math.max(...shape.map(([, y]) => y)) + 1;
      for (let r = 0; r <= BOARD_ROWS - height; r += 1) {
        for (let c = 0; c <= BOARD_COLS - width; c += 1) {
          const cells = shape.map(([x, y]) => cellKey(r + y, c + x));
          if (cells.every((key) => BOARD.valid.has(key) && !blockedSet.has(key))) {
            const placement = {
              pieceId: piece.id,
              shape,
              anchor: [r, c],
              cells,
            };
            all.push(placement);
            for (const key of cells) {
              const mapKey = `${piece.id}|${key}`;
              if (!placementsByCellAndPiece.has(mapKey)) placementsByCellAndPiece.set(mapKey, []);
              placementsByCellAndPiece.get(mapKey).push(placement);
            }
          }
        }
      }
    }
    placementsByPiece[piece.id] = all;
  }

  return { placementsByPiece, placementsByCellAndPiece };
}

function solvePuzzle(blockedSet) {
  const openCells = [...BOARD.valid].filter((key) => !blockedSet.has(key));
  const { placementsByCellAndPiece } = buildPlacements(blockedSet);
  const uncovered = new Set(openCells);
  const remainingPieces = new Set(PIECES.map((piece) => piece.id));
  const solution = [];

  function recurse() {
    if (uncovered.size === 0) return true;

    let bestOptions = null;

    for (const cell of uncovered) {
      const options = [];
      for (const pieceId of remainingPieces) {
        const candidates = placementsByCellAndPiece.get(`${pieceId}|${cell}`) || [];
        for (const placement of candidates) {
          if (placement.cells.every((key) => uncovered.has(key))) {
            options.push(placement);
          }
        }
      }
      if (options.length === 0) return false;
      if (!bestOptions || options.length < bestOptions.length) {
        bestOptions = options;
        if (options.length === 1) break;
      }
    }

    for (const placement of bestOptions || []) {
      if (!remainingPieces.has(placement.pieceId)) continue;
      remainingPieces.delete(placement.pieceId);
      placement.cells.forEach((key) => uncovered.delete(key));
      solution.push(placement);
      if (recurse()) return true;
      solution.pop();
      placement.cells.forEach((key) => uncovered.add(key));
      remainingPieces.add(placement.pieceId);
    }

    return false;
  }

  return recurse() ? solution.map((item) => ({ ...item })) : null;
}

function solveTarget(monthIndex, weekdayIndex, day) {
  const yellow = getTargetCells(monthIndex, weekdayIndex, day);
  const blockedSet = new Set(yellow);
  const solution = solvePuzzle(blockedSet);
  if (!solution) return null;
  return { monthIndex, weekdayIndex, day, yellow, solution };
}

function generateRandomPuzzle() {
  const candidates = [];
  for (let monthIndex = 0; monthIndex < 12; monthIndex += 1) {
    for (let weekdayIndex = 0; weekdayIndex < 7; weekdayIndex += 1) {
      for (let day = 1; day <= 31; day += 1) {
        candidates.push({ monthIndex, weekdayIndex, day });
      }
    }
  }

  for (let i = candidates.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (const candidate of candidates) {
    const puzzle = solveTarget(candidate.monthIndex, candidate.weekdayIndex, candidate.day);
    if (puzzle) return puzzle;
  }

  return null;
}

function PieceMini({ piece, selected, placed, orientation, onClick }) {
  const shape = applyOrientation(piece.cells, orientation.rotation, orientation.flipped);
  const width = Math.max(...shape.map(([x]) => x)) + 1;
  const height = Math.max(...shape.map(([, y]) => y)) + 1;

  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border p-3 transition ${selected ? "border-slate-900 bg-slate-100 shadow-lg" : "border-slate-200 bg-white"} ${placed ? "opacity-45" : "hover:shadow-md"}`}
    >
      <div
        className="grid gap-1"
        style={{
          gridTemplateColumns: `repeat(${width}, 1.1rem)`,
          gridTemplateRows: `repeat(${height}, 1.1rem)`,
        }}
      >
        {Array.from({ length: width * height }).map((_, index) => {
          const x = index % width;
          const y = Math.floor(index / width);
          const filled = shape.some(([sx, sy]) => sx === x && sy === y);
          return (
            <div
              key={index}
              className={`h-4 w-4 rounded-[4px] ${filled ? piece.color : "bg-transparent"}`}
            />
          );
        })}
      </div>
      <div className="mt-2 text-xs font-medium text-slate-600">{piece.name}</div>
    </button>
  );
}

export default function CalendarCoverPuzzleGame() {
  const [targetMonthIndex, setTargetMonthIndex] = useState(8);
  const [targetWeekdayIndex, setTargetWeekdayIndex] = useState(6);
  const [targetDay, setTargetDay] = useState(25);
  const [puzzle, setPuzzle] = useState(() => solveTarget(0, 0, 1) || generateRandomPuzzle());
  const [placements, setPlacements] = useState({});
  const [selectedPieceId, setSelectedPieceId] = useState(PIECES[0].id);
  const [orientations, setOrientations] = useState(
    Object.fromEntries(PIECES.map((piece) => [piece.id, { rotation: 0, flipped: false }]))
  );
  const [hoverAnchor, setHoverAnchor] = useState(null);
  const [message, setMessage] = useState(
    "Cover every gray square. Leave only the yellow month, weekday, and date visible."
  );
  const [isCelebrating, setIsCelebrating] = useState(false);

  const occupiedCellToPiece = useMemo(() => {
    const map = new Map();
    for (const [pieceId, placement] of Object.entries(placements)) {
      placement.cells.forEach((key) => map.set(key, pieceId));
    }
    return map;
  }, [placements]);

  const selectedShape = useMemo(() => {
    if (!selectedPieceId) return null;
    return applyOrientation(
      PIECE_BY_ID[selectedPieceId].cells,
      orientations[selectedPieceId].rotation,
      orientations[selectedPieceId].flipped
    );
  }, [selectedPieceId, orientations]);

  const selectedShapeCenter = useMemo(() => {
    if (!selectedShape?.length) return null;
    const total = selectedShape.reduce(
      (sum, [x, y]) => ({
        x: sum.x + x + 0.5,
        y: sum.y + y + 0.5,
      }),
      { x: 0, y: 0 }
    );
    return {
      x: total.x / selectedShape.length,
      y: total.y / selectedShape.length,
    };
  }, [selectedShape]);

  const previewCells = useMemo(() => {
    if (!selectedPieceId || placements[selectedPieceId] || !hoverAnchor || !selectedShape || !puzzle) return [];
    const cells = selectedShape.map(([x, y]) => cellKey(hoverAnchor.r + y, hoverAnchor.c + x));
    const isValid = cells.every(
      (key) => BOARD.valid.has(key) && !puzzle.yellow.includes(key) && !occupiedCellToPiece.has(key)
    );
    return isValid ? cells : [];
  }, [selectedPieceId, selectedShape, hoverAnchor, placements, puzzle, occupiedCellToPiece]);

  function resetOrientations() {
    setOrientations(Object.fromEntries(PIECES.map((piece) => [piece.id, { rotation: 0, flipped: false }])));
  }

  function prepareNextPuzzle() {
    setMessage("Generating a solvable puzzle...");
    setPlacements({});
    setHoverAnchor(null);
    setSelectedPieceId(PIECES[0].id);
    setIsCelebrating(false);
    resetOrientations();
  }

  function applyTarget(monthIndex, weekdayIndex, day) {
    prepareNextPuzzle();
    setTimeout(() => {
      const nextPuzzle = solveTarget(monthIndex, weekdayIndex, day);
      if (nextPuzzle) {
        setPuzzle(nextPuzzle);
        setTargetMonthIndex(monthIndex);
        setTargetWeekdayIndex(weekdayIndex);
        setTargetDay(day);
        setMessage("Cover every gray square. Leave only the yellow month, weekday, and date visible.");
      } else {
        setMessage("That month, weekday, and date combination has no solution.");
      }
    }, 20);
  }

  function startRandomPuzzle() {
    prepareNextPuzzle();
    setTimeout(() => {
      const nextPuzzle = generateRandomPuzzle();
      if (nextPuzzle) {
        setPuzzle(nextPuzzle);
        setTargetMonthIndex(nextPuzzle.monthIndex);
        setTargetWeekdayIndex(nextPuzzle.weekdayIndex);
        setTargetDay(nextPuzzle.day);
        setMessage("Cover every gray square. Leave only the yellow month, weekday, and date visible.");
      } else {
        setMessage("Could not find a solvable random target.");
      }
    }, 20);
  }

  const isSolved = Boolean(puzzle) && Object.keys(placements).length === PIECES.length;
  const displayedMessage = isSolved
    ? "Perfect. Everything is covered except the highlighted month, weekday, and date."
    : message;

  function rotateSelected() {
    if (!selectedPieceId) return;
    setOrientations((prev) => ({
      ...prev,
      [selectedPieceId]: {
        ...prev[selectedPieceId],
        rotation: (prev[selectedPieceId].rotation + 1) % 4,
      },
    }));
  }

  function flipSelected() {
    if (!selectedPieceId) return;
    setOrientations((prev) => ({
      ...prev,
      [selectedPieceId]: {
        ...prev[selectedPieceId],
        flipped: !prev[selectedPieceId].flipped,
      },
    }));
  }

  function placeSelectedAt(anchor) {
    if (!puzzle || !selectedPieceId || placements[selectedPieceId]) return;
    const cells = selectedShape.map(([x, y]) => cellKey(anchor.r + y, anchor.c + x));
    const valid = cells.every(
      (key) => BOARD.valid.has(key) && !puzzle.yellow.includes(key) && !occupiedCellToPiece.has(key)
    );
    if (!valid) return;
    setPlacements((prev) => ({
      ...prev,
      [selectedPieceId]: {
        pieceId: selectedPieceId,
        cells,
        color: PIECE_BY_ID[selectedPieceId].color,
      },
    }));
    if (Object.keys(placements).length + 1 === PIECES.length) {
      setIsCelebrating(true);
    }

    const nextUnplaced = PIECES.find((piece) => piece.id !== selectedPieceId && !placements[piece.id]);
    if (nextUnplaced) setSelectedPieceId(nextUnplaced.id);
  }

  function updateHoverAnchor(event) {
    if (!selectedPieceId || !selectedShape || !selectedShapeCenter || placements[selectedPieceId]) {
      setHoverAnchor(null);
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - BOARD_PADDING;
    const y = event.clientY - rect.top - BOARD_PADDING;
    const c = Math.round(x / CELL - selectedShapeCenter.x);
    const r = Math.round(y / CELL - selectedShapeCenter.y);
    setHoverAnchor({ r, c });
  }

  function liftPiece(pieceId) {
    setPlacements((prev) => {
      const next = { ...prev };
      delete next[pieceId];
      return next;
    });
    setSelectedPieceId(pieceId);
  }

  function clearBoard() {
    setPlacements({});
    setHoverAnchor(null);
    setIsCelebrating(false);
    setMessage("Cover every gray square. Leave only the yellow month, weekday, and date visible.");
  }

  function giveHint() {
    if (!puzzle) return;
    const placed = new Set(Object.keys(placements));
    const next = puzzle.solution.find((item) => !placed.has(item.pieceId));
    if (!next) return;
    setPlacements((prev) => ({
      ...prev,
      [next.pieceId]: {
        pieceId: next.pieceId,
        cells: next.cells,
        color: PIECE_BY_ID[next.pieceId].color,
      },
    }));
    setSelectedPieceId(next.pieceId);
  }

  function solveAll() {
    if (!puzzle) return;
    const solved = {};
    puzzle.solution.forEach((item) => {
      solved[item.pieceId] = {
        pieceId: item.pieceId,
        cells: item.cells,
        color: PIECE_BY_ID[item.pieceId].color,
      };
    });
    setPlacements(solved);
    setIsCelebrating(false);
    setMessage("Solved. Start a new puzzle whenever you want another challenge.");
  }

  useEffect(() => {
    if (!isCelebrating) return undefined;
    const timeoutId = window.setTimeout(() => {
      setIsCelebrating(false);
    }, 1800);
    return () => window.clearTimeout(timeoutId);
  }, [isCelebrating]);

  function boardCellClass(key) {
    if (!BOARD.valid.has(key)) return "bg-transparent border-transparent";
    if (puzzle?.yellow.includes(key)) return "bg-yellow-300 border-slate-500";
    const owner = occupiedCellToPiece.get(key);
    if (owner) return `${PIECE_BY_ID[owner].color} border-slate-700 text-white`;
    if (previewCells.includes(key)) return "bg-slate-300 border-slate-500";
    return "bg-slate-200 border-slate-400";
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Calendar Cover Puzzle</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Pick any month, weekday, and day of month to leave visible, or generate a random target. The weekday does not have to match the month and date.
            </p>
          </div>
          <div className="target-toolbar">
            <TargetField
              label="Weekday"
              value={targetWeekdayIndex}
              onChange={(e) => setTargetWeekdayIndex(Number(e.target.value))}
              options={WEEKDAYS.map((weekday, index) => ({ label: weekday, value: index }))}
            />
            <TargetField
              label="Month"
              value={targetMonthIndex}
              onChange={(e) => setTargetMonthIndex(Number(e.target.value))}
              options={MONTHS.map((month, index) => ({ label: month, value: index }))}
            />
            <TargetField
              label="Date"
              value={targetDay}
              onChange={(e) => setTargetDay(Number(e.target.value))}
              options={Array.from({ length: 31 }, (_, index) => index + 1).map((day) => ({
                label: String(day),
                value: day,
              }))}
            />
            <Button className="rounded-2xl" onClick={() => applyTarget(targetMonthIndex, targetWeekdayIndex, targetDay)}>
              Apply Target
            </Button>
            <Button className="rounded-2xl" onClick={startRandomPuzzle}>
              <RefreshCw className="mr-2 h-4 w-4" /> Random
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={giveHint}>
              <Lightbulb className="mr-2 h-4 w-4" /> Hint
            </Button>
            <Button variant="outline" className="rounded-2xl" onClick={solveAll}>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Solve
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)_280px]">
          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Pieces</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {PIECES.map((piece) => (
                <PieceMini
                  key={piece.id}
                  piece={piece}
                  placed={Boolean(placements[piece.id])}
                  selected={selectedPieceId === piece.id}
                  orientation={orientations[piece.id]}
                  onClick={() => setSelectedPieceId(piece.id)}
                />
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-lg">Board</CardTitle>
                {isSolved && (
                  <div className="finish-indicator" aria-live="polite">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Puzzle solved</span>
                  </div>
                )}
              </div>
              <div className="text-sm text-slate-600">{displayedMessage}</div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Button variant="outline" className="rounded-2xl" onClick={rotateSelected} disabled={!selectedPieceId}>
                  <RotateCw className="mr-2 h-4 w-4" /> Rotate
                </Button>
                <Button variant="outline" className="rounded-2xl" onClick={flipSelected} disabled={!selectedPieceId}>
                  <FlipHorizontal className="mr-2 h-4 w-4" /> Flip
                </Button>
                <Button
                  variant="outline"
                  className="rounded-2xl"
                  onClick={clearBoard}
                  disabled={Object.keys(placements).length === 0}
                >
                  <Eraser className="mr-2 h-4 w-4" /> Clear board
                </Button>
                {puzzle && (
                  <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-700">
                    Target: <span className="font-semibold">{WEEKDAYS[puzzle.weekdayIndex]}, {MONTHS[puzzle.monthIndex]} {puzzle.day}</span>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <div
                  className={`relative mx-auto grid rounded-[2rem] bg-slate-300/50 p-6 ${isCelebrating ? "board-celebration" : ""}`}
                  onMouseMove={updateHoverAnchor}
                  onMouseLeave={() => setHoverAnchor(null)}
                  style={{
                    width: BOARD_COLS * CELL + 48,
                    gridTemplateColumns: `repeat(${BOARD_COLS}, ${CELL}px)`,
                    gridTemplateRows: `repeat(${BOARD_ROWS}, ${CELL}px)`,
                    gap: 0,
                  }}
                >
                  {isCelebrating && <div className="celebration-burst" aria-hidden="true" />}
                  {Array.from({ length: BOARD_ROWS * BOARD_COLS }).map((_, index) => {
                    const r = Math.floor(index / BOARD_COLS);
                    const c = index % BOARD_COLS;
                    const key = cellKey(r, c);
                    const isValid = BOARD.valid.has(key);
                    const owner = occupiedCellToPiece.get(key);
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          if (!isValid || !puzzle) return;
                          if (owner) {
                            liftPiece(owner);
                          } else {
                            placeSelectedAt(hoverAnchor ?? parseKey(key));
                          }
                        }}
                        className={`flex items-center justify-center border text-center text-sm font-bold transition ${boardCellClass(key)} ${isValid ? "cursor-pointer" : "cursor-default"}`}
                      >
                        <span className={occupiedCellToPiece.has(key) ? "drop-shadow-sm" : "text-slate-700"}>
                          {BOARD.labels.get(key) || ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 text-sm text-slate-500">
                Click a piece to select it. Rotate or flip it, then move over the board to center the piece under your cursor and click to place it. Click any placed piece on the board to pick it back up.
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-slate-600">
              <p>
                The board is fixed like the puzzle in your reference image. The month cells are on the left, weekdays are across the top with Saturday and Sunday tucked into the first date row, and the numbered day cells fill the rest.
              </p>
              <p>
                You can choose any month, weekday, and date directly. The weekday is independent, so combinations like Tue with Feb 31 are allowed if the board has a solution for them.
              </p>
              <p>
                Both manual targets and random targets are checked by the built in solver first, so only solvable combinations are loaded onto the board.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
