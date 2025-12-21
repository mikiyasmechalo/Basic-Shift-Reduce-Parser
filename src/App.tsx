import { useEffect, useState } from "react";
import GrammarInput from "./components/GrammarInput";
import TableView from "./components/TableView";
import Button from "./components/Button";
import TreeView from "./components/TreeView";

export interface Production {
  rhs: string;
  lhs: string;
  id: string;
}

export interface Node {
  name: string;
  children?: Node[];
  attributes?: string; // termial or non-t for styling
  id: string;
}

export interface Snapshot {
  stack: Node[];
  buffer: string;
  action: action;
  production?: Production;
}

export type action = "SHIFT" | "REDUCE" | "ACCEPT" | "REJECT" | "---";
type NextStep = { type: action; index?: number };
function App() {
  const [stack, setStack] = useState<Node[]>([
    {
      name: "$",
      id: crypto.randomUUID(),
    },
  ]);
  const [buffer, setBuffer] = useState("");
  // const [input, setInput] = useState("");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [action, setAction] = useState<action>();
  const [productions, setProductions] = useState<Production[]>([]);
  const [matchP, setMatchP] = useState<number>(0);

  const initializeParser = (pr: Production[], inp: string) => {
    console.log(pr);
    const st = [{ name: "$", id: crypto.randomUUID() }];
    setBuffer(inp + "$");
    setAction("SHIFT");
    setStack(st);
    setProductions(pr);
    setSnapshots([
      {
        buffer: inp + "$",
        stack: st,
        action: "SHIFT",
      },
    ]);
  };

  useEffect(() => {
    console.log("buffer", buffer);
    console.log("stack", stack);
    console.log("action", action);
  }, [buffer, stack, action]);

  const stepParser = () => {
    let newBuffer = buffer;
    let newStack = [...stack];
    switch (action) {
      case "ACCEPT":
      case "REJECT":
        return;
      case "REDUCE":
        {
          console.log("reducing");
          const p = productions[matchP];
          console.log("matchP 2 = " + matchP + " " + p);

          const children = stack.slice(-p.rhs.length);
          const newNode: Node = {
            name: p.lhs,
            id: crypto.randomUUID(),
            attributes: "nt",
            children: children,
          };
          newStack = [...stack.slice(0, -p.rhs.length), newNode];
          console.log("new stack", newStack);
          setStack(newStack);
        }
        break;
      case "SHIFT": {
        console.log("shifting");
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

    setAction(next.type);
    if (next.index !== undefined) setMatchP(next.index);

    takeSnapshot(newStack, newBuffer, next.type, next.index);
  };

  const computeNextAction = (stack: Node[], buffer: string): NextStep => {
    let nextAction: action | undefined;
    let pIndex;
    if (stack.length === 2 && buffer === "$") {
      nextAction = stack[1].name === productions[0]?.lhs ? "ACCEPT" : "REJECT";
      console.log("r 1");
    }
    for (const [index, p] of productions.entries()) {
      const stackCopy = [...stack];
      console.log("stackCopy = " + stackCopy);
      const stackToCheck = stackCopy
        .slice(-p.rhs.length)
        .map((p) => p.name)
        .join("");
      console.log("stack to check = " + stackToCheck);
      console.log("RHS " + p.rhs);
      if (p.rhs == stackToCheck) {
        setMatchP(index);
        console.log("matchP = " + matchP + " " + p);
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
    buffer: string,
    action: action,
    pIndex?: number,
  ) => {
    console.log("pindex" + pIndex);
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
    <div className="m-10">
      <GrammarInput onSubmit={initializeParser} />
      <Button className="mt-2" variant="danger" onClick={stepParser}>
        Step Parser
      </Button>
      <div className="flex lg:flex-row flex-col gap-3 mt-8">
        <TableView parserHistory={snapshots} />
        <TreeView stack={stack} accepted={action === "ACCEPT"} />
      </div>
    </div>
  );
}

export default App;
