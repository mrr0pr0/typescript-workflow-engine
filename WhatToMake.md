### **A Type-Safe Visual Workflow / Rule Engine (with plugins)**

Think **Notion + Zapier + XState had a baby**, but smaller and evil.

This single project forces you to use **more different TypeScript features than anything else**.

---

### 🔥 Core TypeScript Concepts (you _will_ use them)

- Discriminated unions
- Generics (basic → advanced → cursed)
- Conditional types
- Mapped types
- Recursive types
- Utility types (built-in + custom)
- `as const` + literal inference
- `satisfies`
- Type narrowing & exhaustiveness checks
- Branded / nominal types
- Readonly & immutability modeling

---

### 🧠 Advanced / Rare TS Concepts

- Type inference across function boundaries
- Type-safe event systems
- Variadic tuple types
- Template literal types
- Higher-kinded-ish patterns
- Compile-time graph validation
- Schema → runtime → type inference loops
- Module augmentation (for plugins)
- Phantom types

Most projects touch **maybe 30%** of these.
This one touches **~90%**.

---

## What the project actually is

### **A visual editor where users build logic workflows**

Users drag blocks like:

- Trigger (HTTP request, timer, button)
- Logic (if / switch / map)
- Data (transform, filter)
- Effects (API call, email, DB write)

Each block:

- Has **typed inputs**
- Produces **typed outputs**
- Can only connect to compatible blocks

And TypeScript enforces this.

---

## Why TypeScript becomes the star

### 1️⃣ Node typing (discriminated unions)

```ts
type Node =
  | { type: "trigger"; output: TriggerOutput }
  | { type: "condition"; input: boolean; output: boolean }
  | { type: "transform"; input: Data; output: Data };
```

---

### 2️⃣ Edge compatibility (conditional types)

```ts
type CanConnect<A, B> = A extends { output: infer O }
  ? B extends { input: infer I }
    ? O extends I
      ? true
      : false
    : false
  : false;
```

---

### 3️⃣ Graph typing (recursive + inference)

- Prevent cycles
- Ensure every node’s inputs are satisfied
- Infer final output type of the workflow

This is **not** trivial and forces deep TS thinking.

---

### 4️⃣ Plugin system (this is huge for TS variety)

Third-party plugins can add new node types.

That means:

- Generic plugin interfaces
- Module augmentation
- Constraint-based typing
- Safe extensibility without `any`

This alone teaches _real-world advanced TS_.

---

### 5️⃣ Typed runtime validation

You’ll need:

- Runtime schemas (Zod / custom)
- Compile-time inference from schemas
- Bridging runtime ↔ static typing

This is where people usually break 😄

---

## What makes it harder than others

| Project          | Why it loses                         |
| ---------------- | ------------------------------------ |
| Spreadsheet      | Mostly recursive types, less breadth |
| Rich text editor | Big, but TS less expressive          |
| Multiplayer app  | Event typing, but narrower           |
| Form engine      | Great TS, but limited domain         |
| State machine    | Deep, but not wide                   |

**Workflow engine** is both **deep AND wide**.

---

## If you want to go FULL masochist 🩸

Add:

- Versioned workflows (backward-compatible types)
- Undo/redo with immutable state typing
- Import/export JSON → typed restore
- Visual diffing between workflows

Now you’re basically doing compiler work in React.
