export interface Production {
  lhs: string;
  rhs: string[];
  id: string;
}

export interface ParserNode {
  name: string;
  children?: ParserNode[];
  attributes?: "t" | "nt" | "root" | string;
  id: string;
}

export type ParserActionType =
  | "SHIFT"
  | "REDUCE"
  | "ACCEPT"
  | "REJECT"
  | "BACKTRACK"
  | "---";

export interface LRItem {
  lhs: string;
  rhs: string[];
  dot: number;
  productionId: string;
}

export interface LRState {
  id: number;
  items: LRItem[];
  transitions: Record<string, number>;
}

export type LRAction =
  | { type: "SHIFT"; to: number }
  | { type: "REDUCE"; production: Production }
  | { type: "ACCEPT" }
  | { type: "ERROR" };

export type ParsingTable = Record<number, Record<string, LRAction[]>>;

// --- Snapshot Types ---

// Base Snapshot used by Greedy and Backtracking
export interface ParserSnapshot {
  stack: ParserNode[];
  buffer: string[];
  action: ParserActionType;
  production?: Production;
  note?: string;
}

// Specialized Snapshot for LR parsers
export interface LRSnapshot {
  stack: { name: string; id: string | number }[];
  buffer: string[];
  action: string;
  note: string;
}

export interface BacktrackMove {
  type: "SHIFT" | "REDUCE" | "ACCEPT";
  production?: Production;
}
