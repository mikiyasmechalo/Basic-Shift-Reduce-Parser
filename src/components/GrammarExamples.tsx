import { useState } from "react";
import Button from "./Button";
import type { Production } from "../pages/BacktrackingParser";

interface Example {
  name: string;
  description: string;
  productions: { lhs: string; rhs: string[] }[];
  input: string;
  type: "standard" | "limitation";
  explanation?: string;
}

const GrammarExamples = ({
  onLoadExample,
}: {
  onLoadExample: (productions: Production[], input: string) => void;
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const examples: Example[] = [
    {
      name: "Simple Arithmetic",
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
      name: "Simple Arithmetic",
      description: "Basic addition and multiplication with precedence.",
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
        { lhs: "S", rhs: ["ε"] },
      ],
      input: "(()())",
    },
    {
      name: "Ambiguous If-Else",
      description: "The classic dangling else problem.",
      type: "limitation",
      explanation:
        "Greedy parsers often fail here because they cannot decide whether to associate the 'else' with the inner or outer 'if' without lookahead or precedence rules. A simple greedy approach might shift the 'else' too early or reduce prematurely.",
      productions: [
        { lhs: "S", rhs: ["i", "S", "e", "S"] },
        { lhs: "S", rhs: ["i", "S"] },
        { lhs: "S", rhs: ["a"] },
      ],
      input: "i i a e a",
    },
    {
      name: "Immediate Left Recursion",
      description: "Direct E -> E + T pattern.",
      type: "limitation",
      explanation:
        "Top-down parsers (like standard LL) enter an infinite loop with left recursion because they try to expand 'E' into 'E...' forever. Bottom-up parsers handle this better, but a simple greedy implementation might reduce 'id' to 'E' instantly, preventing the 'E+T' rule from ever forming correctly if not carefully managed.",
      productions: [
        { lhs: "E", rhs: ["E", "+", "T"] },
        { lhs: "E", rhs: ["T"] },
        { lhs: "T", rhs: ["id"] },
      ],
      input: "id+id",
    },
    {
      name: "Greedy Reduction Failure",
      description: "Assignment vs Expression.",
      type: "limitation",
      explanation:
        "Input: x=y+z. This fails because the parser sees 'x' (id), and immediately reduces it to 'E' (Expression) based on the rule E->id. However, the top-level rule expects 'id=E'. By the time it sees the '=', the stack contains 'E' instead of 'id', causing a mismatch.",
      productions: [
        { lhs: "S", rhs: ["id", "=", "E"] },
        { lhs: "E", rhs: ["E", "+", "E"] },
        { lhs: "E", rhs: ["id"] },
      ],
      input: "id=id+id",
    },
  ];

  const handleSelect = (ex: Example) => {
    const prodWithIds: Production[] = ex.productions.map((p) => ({
      lhs: p.lhs,
      rhs: p.rhs,
      id: crypto.randomUUID(),
    }));
    onLoadExample(prodWithIds, ex.input);
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 shadow-sm mt-8">
      <h2 className="text-xl font-bold text-zinc-100 mb-2">Example Library</h2>
      <p className="text-zinc-400 text-sm mb-6">
        Test the limits of the parser. "Standard" examples typically pass, while
        "Limitation" examples demonstrate edge cases for greedy/simple parsing
        strategies.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {examples.map((ex) => (
          <div
            key={ex.name}
            className={`
              relative flex flex-col p-4 rounded-lg border transition-all duration-200
              ${
                ex.type === "limitation"
                  ? "bg-zinc-950/80 border-red-900/30 hover:border-red-800/50"
                  : "bg-zinc-950 border-zinc-800 hover:border-zinc-600"
              }
            `}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-zinc-200">{ex.name}</h3>
              <span
                className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${
                  ex.type === "limitation"
                    ? "bg-red-950 text-red-400 border border-red-900"
                    : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                }`}
              >
                {ex.type}
              </span>
            </div>

            <p className="text-xs text-zinc-500 mb-4 grow">{ex.description}</p>

            <div className="space-y-3">
              <div className="bg-zinc-900 rounded p-2 border border-zinc-800 font-mono text-xs text-zinc-400">
                <div className="flex gap-2 border-b border-zinc-800 pb-1 mb-1">
                  <span className="text-zinc-500 select-none">IN:</span>
                  <span className="text-zinc-300">{ex.input}</span>
                </div>
                {ex.productions.map((p, i) => (
                  <div key={i} className="flex gap-1">
                    <span className="text-zinc-500 w-4 text-right">
                      {p.lhs}
                    </span>
                    <span className="text-zinc-600">→</span>
                    <span>{p.rhs.join(" ")}</span>
                  </div>
                ))}
                {/*{ex.productions.length > 2 && (
                  <div className="text-zinc-600 pl-6">...</div>
                )}*/}
              </div>

              {ex.type === "limitation" && (
                <div className="space-y-2">
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === ex.name ? null : ex.name)
                    }
                    className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 decoration-red-900"
                  >
                    {expandedId === ex.name
                      ? "Hide Explanation"
                      : "Why might this fail?"}
                  </button>
                  {expandedId === ex.name && (
                    <p className="text-xs text-zinc-400 bg-zinc-900/50 p-2 rounded border-l-2 border-red-900">
                      {ex.explanation}
                    </p>
                  )}
                </div>
              )}

              <Button
                variant="secondary"
                className="w-full text-xs h-8"
                onClick={() => handleSelect(ex)}
              >
                Load {ex.name}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GrammarExamples;
