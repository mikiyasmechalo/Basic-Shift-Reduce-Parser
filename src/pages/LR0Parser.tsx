import { useState } from "react";
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
  attributes?: "t" | "nt" | "root";
  id: string;
}

interface LRItem {
  lhs: string;
  rhs: string[];
  dot: number;
  productionId: string;
}

interface LRState {
  id: number;
  items: LRItem[];
  transitions: Record<string, number>;
}

type LRAction =
  | { type: "SHIFT"; to: number }
  | { type: "REDUCE"; production: Production }
  | { type: "ACCEPT" }
  | { type: "ERROR" };

type ParsingTable = Record<number, Record<string, LRAction[]>>;

interface Snapshot {
  stack: { name: string; id: string | number }[];
  buffer: string[];
  action: string;
  note: string;
}

const itemToString = (item: LRItem): string => {
  const before = item.rhs.slice(0, item.dot).join(" ");
  const after = item.rhs.slice(item.dot).join(" ");
  return `${item.lhs} → ${before} • ${after}`;
};

const areItemsEqual = (a: LRItem, b: LRItem): boolean =>
  a.lhs === b.lhs &&
  a.dot === b.dot &&
  a.rhs.length === b.rhs.length &&
  a.rhs.every((s, i) => s === b.rhs[i]);

function LR0Parser() {
  const [productions, setProductions] = useState<Production[]>([]);
  const [inputStr, setInputStr] = useState("");

  const [states, setStates] = useState<LRState[]>([]);
  const [parsingTable, setParsingTable] = useState<ParsingTable>({});
  const [conflicts, setConflicts] = useState<string[]>([]);

  // Simulation State
  const [stack, setStack] = useState<number[]>([0]);
  const [symbolStack, setSymbolStack] = useState<string[]>(["$"]);
  const [treeStack, setTreeStack] = useState<Node[]>([]);
  const [buffer, setBuffer] = useState<string[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [currentAction, setCurrentAction] = useState<string>("");

  const getClosure = (kernel: LRItem[], allProds: Production[]): LRItem[] => {
    const closure = [...kernel];
    let added = true;
    while (added) {
      added = false;
      for (const item of closure) {
        if (item.dot < item.rhs.length) {
          const nextSymbol = item.rhs[item.dot];
          const relatedProds = allProds.filter((p) => p.lhs === nextSymbol);

          for (const prod of relatedProds) {
            const newItem: LRItem = {
              lhs: prod.lhs,
              rhs: prod.rhs,
              dot: 0,
              productionId: prod.id,
            };
            if (!closure.some((existing) => areItemsEqual(existing, newItem))) {
              closure.push(newItem);
              added = true;
            }
          }
        }
      }
    }
    return closure;
  };

  const getGoto = (
    items: LRItem[],
    symbol: string,
    allProds: Production[],
  ): LRItem[] => {
    const movedItems: LRItem[] = items
      .filter(
        (item) => item.dot < item.rhs.length && item.rhs[item.dot] === symbol,
      )
      .map((item) => ({ ...item, dot: item.dot + 1 }));

    return getClosure(movedItems, allProds);
  };

  const addTableEntry = (
    tbl: ParsingTable,
    state: number,
    symbol: string,
    action: LRAction,
  ) => {
    if (!tbl[state]) tbl[state] = {};
    if (!tbl[state][symbol]) tbl[state][symbol] = [];

    const existing = tbl[state][symbol];
    const isDup = existing.some((a) => {
      if (a.type !== action.type) return false;
      if (a.type === "SHIFT" && action.type === "SHIFT")
        return a.to === action.to;
      if (a.type === "REDUCE" && action.type === "REDUCE")
        return a.production.id === action.production.id;
      return a.type === "ACCEPT";
    });

    if (!isDup) existing.push(action);
  };

  // Machine Generation

  const buildAutomaton = (prods: Production[]) => {
    if (prods.length === 0) return;

    const startSymbol = prods[0].lhs;
    const augmentedStart: Production = {
      lhs: "S'",
      rhs: [startSymbol],
      id: "augmented-root",
    };
    const allProds = [augmentedStart, ...prods];

    const startItem: LRItem = {
      lhs: "S'",
      rhs: [startSymbol],
      dot: 0,
      productionId: "augmented-root",
    };
    const initialClosure = getClosure([startItem], allProds);

    const statesList: LRState[] = [
      { id: 0, items: initialClosure, transitions: {} },
    ];
    const workQueue = [0];
    const stateSignature = (items: LRItem[]) =>
      items.map(itemToString).sort().join("|");
    const seenStates = new Map<string, number>([
      [stateSignature(initialClosure), 0],
    ]);

    while (workQueue.length > 0) {
      const stateId = workQueue.shift()!;
      const currentItems = statesList[stateId].items;
      const symbolsAfterDot = new Set<string>();

      currentItems.forEach((item) => {
        if (item.dot < item.rhs.length) symbolsAfterDot.add(item.rhs[item.dot]);
      });

      for (const symbol of symbolsAfterDot) {
        const nextItems = getGoto(currentItems, symbol, allProds);
        if (nextItems.length === 0) continue;

        const sig = stateSignature(nextItems);
        let nextStateId = seenStates.get(sig);

        if (nextStateId === undefined) {
          nextStateId = statesList.length;
          statesList.push({
            id: nextStateId,
            items: nextItems,
            transitions: {},
          });
          seenStates.set(sig, nextStateId);
          workQueue.push(nextStateId);
        }
        statesList[stateId].transitions[symbol] = nextStateId;
      }
    }

    const table: ParsingTable = {};
    const conflictLog: string[] = [];

    statesList.forEach((state) => {
      table[state.id] = {};
      Object.entries(state.transitions).forEach(([symbol, nextId]) => {
        addTableEntry(table, state.id, symbol, { type: "SHIFT", to: nextId });
      });

      state.items.forEach((item) => {
        if (item.dot === item.rhs.length) {
          if (item.lhs === "S'") {
            addTableEntry(table, state.id, "$", { type: "ACCEPT" });
          } else {
            const allTerminals = new Set<string>(["$"]);
            allProds.forEach((p) =>
              p.rhs.forEach((s) => {
                if (!allProds.some((prod) => prod.lhs === s))
                  allTerminals.add(s);
              }),
            );

            allTerminals.forEach((term) => {
              const originalProd =
                prods.find((p) => p.id === item.productionId) ||
                (item as unknown as Production);
              addTableEntry(table, state.id, term, {
                type: "REDUCE",
                production: originalProd,
              });
            });
          }
        }
      });
    });

    Object.entries(table).forEach(([stateId, row]) => {
      Object.entries(row).forEach(([symbol, actions]) => {
        if (actions.length > 1) {
          conflictLog.push(
            `State ${stateId} on '${symbol}': Conflict ${actions
              .map((a) => a.type)
              .join("/")}`,
          );
        }
      });
    });

    setStates(statesList);
    setParsingTable(table);
    setConflicts(conflictLog);
    resetSimulation(inputStr);
  };

  const resetSimulation = (targetInput: string) => {
    setStack([0]);
    setSymbolStack(["$"]);
    setTreeStack([]);
    const tokens = tokenize(targetInput);
    const initialBuffer = [...tokens, "$"];
    setBuffer(initialBuffer);
    setSnapshots([
      {
        stack: [{ name: "0", id: "init" }],
        buffer: initialBuffer,
        action: "START",
        note: "Ready to parse",
      },
    ]);
    setIsFinished(false);
    setCurrentAction("Ready");
  };

  const stepParser = () => {
    if (isFinished) return;
    const currentState = stack[stack.length - 1];
    const lookahead = buffer[0];
    const actions = parsingTable[currentState]?.[lookahead];

    if (!actions || actions.length === 0) {
      handleParseEnd("REJECT", "No transition defined");
      return;
    }

    const action = actions[0];

    if (action.type === "SHIFT") {
      const nextStack = [...stack, action.to];
      const nextSymbols = [...symbolStack, lookahead];
      const nextBuffer = buffer.slice(1);

      const newNode: Node = {
        id: crypto.randomUUID(),
        name: lookahead,
        attributes: "t",
      };
      setTreeStack([...treeStack, newNode]);

      updateParseState(
        nextStack,
        nextSymbols,
        nextBuffer,
        `Shift ${lookahead}`,
        `Shift to ${action.to}`,
      );
    } else if (action.type === "REDUCE") {
      const { lhs, rhs } = action.production;
      const newStack = stack.slice(0, -rhs.length);
      const topState = newStack[newStack.length - 1];
      const gotoAction = parsingTable[topState]?.[lhs]?.find(
        (a) => a.type === "SHIFT",
      );

      if (gotoAction?.type === "SHIFT") {
        const nextStack = [...newStack, gotoAction.to];
        const nextSymbols = [...symbolStack.slice(0, -rhs.length), lhs];

        const childrenCount = rhs.length;
        const children =
          childrenCount > 0 ? treeStack.slice(-childrenCount) : [];
        const newNode: Node = {
          id: crypto.randomUUID(),
          name: lhs,
          attributes: "nt",
          children: children.length > 0 ? children : undefined,
        };
        const newTreeStack =
          childrenCount > 0
            ? [...treeStack.slice(0, -childrenCount), newNode]
            : [...treeStack, newNode];

        setTreeStack(newTreeStack);

        updateParseState(
          nextStack,
          nextSymbols,
          buffer,
          `Reduce ${lhs}`,
          `Reduce by ${lhs} → ${rhs.join("")}`,
        );
      } else {
        handleParseEnd("REJECT", "GOTO Fail");
      }
    } else if (action.type === "ACCEPT") {
      const finalTree = [...treeStack];
      console.log("Final Tree:", finalTree);

      if (finalTree.length > 0) {
        finalTree[finalTree.length - 1].attributes = "root";
        setTreeStack(finalTree);
      }

      handleParseEnd("ACCEPT", "Parsing Complete");
    }
  };

  const updateParseState = (
    s: number[],
    syms: string[],
    b: string[],
    actionMsg: string,
    note: string,
  ) => {
    setStack(s);
    setSymbolStack(syms);
    setBuffer(b);
    setCurrentAction(actionMsg);
    setSnapshots((prev) => [
      ...prev,
      {
        stack: s.map((val) => ({ name: val.toString(), id: Math.random() })),
        buffer: b,
        action: actionMsg,
        note: note,
      },
    ]);
  };

  const handleParseEnd = (status: string, note: string) => {
    setCurrentAction(status);
    setIsFinished(true);
    setSnapshots((prev) => [
      ...prev,
      {
        stack: stack.map((s) => ({ name: s.toString(), id: Math.random() })),
        buffer,
        action: status,
        note,
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-zinc-100">
            LR(0) Parser Generator
          </h1>
          <p className="text-zinc-500">Canonical Collection and Simulation.</p>
        </header>

        <section className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
          <GrammarInput
            rInput={inputStr}
            rProductions={productions}
            onSubmit={(p, i) => {
              setProductions(p);
              setInputStr(i);
              setBuffer([...tokenize(i), "$"]);
              buildAutomaton(p);
              resetSimulation(i);
            }}
          />
        </section>

        {states.length > 0 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 h-96 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900 font-bold">
                  Canonical Collection
                </div>
                <div className="overflow-auto p-4 space-y-4">
                  {states.map((s) => (
                    <div
                      key={s.id}
                      className="bg-zinc-950 border border-zinc-800 p-3 rounded text-sm relative"
                    >
                      <div className="absolute top-2 right-2 text-zinc-600 font-mono text-xs">
                        I{s.id}
                      </div>
                      <ul className="font-mono">
                        {s.items.map((item, idx) => (
                          <li
                            key={idx}
                            className={
                              item.dot === item.rhs.length
                                ? "text-green-400"
                                : ""
                            }
                          >
                            {itemToString(item)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 h-96 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-zinc-800 bg-zinc-900 flex justify-between">
                  <span className="font-bold">Parsing Table</span>
                  {conflicts.length > 0 && (
                    <span className="text-red-400 text-xs">
                      {conflicts.length} Conflicts
                    </span>
                  )}
                </div>
                <div className="overflow-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-zinc-950 text-zinc-500 sticky top-0">
                      <tr>
                        <th className="p-2 border-b border-zinc-800">State</th>
                        {Array.from(
                          new Set(
                            states.flatMap((s) =>
                              Object.keys(parsingTable[s.id] || {}),
                            ),
                          ),
                        )
                          .sort()
                          .map((sym) => (
                            <th
                              key={sym}
                              className="p-2 border-b border-zinc-800"
                            >
                              {sym}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody>
                      {states.map((s) => (
                        <tr key={s.id} className="border-b border-zinc-900">
                          <td className="p-2 font-bold text-zinc-500">
                            I{s.id}
                          </td>
                          {Array.from(
                            new Set(
                              states.flatMap((st) =>
                                Object.keys(parsingTable[st.id] || {}),
                              ),
                            ),
                          )
                            .sort()
                            .map((sym) => (
                              <td key={sym} className="p-2">
                                {parsingTable[s.id]?.[sym]?.map((a, i) => (
                                  <span
                                    key={i}
                                    className="block font-mono text-indigo-400"
                                  >
                                    {a.type === "SHIFT"
                                      ? `s${a.to}`
                                      : a.type === "REDUCE"
                                        ? `r${a.production.lhs}`
                                        : "acc"}
                                  </span>
                                ))}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex gap-4 items-center">
                <Button
                  onClick={stepParser}
                  disabled={isFinished}
                  variant={isFinished ? "secondary" : "primary"}
                >
                  Step
                </Button>
                <Button
                  onClick={() => resetSimulation(inputStr)}
                  variant="secondary"
                >
                  Reset
                </Button>
                <div className="text-sm font-mono px-4 py-2 bg-zinc-900 border border-zinc-800 rounded">
                  Action: {currentAction}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-125 flex flex-col">
                  <TableView parserHistory={snapshots} />
                </div>

                <div className="h-125 bg-zinc-900/50 rounded-xl border border-zinc-800 overflow-hidden relative flex flex-col">
                  <div className="p-3 border-b border-zinc-800 bg-zinc-900/80 text-xs font-bold text-zinc-500 uppercase z-10">
                    Parse Tree (Live)
                  </div>
                  <div className="flex-1 w-full h-full">
                    <TreeView
                      stack={treeStack}
                      accepted={isFinished && currentAction === "ACCEPT"}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 font-mono text-xs">
                  <div className="text-zinc-600 mb-1">STATE STACK</div>
                  <div className="text-indigo-400 wrap-break-word">
                    [{stack.join(", ")}]
                  </div>
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 font-mono text-xs">
                  <div className="text-zinc-600 mb-1">SYMBOL STACK</div>
                  <div className="text-yellow-500 wrap-break-word">
                    [{symbolStack.join(" ")}]
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LR0Parser;
