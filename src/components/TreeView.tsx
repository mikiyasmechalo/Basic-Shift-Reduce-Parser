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
    <div className="w-full h-svh">
      <Tree
        svgClassName="border"
        data={treeData as unknown as RawNodeDatum}
        orientation="vertical"
        // zoomable={false}
        // draggable={false}
        collapsible={false}
        translate={{ x: 500, y: 50 }}
        transitionDuration={500}
        renderCustomNodeElement={({ nodeDatum }) => (
          <g>
            <circle
              r={15}
              fill={
                nodeDatum.attributes?.type === "nt" ? "orange" : "lightblue"
              }
            />
            <text x="20" dy=".35em">
              {nodeDatum.name}
            </text>
          </g>
        )}
      />
    </div>
  );
};

export default TreeView;
