import type { LRSnapshot, Snapshot } from "../types/parser";
import { productionToString } from "../utils";

const TableView = ({
  parserHistory,
}: {
  parserHistory: Snapshot[] | LRSnapshot[];
}) => {
  return (
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden shadow-sm">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="min-w-full divide-y divide-zinc-800">
          <thead className="bg-zinc-950 sticky top-0 z-10">
            <tr>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                Stack
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                Buffer
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                Action
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500"
              >
                Production
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 bg-zinc-900/50">
            {parserHistory.map((snapshot, index) => (
              <tr
                key={index}
                className="hover:bg-zinc-800/50 transition-colors"
              >
                <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-300 font-mono">
                  {snapshot.stack.reduce((acc, v) => acc + v.name, "")}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-400 font-mono text-right">
                  {snapshot.buffer.join("")}
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      snapshot.action === "SHIFT"
                        ? "bg-zinc-800 text-zinc-300"
                        : snapshot.action === "REDUCE"
                          ? "bg-zinc-700 text-zinc-200"
                          : snapshot.action === "ACCEPT"
                            ? "bg-zinc-100 text-zinc-900"
                            : "text-zinc-500"
                    }`}
                  >
                    {snapshot.action}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-500 font-mono">
                  {snapshot.production
                    ? productionToString(snapshot.production)
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableView;
