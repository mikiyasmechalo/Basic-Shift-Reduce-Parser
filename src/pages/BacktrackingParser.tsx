import { useEffect, useState } from "react";
import GrammarInput from "../components/GrammarInput";
import TableView from "../components/TableView";
import Button from "../components/Button";
import TreeView from "../components/TreeView";
import { tokenize } from "../utils";

export interface Production {
  lhs: string;
  rhs: string[];
  id: string;
}

export interface Node {
  name: string;
  children?: Node[];
  attributes?: string;
  id: string;
}

export type action =
  | "SHIFT"
  | "REDUCE"
  | "ACCEPT"
  | "REJECT"
  | "BACKTRACK"
  | "---";

export interface Snapshot {
  stack: Node[];
  buffer: string[];
  action: action;
  production?: Production;
  note?: string;
}

interface BacktrackFrame {
  stack: Node[];
  buffer: string[];
  pendingMoves: Move[];
}

interface Move {
  type: "SHIFT" | "REDUCE" | "ACCEPT";
  production?: Production;
}

function BacktrackingParser() {
  const [stack, setStack] = useState<Node[]>([]);
  const [buffer, setBuffer] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [currentAction, setCurrentAction] = useState<action>("---");
  const [productions, setProductions] = useState<Production[]>([]);
  const [backtrackStack, setBacktrackStack] = useState<BacktrackFrame[]>([]);
  const [input, setInput] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [isTreeFullscreen, setIsTreeFullscreen] = useState(false);

  const initializeParser = (pr: Production[], inp: string) => {
    const initialStack = [{ name: "$", id: crypto.randomUUID() }];
    const initialBuffer = [...tokenize(inp), "$"];

    setInput(inp);
    setProductions(pr);
    setStack(initialStack);
    setBuffer(initialBuffer);
    setBacktrackStack([]);
    setIsFinished(false);
    setCurrentAction("---");
    setSnapshots([
      {
        buffer: initialBuffer,
        stack: initialStack,
        action: "---",
        note: "Initialized",
      },
    ]);
  };

  const getPossibleMoves = (
    currentStack: Node[],
    currentBuffer: string[],
  ): Move[] => {
    const moves: Move[] = [];
    const bufferTop = currentBuffer[0];

    if (
      currentBuffer.length === 1 &&
      bufferTop === "$" &&
      currentStack.length === 2 &&
      currentStack[1].name === productions[0]?.lhs
    ) {
      return [{ type: "ACCEPT" }];
    }

    if (bufferTop !== "$") {
      moves.push({ type: "SHIFT" });
    }

    const reductions: Move[] = [];
    for (const p of productions) {
      const isEpsilon = p.rhs[0] === "ε";
      const rhsLen = isEpsilon ? 0 : p.rhs.length;

      if (currentStack.length >= rhsLen) {
        const stackSuffix = currentStack.slice(currentStack.length - rhsLen);
        const match =
          isEpsilon || p.rhs.every((sym, i) => stackSuffix[i].name === sym);

        if (match) {
          // Loop protection for ε
          if (
            isEpsilon &&
            currentStack[currentStack.length - 1]?.name === p.lhs
          )
            continue;
          reductions.push({ type: "REDUCE", production: p });
        }
      }
    }

    reductions.sort(
      (a, b) =>
        (b.production?.rhs.length || 0) - (a.production?.rhs.length || 0),
    );

    return [...moves, ...reductions];
  };

  const stepParserRobust = () => {
    if (currentAction === "REJECT") {
      if (backtrackStack.length === 0) return;

      const frame = backtrackStack[backtrackStack.length - 1];
      const nextMove = frame.pendingMoves[0];
      const newFrameMoves = frame.pendingMoves.slice(1);
      const newBtStack = backtrackStack.slice(0, -1);

      if (newFrameMoves.length > 0) {
        newBtStack.push({ ...frame, pendingMoves: newFrameMoves });
      }
      setBacktrackStack(newBtStack);
      applyMove(frame.stack, frame.buffer, nextMove, "BACKTRACK");
      return;
    }

    if (isFinished) return;

    const moves = getPossibleMoves(stack, buffer);

    if (moves.length === 0) {
      setCurrentAction("REJECT");
      addToHistory(
        stack,
        buffer,
        "REJECT",
        undefined,
        backtrackStack.length > 0 ? "Dead end. Backtrack available." : "Failed",
      );
      if (backtrackStack.length === 0) setIsFinished(true);
      return;
    }

    const selectedMove = moves[0];
    if (moves.length > 1) {
      setBacktrackStack((prev) => [
        ...prev,
        {
          stack: [...stack],
          buffer: [...buffer],
          pendingMoves: moves.slice(1),
        },
      ]);
    }

    applyMove(stack, buffer, selectedMove, selectedMove.type);
  };
  const applyMove = (
    currentStack: Node[],
    currentBuffer: string[],
    move: Move,
    actionType: action,
  ) => {
    let nextStack = [...currentStack];
    let nextBuffer = [...currentBuffer];

    if (move.type === "SHIFT") {
      nextStack.push({
        name: nextBuffer[0],
        id: crypto.randomUUID(),
        attributes: "t",
      });
      nextBuffer = nextBuffer.slice(1);
    } else if (move.type === "REDUCE" && move.production) {
      const p = move.production;
      const isEpsilon = p.rhs[0] === "ε";
      const rhsLen = isEpsilon ? 0 : p.rhs.length;

      const children = isEpsilon
        ? [{ name: "ε", id: crypto.randomUUID(), attributes: "t" }]
        : nextStack.slice(nextStack.length - rhsLen);

      const newNode: Node = {
        name: p.lhs,
        id: crypto.randomUUID(),
        attributes: "nt",
        children: children,
      };

      // Remove the N items from the end of the stack and push the new Node
      nextStack = [...nextStack.slice(0, nextStack.length - rhsLen), newNode];
    } else if (move.type === "ACCEPT") {
      setIsFinished(true);
      setIsAutoPlaying(false);
      const top = nextStack[nextStack.length - 1];
      nextStack = [...nextStack.slice(0, -1), { ...top, attributes: "root" }];
    }

    setStack(nextStack);
    setBuffer(nextBuffer);
    setCurrentAction(move.type as action);
    addToHistory(
      nextStack,
      nextBuffer,
      actionType === "BACKTRACK" ? "BACKTRACK" : (move.type as action),
      move.production,
    );
  };

  const addToHistory = (
    s: Node[],
    b: string[],
    a: action,
    p?: Production,
    n?: string,
  ) => {
    setSnapshots((prev) => [
      ...prev,
      { stack: s, buffer: b, action: a, production: p, note: n },
    ]);
  };
  useEffect(() => {
    if (!isAutoPlaying || isFinished) {
      return;
    }

    const timer = window.setTimeout(() => {
      stepParserRobust();
    }, 100);

    return () => clearTimeout(timer);
  }, [isAutoPlaying, isFinished, stack, buffer, currentAction]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
            Shift-Reduce Parser
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded uppercase">
              Backtracking
            </span>
          </h1>
        </header>

        <div className="space-y-6">
          <GrammarInput
            rInput={input}
            rProductions={productions}
            onSubmit={initializeParser}
          />

          <div className="flex items-center gap-4 border-t border-zinc-900 pt-6">
            <Button
              className="w-full sm:w-auto"
              variant={
                currentAction === "REJECT" && backtrackStack.length > 0
                  ? "danger"
                  : "primary"
              }
              onClick={stepParserRobust}
              disabled={(isFinished && currentAction !== "REJECT") || !input}
            >
              {currentAction === "REJECT" && backtrackStack.length > 0
                ? "Backtrack & Retry"
                : "Step Parser"}
            </Button>
            <Button
              className="w-full sm:w-auto"
              variant="secondary"
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              disabled={(isFinished && currentAction !== "REJECT") || !input}
            >
              {isAutoPlaying ? "⏸ Stop" : "⏭ Auto-Solve"}
            </Button>
            <div className="flex flex-col">
              <span className="text-xs text-zinc-500 uppercase font-bold">
                Action
              </span>
              <div
                className={`text-lg font-mono font-bold ${currentAction === "REJECT" ? "text-red-400" : currentAction === "ACCEPT" ? "text-green-400" : "text-zinc-200"}`}
              >
                {currentAction}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-3 bg-zinc-900/50 p-2 rounded-lg border border-zinc-800">
              <div className="text-right">
                <div className="text-xs text-zinc-500 uppercase font-bold">
                  Saved Paths
                </div>
                <div className="text-sm font-mono text-zinc-300">
                  {backtrackStack.length}
                </div>
              </div>
              <div
                className={`w-3 h-3 rounded-full ${backtrackStack.length > 0 ? "bg-indigo-500 animate-pulse" : "bg-zinc-800"}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
            <div className="lg:col-span-5 h-150 flex flex-col">
              <TableView parserHistory={snapshots} />
            </div>

            <div className="lg:col-span-7 h-150 flex flex-col gap-4">
              <div className="flex-1 border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900/30 relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTreeFullscreen(true);
                  }}
                  className="cursor-pointer absolute top-4 right-4 z-9999 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md shadow-2xl transition-all active:scale-90 flex items-center gap-2 text-xs font-bold"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                    />
                  </svg>
                </button>

                <TreeView stack={stack} accepted={currentAction === "ACCEPT"} />
              </div>

              <div className="h-1/3 border border-zinc-800 rounded-lg p-4 bg-zinc-900/30 overflow-y-auto font-mono text-sm">
                <div className="mb-2">
                  <span className="text-zinc-500 mr-2">BUFFER:</span>
                  <span className="text-yellow-100/90 break-all">
                    [{buffer.join(" ")}]
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 mr-2">STACK:</span>
                  <span className="text-indigo-200/90">
                    {stack.map((n) => n.name).join(" ")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isTreeFullscreen && (
        <div className="fixed inset-0 z-10000 bg-zinc-950 flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
            <span className="text-zinc-100 font-bold">
              Fullscreen Parse Tree
            </span>
            <button
              onClick={() => setIsTreeFullscreen(false)}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md border border-red-500/50 transition-colors"
            >
              Exit Fullscreen
            </button>
          </div>
          <div className="flex-1 w-full h-full overflow-hidden">
            <TreeView stack={stack} accepted={currentAction === "ACCEPT"} />
          </div>
        </div>
      )}
    </div>
  );
}

export default BacktrackingParser;
