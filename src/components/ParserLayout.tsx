import React from "react";

interface ParserLayoutProps {
  title: string;
  badgeText: string;
  children: React.ReactNode;
}

export function ParserLayout({
  title,
  badgeText,
  children,
}: ParserLayoutProps) {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-zinc-800 selection:text-white">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-2">
            {title}
            <span className="text-xs bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded uppercase">
              {badgeText}
            </span>
          </h1>
        </header>

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
}
