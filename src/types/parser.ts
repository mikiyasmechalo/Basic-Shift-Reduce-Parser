export interface Production {
  lhs: string;
  rhs: string[];
  id: string;
}

export interface Node {
  name: string;
  children?: Node[];
  attributes?: "t" | "nt" | "root" | string;
  id: string;
}

export type ActionType =
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

export interface Snapshot {
  stack: Node[];
  buffer: string[];
  action: ActionType;
  production?: Production;
  note?: string;
}

export interface LRSnapshot {
  stack: { name: string; id: string | number }[];
  buffer: string[];
  production?: Production;
  action: string;
  note: string;
}

export interface BacktrackMove {
  type: "SHIFT" | "REDUCE" | "ACCEPT";
  production?: Production;
}

export interface BacktrackFrame {
  stack: Node[];
  buffer: string[];
  pendingMoves: BacktrackMove[];
}
