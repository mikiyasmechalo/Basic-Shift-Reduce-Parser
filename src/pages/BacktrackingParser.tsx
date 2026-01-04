import { useEffect, useState } from "react";
import GrammarInput from "../components/GrammarInput";
import TableView from "../components/TableView";
import Button from "../components/Button";
import TreeView from "../components/TreeView";
import { tokenize } from "../utils";
import type {
  ActionType,
  BacktrackMove,
  Production,
  Snapshot,
  Node,
  BacktrackFrame,
} from "../types/parser";
import { ParserLayout } from "../components/ParserLayout";
import { ControlBar } from "../components/ControlBar";
import { VisualizationSplit } from "../components/VisualizationSplit";
import { PanelContainer } from "../components/PanelContainer";

function BacktrackingParser() {
  const [stack, setStack] = useState<Node[]>([]);
  const [buffer, setBuffer] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [currentAction, setCurrentAction] = useState<ActionType>("---");
  const [productions, setProductions] = useState<Production[]>([]);
  const [backtrackStack, setBacktrackStack] = useState<BacktrackFrame[]>([]);
  const [input, setInput] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

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
  ): BacktrackMove[] => {
    const moves: BacktrackMove[] = [];
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

    const reductions: BacktrackMove[] = [];
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
    move: BacktrackMove,
    actionType: ActionType,
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
    setCurrentAction(move.type as ActionType);
    addToHistory(
      nextStack,
      nextBuffer,
      actionType === "BACKTRACK" ? "BACKTRACK" : (move.type as ActionType),
      move.production,
    );
  };

  const addToHistory = (
    s: Node[],
    b: string[],
    a: ActionType,
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
    <ParserLayout title="Shift-Reduce Parser" badgeText="Backtracking">
      <GrammarInput
        rInput={input}
        rProductions={productions}
        onSubmit={initializeParser}
      />

      <ControlBar
        onStep={stepParserRobust}
        canStep={(!isFinished || currentAction === "REJECT") && !!input}
        stepLabel={
          currentAction === "REJECT" && backtrackStack.length > 0
            ? "Backtrack & Retry"
            : "Step Parser"
        }
        actionStatus={currentAction}
      >
        <Button
          className="w-full sm:w-auto"
          variant="secondary"
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          disabled={(isFinished && currentAction !== "REJECT") || !input}
        >
          {isAutoPlaying ? "⏸ Stop" : "⏭ Auto-Solve"}
        </Button>
      </ControlBar>

      <VisualizationSplit
        leftPanel={
          <PanelContainer title="Parsing Steps" enableFullscreen={true}>
            <TableView parserHistory={snapshots} />
          </PanelContainer>
        }
        rightPanel={
          <PanelContainer title="Parse Tree" enableFullscreen={true}>
            <div className="w-full h-full">
              <TreeView stack={stack} accepted={currentAction === "ACCEPT"} />
            </div>
          </PanelContainer>
        }
      />
    </ParserLayout>
  );
}

export default BacktrackingParser;
