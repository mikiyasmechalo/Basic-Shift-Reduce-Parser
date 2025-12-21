import { useState } from "react";
import type { Production } from "../App";
import Button from "./Button";
import { parseProductions, tokenizeGrammar } from "../utils";

const GrammarInput = ({
  rProductions,
  rInput = "",
  onSubmit,
}: {
  onSubmit: (productions: Production[], input: string) => void;
  rProductions?: Production[];
  rInput?: string;
}) => {
  console.log("rInput = ", rInput);
  console.log("rProductions = ", rProductions);
  const [inputMode, setInputMode] = useState<"str" | "obj">("obj");
  const [productions, setProductions] = useState(() =>
    rProductions && rProductions.length > 0
      ? rProductions
      : [{ id: crypto.randomUUID(), lhs: "S", rhs: [] }],
  );

  const [input, setInput] = useState(rInput);

  const [stringPr, setStringPr] = useState("");

  const handleChange = (id: string, field: "lhs" | "rhs", value: string) => {
    setProductions((prev) =>
      prev.map((prod) => {
        if (prod.id !== id) return prod;
        if (field === "lhs") {
          return { ...prod, lhs: value[0].toUpperCase() };
        } else {
          return { ...prod, rhs: tokenizeGrammar(value) };
        }
      }),
    );
  };

  const handleAddRow = () => {
    setProductions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), lhs: "", rhs: [] },
    ]);
  };
  const handleRemoveRow = (id: string) => {
    setProductions((prev) =>
      productions.length > 1
        ? prev.filter((p) => p.id != id)
        : [
            {
              id: crypto.randomUUID(),
              lhs: "S",
              rhs: [],
            },
          ],
    );
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(productions);
    const validProductions = productions.filter(
      (p) => p.lhs.trim() != "" && p.rhs.join("").trim() != "",
    );
    console.log("vald " + validProductions);
    onSubmit(validProductions, input);
  };

  const examplePr = [
    {
      id: crypto.randomUUID(),
      lhs: "S",
      rhs: ["S", "+", "S"],
    },
    {
      id: crypto.randomUUID(),
      lhs: "S",
      rhs: ["S", "*", "S"],
    },
    {
      id: crypto.randomUUID(),
      lhs: "S",
      rhs: ["(", "S", ")"],
    },
    {
      id: crypto.randomUUID(),
      lhs: "S",
      rhs: ["id"],
    },
  ];
  const exInp = "b+(b*b)";

  const loadExample = () => {
    setProductions(examplePr);
    setInput(exInp);
    setInputMode("obj");
  };
  const parseStringInput = (e: string) => {
    setProductions(parseProductions(e));
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header / Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label htmlFor="mode" className="text-sm font-medium text-zinc-400">
              Input Mode
            </label>
            <select
              name="mode"
              id="mode"
              onChange={(v) => setInputMode(v.target.value as "obj" | "str")}
              className="bg-zinc-950 border border-zinc-700 text-zinc-200 text-sm rounded-md focus:ring-1 focus:ring-zinc-600 focus:border-zinc-600 block px-3 py-1.5 outline-none"
            >
              <option value="obj">Structured</option>
              <option value="str">Text Block</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={loadExample}
              className="text-xs"
            >
              Load Example
            </Button>
          </div>
        </div>

        {/* Productions Area */}
        <div className="space-y-3">
          {inputMode === "obj" && (
            <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Grammar Rules
              </span>
              <button
                type="button"
                onClick={handleAddRow}
                className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                + Add Rule
              </button>
            </div>
          )}

          <div className="max-h-75 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
            {inputMode === "obj" ? (
              productions.map((pr) => (
                <div key={pr.id} className="group flex items-center gap-3">
                  <div className="w-16">
                    <input
                      type="text"
                      value={pr.lhs}
                      onChange={(v) =>
                        handleChange(pr.id, "lhs", v.target.value)
                      }
                      placeholder="S"
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-center rounded py-1.5 focus:border-zinc-600 focus:outline-none placeholder-zinc-700 font-mono"
                    />
                  </div>
                  <span className="text-zinc-600 font-bold">→</span>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={pr.rhs.join("")}
                      onChange={(v) =>
                        handleChange(pr.id, "rhs", v.target.value)
                      }
                      placeholder="expression"
                      className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 text-center rounded py-1.5 focus:border-zinc-600 focus:outline-none placeholder-zinc-700 font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                    onClick={() => handleRemoveRow(pr.id)}
                  >
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <textarea
                placeholder="E -> E + T&#10;T -> T * F"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-md p-3 text-zinc-300 font-mono text-sm focus:border-zinc-600 focus:outline-none h-40 resize-none"
                value={stringPr}
                onChange={(e) => {
                  setStringPr(e.target.value);
                  parseStringInput(e.target.value);
                }}
              />
            )}
          </div>
        </div>

        {/* Input String Section */}
        <div className="space-y-2">
          <label
            htmlFor="input"
            className="block text-sm font-medium text-zinc-400"
          >
            Input String
          </label>
          <input
            type="text"
            name="input"
            id="input"
            required
            value={input}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-100 rounded-md py-2 px-3 font-mono focus:border-zinc-600 focus:outline-none"
            onChange={(v) => setInput(v.target.value)}
            placeholder="e.g., id + id"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" className="w-full">
            Initialize Parser
          </Button>
        </div>
      </form>
    </div>
  );
};

export default GrammarInput;
