A simple React-based tool built to demonstrate the fundamental mechanics of **Bottom-Up Parsing**. This project serves as a visual aid for students learning about stack-based automata and context-free grammar reductions.

### 🛠 Reality Check: Current Limitations

* **Greedy Matching**: The parser uses a simple "first-match" reduction strategy. It does not use a DFA-based state machine (like an SLR or LALR parser).
* **String-Based Matching**: It checks the stack top against grammar rules using string concatenation rather than a pre-computed parsing table.
* **Manual Conflict Resolution**: It cannot handle Shift-Reduce conflicts; it simply prioritizes reductions by default.

### 🚀 Core Functionality

* **Linear Stack Manipulation**: Visualizes the `$`-indexed stack as it grows and shrinks.
* **Fragmented Forest View**: Renders the stack not as a single tree, but as a "forest" of partially completed sub-trees that merge as reductions occur.
* **Step-by-Step Debugging**: Provides a trace of every stack/buffer transition to help identify where a grammar might be failing (REJECT state).

### 🧩 The "Tree" Logic

The "Parse Tree" in this app is actually a collection of nested JSON objects generated on the fly:

1. **Shift**: Creates a leaf node object: `{ label: 'token', children: [] }`.
2. **Reduce**: Pops  objects from the stack array and wraps them in a new parent object: `{ label: 'LHS', children: [popped_nodes] }`.

### 📦 Quick Start

1. **Install**: `npm install`
2. **Run**: `npm run dev`
3. **Test**: Use the default grammar () to see how a string is consumed from right to left.

---

### Future "Actual Sophistication"

* [ ] **Parse Table Generation**: Implement the actual  state sets and GOTO/ACTION tables.
* [ ] **Lookahead Support**: Add  lookahead to handle more complex grammars.

**Would you like me to add a "Known Issues" section that explains why this parser might loop infinitely on certain recursive grammars?**
