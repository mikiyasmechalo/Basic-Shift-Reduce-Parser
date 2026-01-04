import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import GreedyParser from "./pages/GreedyParser";
import BacktrackingParser from "./pages/BacktrackingParser";
import LR0Parser from "./pages/LR0Parser";

function App() {
  return (
    <BrowserRouter>
      <nav className="bg-zinc-900 border-b border-zinc-800 p-4">
        <div className="max-w-7xl mx-auto flex gap-6 text-sm font-medium">
          <Link
            to="/greedy"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Greedy Parser
          </Link>
          <Link
            to="/backtrack"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            Backtracking Parser
          </Link>

          <Link
            to="/lr0"
            className="text-zinc-400 hover:text-white transition-colors"
          >
            LR(0) Parser
          </Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/greedy" replace />} />

        <Route path="/greedy" element={<GreedyParser />} />
        <Route path="/backtrack" element={<BacktrackingParser />} />
        <Route path="/lr0" element={<LR0Parser />} />
        <Route
          path="*"
          element={
            <div className="flex items-center justify-center h-screen text-zinc-500">
              404 | Page Not Found
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
