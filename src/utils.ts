import type { Production } from "./App";

export function tokenizeGrammar(rhs: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < rhs.length) {
    const c = rhs[i];

    // skip whitespace
    if (/\s/.test(c)) {
      i++;
      continue;
    }

    // multi-character terminals/non-terminals (like "id")
    if (/[a-zA-Z]/.test(c)) {
      let symbol = c;
      i++;
      while (i < rhs.length && /[a-zA-Z0-9]/.test(rhs[i])) {
        symbol += rhs[i++];
      }
      // tokens.push(symbol);
      tokens.push(isCapitalLetter(symbol) ? symbol : "id");
      continue;
    }

    // operators and parentheses
    if ("+*()=<>".includes(c)) {
      tokens.push(c);
      i++;
      continue;
    }

    // epsilon (ε)
    if (c === "ε") {
      tokens.push("ε");
      i++;
      continue;
    }

    throw new Error(`Unexpected character in grammar: ${c}`);
  }
  console.log(
    "Final Tokens from Grammar Tokenizer for input: ",
    rhs,
    "is: ",
    tokens,
  );

  return tokens;
}

export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < input.length) {
    const c = input[i];

    // skip whitespace
    if (/\s/.test(c)) {
      i++;
      continue;
    }

    // identifier
    if (/[a-zA-Z]/.test(c)) {
      let id = c;
      i++;
      while (i < input.length && /[a-zA-Z0-9]/.test(input[i])) {
        id += input[i++];
      }
      tokens.push("id");
      // tokens.push(id.length > 1 ? "id" : id);
      continue;
    }

    // operators / parentheses
    if ("+*()=<>".includes(c)) {
      tokens.push(c);
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${c}`);
  }
  console.log("Final Tokens from Tokenizer: ", tokens);

  return tokens;
}

export const productionToString = (p: Production) => p.lhs + "→" + p.rhs;

export function parseProductions(input: string): Production[] {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const productions: Production[] = [];

  for (const line of lines) {
    const [lhsPart, rhsPart] = line.split("->").map((s) => s.trim());
    if (!lhsPart || !rhsPart) continue;

    const rhsList = rhsPart.split("|").map((s) => s.trim());

    for (const rhs of rhsList) {
      productions.push({
        lhs: lhsPart ? lhsPart[0].toUpperCase() : "",
        rhs: tokenizeGrammar(rhs.replace(/\s+/g, "")),
        id: crypto.randomUUID(),
      });
    }
  }

  return productions;
}
function isCapitalLetter(str: string): boolean {
  return /^[A-Z]$/.test(str);
}
