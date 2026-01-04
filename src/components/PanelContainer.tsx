import React, { useState } from "react";

interface PanelContainerProps {
  children: React.ReactNode;
  title?: string;
  enableFullscreen?: boolean;
  className?: string;
}

export function PanelContainer({
  children,
  title,
  enableFullscreen = true,
  className = "",
}: PanelContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-zinc-950 p-6 flex flex-col"
    : `relative h-full bg-zinc-900/30 border border-zinc-800 rounded-lg flex flex-col ${className}`;

  return (
    <div className={containerClasses}>
      {(title || enableFullscreen) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 shrink-0">
          {title && (
            <h3 className="font-medium text-zinc-400 text-sm uppercase tracking-wider">
              {title}
            </h3>
          )}

          {enableFullscreen && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="ml-auto p-1.5 text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 rounded-md transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                  <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                  <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                  <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
              ) : (
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M15 3h6v6" />
                  <path d="M9 21H3v-6" />
                  <path d="M21 3l-7 7" />
                  <path d="M3 21l7-7" />
                </svg>
              )}
            </button>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="flex-1 overflow-auto min-h-0 relative">{children}</div>
    </div>
  );
}
