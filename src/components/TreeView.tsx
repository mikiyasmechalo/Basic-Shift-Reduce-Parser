import Tree, { type RawNodeDatum } from "react-d3-tree";
import type { Node } from "../types/parser";
import { useRef, useEffect, useState } from "react";

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
  isFullscreen = false,
}: {
  stack: Node[];
  accepted?: boolean;
  isFullscreen?: boolean;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [translate, setTranslate] = useState({ x: 300, y: 50 });

  useEffect(() => {
    if (containerRef.current) {
      const { width } = containerRef.current.getBoundingClientRect();
      setTranslate({ x: width / 2, y: 50 });
    }
  }, [isFullscreen]);

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
    <div
      ref={containerRef}
      className={`flex flex-col h-full w-full bg-zinc-900 ${!isFullscreen ? "rounded-lg border border-zinc-800" : ""} overflow-hidden`}
    >
      <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-300">Parse Tree</h3>
      </div>

      <div className="flex-1 w-full h-full">
        <Tree
          data={root}
          orientation="vertical"
          collapsible={false}
          translate={translate}
          transitionDuration={500}
          pathClassFunc={() => "custom-link"}
          renderCustomNodeElement={({ nodeDatum }) => (
            <g>
              <circle
                r={nodeDatum.name.length > 3 ? 24 : 20}
                fill={
                  nodeDatum.attributes?.type === "nt"
                    ? "#4f46e5"
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
                fontWeight="700"
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
