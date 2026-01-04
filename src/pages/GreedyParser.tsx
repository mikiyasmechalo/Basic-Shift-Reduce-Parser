import { useState } from "react";
import GrammarInput from "../components/GrammarInput";
import TableView from "../components/TableView";
import TreeView from "../components/TreeView";
import { tokenize } from "../utils";
import type { ActionType, Production, Snapshot, Node } from "../types/parser";
import { ParserLayout } from "../components/ParserLayout";
import { ControlBar } from "../components/ControlBar";
import { VisualizationSplit } from "../components/VisualizationSplit";

type NextStep = { type: ActionType; index?: number };

function GreedyParser() {
  const [stack, setStack] = useState<Node[]>([
    {
      name: "$",
      id: crypto.randomUUID(),
    },
  ]);
  const [buffer, setBuffer] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [action, setAction] = useState<ActionType>();
  const [productions, setProductions] = useState<Production[]>([]);
  const [matchP, setMatchP] = useState<number>(0);
  const [input, setInput] = useState("");

  const initializeParser = (pr: Production[], inp: string) => {
    setInput(inp);
    const st = [{ name: "$", id: crypto.randomUUID() }];
    setBuffer([...tokenize(inp), "$"]);
    setAction("SHIFT");
    setStack(st);
    setProductions(pr);
    setSnapshots([
      {
        buffer: [...tokenize(inp), "$"],
        stack: st,
        action: "SHIFT",
      },
    ]);
  };

  const stepParser = () => {
    let newBuffer = buffer;
    let newStack = [...stack];
    switch (action) {
      case "ACCEPT":
      case "REJECT":
        return;
      case "REDUCE":
        {
          const p = productions[matchP];

          const children = stack.slice(-p.rhs.length);
          const newNode: Node = {
            name: p.lhs,
            id: crypto.randomUUID(),
            attributes: "nt",
            children: children,
          };
          newStack = [...stack.slice(0, -p.rhs.length), newNode];
          setStack(newStack);
        }
        break;
      case "SHIFT": {
        const newNode: Node = {
          name: buffer[0],
          id: crypto.randomUUID(),
          attributes: "t",
        };
        newBuffer = buffer.slice(1);
        newStack = [...stack, newNode];
        setBuffer(newBuffer);
        setStack(newStack);
        break;
      }
      default:
        break;
    }
    const next = computeNextAction(newStack, newBuffer);
    if (next.type === "ACCEPT" && newStack.length > 0) {
      const top = newStack[newStack.length - 1];
      const updatedTop: Node = { ...top, attributes: "root" };
      newStack = [...newStack.slice(0, -1), updatedTop];
      setStack(newStack);
    }
    setAction(next.type);
    if (next.index !== undefined) setMatchP(next.index);

    takeSnapshot(newStack, newBuffer, next.type, next.index);
  };

  const computeNextAction = (stack: Node[], buffer: string[]): NextStep => {
    let nextAction: ActionType | undefined;
    let pIndex;
    if (stack.length === 2 && buffer[0] === "$") {
      nextAction = stack[1].name === productions[0]?.lhs ? "ACCEPT" : "REJECT";
    }
    for (const [index, p] of productions.entries()) {
      const stackCopy = [...stack];
      const rhsStr = p.rhs.join("");
      const stackToCheck = stackCopy
        .slice(-p.rhs.length)
        .map((p) => p.name)
        .join("");
      if (rhsStr == stackToCheck) {
        setMatchP(index);
        nextAction = "REDUCE";
        pIndex = index;
      }
    }

    if (!nextAction) {
      nextAction = buffer.length > 1 ? "SHIFT" : "REJECT";
    }

    return { type: nextAction, index: pIndex };
  };

  const takeSnapshot = (
    stack: Node[],
    buffer: string[],
    action: ActionType,
    pIndex?: number,
  ) => {
    setSnapshots((prev) => [
      ...prev,
      {
        stack,
        buffer,
        action,
        production:
          action === "REDUCE" && pIndex !== undefined
            ? productions[pIndex]
            : undefined,
      },
    ]);
  };
  const isFinished = action === "ACCEPT" || action === "REJECT";
  return (
    <ParserLayout title="Shift-Reduce Parser" badgeText="Greedy">
      <GrammarInput
        rInput={input}
        rProductions={productions}
        onSubmit={initializeParser}
      />

      <ControlBar
        onStep={stepParser}
        canStep={input.length > 0 && !isFinished}
        actionStatus={action}
      />

      <VisualizationSplit
        leftPanel={<TableView parserHistory={snapshots} />}
        rightPanel={<TreeView stack={stack} accepted={action === "ACCEPT"} />}
      />
    </ParserLayout>
  );
}

export default GreedyParser;
