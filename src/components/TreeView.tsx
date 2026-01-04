import Tree, { type RawNodeDatum } from "react-d3-tree";
import type { Node } from "../pages/BacktrackingParser";

function normalize(node: Node | undefined): RawNodeDatum | null {
  if (!node || node.name === "$") return null;

  return {
    name: node.name || "Unknown",
    attributes: node.attributes ? { type: node.attributes } : undefined,
    children: node.children
      ? node.children
          .map(normalize)
          .filter((child): child is RawNodeDatum => child !== null)
      : undefined,
  };
}

const TreeView = ({
  stack,
  accepted,
}: {
  stack: Node[];
  accepted?: boolean;
}) => {
  if (!stack || stack.length === 0) return null;

  let root: RawNodeDatum | null = null;

  if (accepted) {
    const validRoot = stack[0]?.name === "$" ? stack[1] : stack[0];
    root = normalize(validRoot);
  } else {
    root = normalize({
      name: "Stack",
      children: stack,
      id: "virtual-root",
    });
  }

  if (!root) return null;

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 z-10 relative">
        <h3 className="text-sm font-semibold text-zinc-300">Parse Tree</h3>
      </div>
      <div className="flex-1 w-full h-125">
        <Tree
          data={root}
          orientation="vertical"
          collapsible={false}
          translate={{ x: 300, y: 50 }}
          transitionDuration={500}
          pathClassFunc={() => "custom-link"}
          renderCustomNodeElement={({ nodeDatum }) => (
            <g>
              <circle
                r={nodeDatum.name.length > 3 ? 20 : 16}
                fill={
                  nodeDatum.attributes?.type === "nt"
                    ? "#52525b"
                    : nodeDatum.attributes?.type === "root"
                      ? "#166534"
                      : "#27272a"
                }
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                fill="#ffffff"
                stroke="none"
                fontSize="12px"
                fontWeight="600"
                x="0"
                dy="5"
                textAnchor="middle"
                style={{ pointerEvents: "none" }}
              >
                {nodeDatum.name}
              </text>
            </g>
          )}
        />
      </div>
    </div>
  );
};

export default TreeView;
