import React from "react";

interface VisualizationSplitProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  leftPanelHeight?: string;
}

export function VisualizationSplit({
  leftPanel,
  rightPanel,
  leftPanelHeight = "max-h-150",
}: VisualizationSplitProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8 min-h-150">
      <div className={`h-full ${leftPanelHeight}`}>{leftPanel}</div>
      <div className={`h-full ${leftPanelHeight}`}>{rightPanel}</div>
    </div>
  );
}
