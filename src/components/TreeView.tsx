import Tree, { type RawNodeDatum } from "react-d3-tree";
import type { Node } from "../App";

function normalize(node: Node): RawNodeDatum {
  return {
    name: node.name,
    attributes: node.attributes ? { type: node.attributes } : undefined,
    children: node.children?.map(normalize),
  };
}

const TreeView = ({
  stack,
  accepted,
}: {
  stack: Node[];
  accepted?: boolean;
}) => {
  const slimStack = stack.slice(1);
  const treeData = accepted
    ? normalize(stack[1])
    : normalize({
        name: "Stack",
        children: slimStack,
        id: crypto.randomUUID(),
      });

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900 z-10 relative">
        <h3 className="text-sm font-semibold text-zinc-300">Parse Tree</h3>
      </div>
      <div className="flex-1 w-full h-125">
        <Tree
          data={treeData as unknown as RawNodeDatum}
          orientation="vertical"
          collapsible={false}
          translate={{ x: 300, y: 50 }}
          transitionDuration={500}
          pathClassFunc={() => "stroke-zinc-600 !stroke-1"}
          renderCustomNodeElement={({ nodeDatum }) => (
            <g>
              <circle
                r={nodeDatum.name.length > 3 ? 20 : 16}
                fill={
                  nodeDatum.attributes?.type === "nt"
                    ? "#52525b"
                    : nodeDatum.attributes?.type === "root"
                      ? "green"
                      : "#27272a"
                }
                stroke="#71717a"
                strokeWidth="2"
              />
              <text
                fill="#ffffff"
                stroke="none"
                fontSize="14px"
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
