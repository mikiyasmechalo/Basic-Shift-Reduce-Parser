import type { Production } from "./pages/GreedyParser";

export const EPSILON = "ε";

export function tokenizeGrammar(rhs: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < rhs.length) {
    const char = rhs[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Handle Epsilon (ε or the word "epsilon")
    if (char === EPSILON || rhs.startsWith("epsilon", i)) {
      tokens.push(EPSILON);
      i += char === EPSILON ? 1 : 7;
      continue;
    }

    // Multi-character identifiers
    if (/[a-zA-Z]/.test(char)) {
      let symbol = char;
      i++;
      while (i < rhs.length && /[a-zA-Z0-9]/.test(rhs[i])) {
        symbol += rhs[i++];
      }
      tokens.push(symbol);
      continue;
    }

    const dualChar = rhs.slice(i, i + 2);
    if (["==", "<=", ">="].includes(dualChar)) {
      tokens.push(dualChar);
      i += 2;
      continue;
    }

    // Single character operators and punctuation
    if ("+*()=<>|,/^&!".includes(char)) {
      tokens.push(char);
      i++;
      continue;
    }

    throw new Error(`Unexpected character in grammar: ${char}`);
  }

  return tokens;
}

export function tokenize(input: string): string[] {
  const tokens: string[] = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Identifiers/Names
    if (/[a-zA-Z]/.test(char)) {
      let id = char;
      i++;
      while (i < input.length && /[a-zA-Z0-9]/.test(input[i])) {
        id += input[i++];
      }
      tokens.push(id);
      continue;
    }

    // Numbers
    if (/[0-9]/.test(char)) {
      let num = char;
      i++;
      while (i < input.length && /[0-9]/.test(input[i])) {
        num += input[i++];
      }
      tokens.push(num);
      continue;
    }

    // Multi-character operators
    const dualChar = input.slice(i, i + 2);
    if (["==", "<=", ">="].includes(dualChar)) {
      tokens.push(dualChar);
      i += 2;
      continue;
    }

    if ("+*()=<>,^&!|".includes(char)) {
      tokens.push(char);
      i++;
      continue;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  return tokens;
}

export const productionToString = (p: Production) =>
  `${p.lhs} → ${p.rhs.length === 0 ? EPSILON : p.rhs.join(" ")}`;

export function parseProductions(input: string): Production[] {
  const productions: Production[] = [];
  const lines = input.split(/\n/).filter((line) => line.trim().length > 0);

  for (const line of lines) {
    const parts = line.split(/->|→|=>/);
    if (parts.length < 2) continue;

    const lhs = parts[0].trim();
    const rhsContent = parts[1].trim();

    const choices = rhsContent.split("|").map((s) => s.trim());

    for (const choice of choices) {
      const isEpsilon =
        choice === EPSILON ||
        choice.toLowerCase() === "epsilon" ||
        choice === "";

      productions.push({
        id: crypto.randomUUID(),
        lhs: lhs.toUpperCase(),
        rhs: isEpsilon ? [] : tokenizeGrammar(choice),
      });
    }
  }

  return productions;
}

export function isNonTerminal(symbol: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(symbol);
}
