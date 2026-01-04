import { useState } from "react";
import GrammarInput from "../components/GrammarInput";
import TableView from "../components/TableView";
import Button from "../components/Button";
import TreeView from "../components/TreeView";
import { tokenize } from "../utils";
import type { ActionType, Production, Snapshot, Node } from "../types/parser";

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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
            Shift-Reduce Parser
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded uppercase">
              Greedy
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
              variant="primary"
              onClick={stepParser}
              disabled={
                input.length == 0 || action == "REJECT" || action == "ACCEPT"
              }
            >
              Step Parser
            </Button>
            {action && (
              <span className="text-sm font-mono px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400">
                Next Action:{" "}
                <div
                  className={`text-lg font-mono font-bold ${action === "REJECT" ? "text-red-400" : action === "ACCEPT" ? "text-green-400" : "text-zinc-200"}`}
                >
                  {action}
                </div>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="h-full min-h-125">
              <TableView parserHistory={snapshots} />
            </div>
            <div className="h-full min-h-125">
              <TreeView stack={stack} accepted={action === "ACCEPT"} />
            </div>
          </div>
        </div>
      </div>
      {/*<GrammarExamples onLoadExample={initializeParser} />*/}
    </div>
  );
}

export default GreedyParser;
