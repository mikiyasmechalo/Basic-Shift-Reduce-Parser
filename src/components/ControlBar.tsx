import React from "react";
import Button from "./Button";

interface ControlBarProps {
  onStep: () => void;
  canStep: boolean;
  stepLabel?: string;
  actionStatus?: string;
  children?: React.ReactNode;
}

export function ControlBar({
  onStep,
  canStep,
  stepLabel = "Step Parser",
  actionStatus,
  children,
}: ControlBarProps) {
  const getStatusColor = (status?: string) => {
    if (status === "REJECT") return "text-red-400";
    if (status === "ACCEPT") return "text-green-400";
    return "text-zinc-200";
  };

  return (
    <div className="flex items-center gap-4 border-t border-zinc-900 pt-6 flex-wrap">
      <Button
        className="w-full sm:w-auto"
        variant="primary"
        onClick={onStep}
        disabled={!canStep}
      >
        {stepLabel}
      </Button>

      {children}

      {actionStatus && (
        <span className="text-sm font-mono px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 ml-auto sm:ml-0">
          Next Action:{" "}
          <span
            className={`text-lg font-mono font-bold ${getStatusColor(actionStatus)}`}
          >
            {actionStatus}
          </span>
        </span>
      )}
    </div>
  );
}
