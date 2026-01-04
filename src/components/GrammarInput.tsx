import { useState, useEffect } from "react";
import type { Production } from "../pages/BacktrackingParser";
import Button from "./Button";
import { parseProductions, tokenizeGrammar } from "../utils";

interface Example {
  name: string;
  description: string;
  productions: { lhs: string; rhs: string[] }[];
  input: string;
  type: "standard" | "limitation";
  explanation?: string;
}

const EXAMPLES: Example[] = [
  {
    name: "Simple Arithmetic (No Precedence)",
    description: "Basic addition and multiplication without precedence.",
    type: "standard",
    productions: [
      { lhs: "S", rhs: ["S", "+", "S"] },
      { lhs: "S", rhs: ["S", "*", "S"] },
      { lhs: "S", rhs: ["(", "S", ")"] },
      { lhs: "S", rhs: ["id"] },
    ],
    input: "id+(id*id)",
  },
  {
    name: "Arithmetic (With Precedence)",
    description: "Standard E -> E + T math grammar.",
    type: "standard",
    productions: [
      { lhs: "E", rhs: ["E", "+", "T"] },
      { lhs: "E", rhs: ["T"] },
      { lhs: "T", rhs: ["T", "*", "F"] },
      { lhs: "T", rhs: ["F"] },
      { lhs: "F", rhs: ["(", "E", ")"] },
      { lhs: "F", rhs: ["id"] },
    ],
    input: "id+id*id",
  },
  {
    name: "Balanced Parentheses",
    description: "Recursive matching of brackets.",
    type: "standard",
    productions: [
      { lhs: "S", rhs: ["(", "S", ")", "S"] },
      { lhs: "S", rhs: [] },
    ],
    input: "(()())",
  },
  {
    name: "Ambiguous If-Else",
    description: "The classic dangling else problem.",
    type: "limitation",
    productions: [
      { lhs: "S", rhs: ["i", "S", "e", "S"] },
      { lhs: "S", rhs: ["i", "S"] },
      { lhs: "S", rhs: ["a"] },
    ],
    input: "iiaea",
  },
  {
    name: "Greedy Reduction Failure",
    description: "Assignment vs Expression mismatch.",
    type: "limitation",
    productions: [
      { lhs: "S", rhs: ["id", "=", "E"] },
      { lhs: "E", rhs: ["E", "+", "E"] },
      { lhs: "E", rhs: ["id"] },
    ],
    input: "id=id+id",
  },
];

const GrammarInput = ({
  rProductions,
  rInput = "",
  onSubmit,
}: {
  onSubmit: (productions: Production[], input: string) => void;
  rProductions?: Production[];
  rInput?: string;
}) => {
  const [inputMode, setInputMode] = useState<"obj" | "str">("obj");
  const [productions, setProductions] = useState<Production[]>(() =>
    rProductions && rProductions.length > 0
      ? rProductions
      : [{ id: crypto.randomUUID(), lhs: "S", rhs: [] }],
  );
  const [input, setInput] = useState(rInput);
  const [stringPr, setStringPr] = useState("");

  // Keep state in sync if props change from outside
  useEffect(() => {
    if (rProductions?.length) setProductions(rProductions);
    if (rInput) setInput(rInput);
  }, [rProductions, rInput]);

  const handleChange = (id: string, field: "lhs" | "rhs", value: string) => {
    setProductions((prev) =>
      prev.map((prod) => {
        if (prod.id !== id) return prod;
        return field === "lhs"
          ? { ...prod, lhs: value.toUpperCase() }
          : { ...prod, rhs: [value] }; // utils will tokenize this on submit
      }),
    );
  };

  const handleLoadExample = (ex: Example) => {
    const formatted = ex.productions.map((p) => ({
      ...p,
      id: crypto.randomUUID(),
    }));
    setProductions(formatted);
    setInput(ex.input);
    setInputMode("obj");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validProductions = productions
      .filter(
        (p) =>
          p.lhs.trim() !== "" && (p.rhs.length > 0 || p.rhs.join("") === ""),
      )
      .map((p) => ({
        ...p,
        rhs: tokenizeGrammar(p.rhs.join("")),
      }));
    onSubmit(validProductions, input);
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-zinc-400">Mode</label>
            <select
              value={inputMode}
              onChange={(e) => setInputMode(e.target.value as "obj" | "str")}
              className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm rounded-md px-3 py-1.5 outline-none"
            >
              <option value="obj">Structured</option>
              <option value="str">Text Block</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-zinc-400">Library</label>
            <select
              onChange={(e) => {
                const ex = EXAMPLES.find((x) => x.name === e.target.value);
                if (ex) handleLoadExample(ex);
              }}
              defaultValue=""
              className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-sm rounded-md px-3 py-1.5 outline-none hover:bg-zinc-700 transition-colors"
            >
              <option value="" disabled>
                Select an example...
              </option>
              <optgroup label="Standard Grammars">
                {EXAMPLES.filter((e) => e.type === "standard").map((ex) => (
                  <option key={ex.name} value={ex.name}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Known Limitations">
                {EXAMPLES.filter((e) => e.type === "limitation").map((ex) => (
                  <option key={ex.name} value={ex.name}>
                    {ex.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Productions Area */}
        <div className="space-y-3">
          {inputMode === "obj" ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center pb-1 border-b border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">
                  Rules
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setProductions([
                      ...productions,
                      { id: crypto.randomUUID(), lhs: "", rhs: [] },
                    ])
                  }
                  className="text-[10px] text-zinc-400 hover:text-white"
                >
                  + Add
                </button>
              </div>
              {productions.map((pr) => (
                <div key={pr.id} className="flex items-center gap-2">
                  <input
                    className="w-12 bg-zinc-950 border border-zinc-800 text-zinc-100 text-center rounded py-1 font-mono"
                    value={pr.lhs}
                    onChange={(e) => handleChange(pr.id, "lhs", e.target.value)}
                    placeholder="LHS"
                  />
                  <span className="text-zinc-600">→</span>
                  <input
                    className="flex-1 bg-zinc-950 border border-zinc-800 text-zinc-100 px-2 py-1 font-mono"
                    value={pr.rhs.join(" ")}
                    onChange={(e) => handleChange(pr.id, "rhs", e.target.value)}
                    placeholder="RHS (space separated)"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setProductions(productions.filter((p) => p.id !== pr.id))
                    }
                    className="text-zinc-600 hover:text-red-400 px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <textarea
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-3 text-zinc-300 font-mono text-sm h-40 outline-none"
              value={stringPr}
              onChange={(e) => {
                setStringPr(e.target.value);
                setProductions(parseProductions(e.target.value));
              }}
              placeholder="S -> a S b | ε"
            />
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-zinc-400">
            Input String
          </label>
          <input
            type="text"
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-md py-2 px-3 font-mono outline-none focus:border-zinc-600"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full">
          Initialize Parser
        </Button>
      </form>
    </div>
  );
};

export default GrammarInput;
