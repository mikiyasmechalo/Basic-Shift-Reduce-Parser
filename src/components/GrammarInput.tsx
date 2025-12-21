import { useState, type FormEvent } from "react";
import type { Production } from "../App";
import Button from "./Button";
import { parseProductions } from "../utils";

const GrammarInput = ({
  onSubmit,
}: {
  onSubmit: (productions: Production[], input: string) => void;
}) => {
  const [inputMode, setInputMode] = useState<"str" | "obj">("obj");
  const [productions, setProductions] = useState<Production[]>([
    {
      id: crypto.randomUUID(),
      lhs: "S",
      rhs: "",
    },
  ]);
  const [input, setInput] = useState("");
  const [stringPr, setStringPr] = useState("");

  const handleChange = (id: string, field: "lhs" | "rhs", value: string) => {
    value = field === "lhs" ? value[0].toUpperCase() : value;
    setProductions((prev) =>
      prev.map((prod) => (prod.id === id ? { ...prod, [field]: value } : prod)),
    );
  };
  const handleAddRow = () => {
    setProductions((prev) => [
      ...prev,
      { id: crypto.randomUUID(), lhs: "", rhs: "" },
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
              rhs: "",
            },
          ],
    );
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validProductions = productions.filter(
      (p) => p.lhs.trim() != "" && p.rhs.trim() != "",
    );
    console.log("vald " + validProductions);
    onSubmit(validProductions, input);
  };

  const examplePr = [
    {
      id: crypto.randomUUID(),
      lhs: "S",
      rhs: "S+S",
    },
    {
      id: crypto.randomUUID(),
      lhs: "S",
      rhs: "S*S",
    },
    {
      id: crypto.randomUUID(),
      lhs: "S",
      rhs: "(S)",
    },
    {
      id: crypto.randomUUID(),
      lhs: "S",
      rhs: "b",
    },
  ];
  const exInp = "b+(b*b)";

  const loadExample = () => {
    setProductions(examplePr);
    setInput(exInp);
    setInputMode("obj");
    // handleSubmit()
  };
  const parseStringInput = (e: string) => {
    setProductions(parseProductions(e));
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 ">
          <div className="flex gap-2">
            <label htmlFor="mode">Input Mode: </label>{" "}
            <select
              name="mode"
              id="mode"
              onChange={(v) => setInputMode(v.target.value as "obj" | "str")}
              className="border w-30 rounded"
            >
              <option value="obj">Object</option>
              <option value="str">String</option>
            </select>
          </div>
          {inputMode === "obj" && (
            <div className="flex justify-between w-100 items-center">
              <p>LHS</p>
              <div className="flex items-center gap-4 w-65 justify-between">
                <p>RHS</p>
                <Button className="" variant="secondary" onClick={handleAddRow}>
                  Add rule
                </Button>
              </div>{" "}
            </div>
          )}
          {inputMode === "obj" ? (
            productions.map((pr) => (
              <div key={pr.id} className="flex gap-2 text-center items-center">
                <input
                  type="text"
                  name="lhs"
                  id="lhs"
                  value={pr.lhs}
                  onChange={(v) => handleChange(pr.id, "lhs", v.target.value)}
                  placeholder="S"
                  className="outline text-center w-10 rounded py-1"
                />
                <span className="text-gray text-2xl items-center py-1 font-bold">
                  {"→"}
                </span>
                <input
                  type="text"
                  name="rhs"
                  id="rhs"
                  value={pr.rhs}
                  onChange={(v) => handleChange(pr.id, "rhs", v.target.value)}
                  placeholder="T+E"
                  className="outline rounded text-center py-1"
                />
                <button
                  className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded"
                  onClick={() => handleRemoveRow(pr.id)}
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <>
              <div>
                <textarea
                  placeholder="E->E+T"
                  className="border-s-slate-950 border rounded p-1 h-30"
                  value={stringPr}
                  onChange={(e) => {
                    setStringPr(e.target.value);
                    parseStringInput(e.target.value);
                  }}
                >
                  {/*{"S->"}*/}
                </textarea>
              </div>
            </>
          )}
        </div>
        <div className="mt-3">
          <label htmlFor="input">Input to be Parsed: </label>
          <input
            type="text"
            name="input"
            id="input"
            required
            value={input}
            className="outline rounded text-center p-1"
            onChange={(v) => setInput(v.target.value)}
          />
        </div>

        <Button type="submit" onClick={loadExample} className="w-fit">
          Load Example
        </Button>
        <div className="flex gap-2 mt-2">
          <Button type="submit">Start Parsing</Button>
        </div>
      </form>
    </>
  );
};

export default GrammarInput;
