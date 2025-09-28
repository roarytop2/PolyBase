// src/baseline-data.js
const BASELINE_FEATURES = {
  "2023": {
    supported: [
      "Array.prototype.at",
      "Optional chaining (?.)",
      "Nullish coalescing (??)",
      "Promise.any",
      "String.prototype.replaceAll",
      "Logical assignment (&&=, ||=, ??=)",
      "Class fields",
      "Static class fields",
      "Private methods",
      "Top-level await",
      "Array.prototype.includes",
      "Object.entries",
      "Object.values",
      "String.prototype.padStart",
      "String.prototype.padEnd"
    ],
    unsupported: [
      "Array.groupBy",
      "Object.hasOwn",
      "Error.cause",
      "Array.prototype.toReversed",
      "Array.prototype.toSorted",
      "Array.prototype.toSpliced",
      "Array.prototype.with"
    ]
  },
  "2024": {
    supported: [
      "Array.groupBy",
      "Object.hasOwn", 
      "Error.cause",
      "Array.prototype.toReversed",
      "Array.prototype.toSorted",
      "Array.prototype.toSpliced",
      "Array.prototype.with"
    ],
    unsupported: [
      // Add newer features that aren't widely supported yet
    ]
  }
};

// Feature detection patterns
const FEATURE_PATTERNS = {
  "Array.prototype.at": {
  type: "MemberExpression",
  test: (path) => {
    // Match arr.at(-1) or [].at()
    return path.node.property?.name === "at" || path.node.property?.value === "at";
  }
},
"Optional chaining (?.)": {
  type: "OptionalMemberExpression"
},
  "Nullish coalescing (??)": {
  type: "LogicalExpression",
  test: (path) => path.node.operator === "??"
},
  "Promise.any": {
    type: "MemberExpression", 
    test: (path) =>
      path.node.property?.name === "any" &&
      path.node.object?.name === "Promise"
  },
  "Nullish coalescing (??)": {
    type: "LogicalExpression",
    test: (path) => path.node.operator === "??"
  },
  "Promise.any": {
    type: "MemberExpression", 
    test: (path) =>
      path.node.property?.name === "any" &&
      path.node.object?.name === "Promise"
  },
  "String.prototype.replaceAll": {
    type: "MemberExpression",
    test: (path) =>
      path.node.property?.name === "replaceAll" &&
      path.node.object?.type === "MemberExpression" &&
      path.node.object.property?.name === "prototype"
  },
  "Logical assignment (&&=, ||=, ??=)": {
  type: "AssignmentExpression",
  test: (path) => ["&&=", "||=", "??="].includes(path.node.operator)
},
"Class fields": {
  type: "ClassProperty",
  test: (path) => !path.node.static
},
"Static class fields": {
  type: "ClassProperty", 
  test: (path) => path.node.static === true
},
  "Private methods": {
    type: "ClassPrivateMethod"
  },
  "Private fields": {
    type: "ClassPrivateProperty"
  },
  "Top-level await": {
    type: "AwaitExpression",
    test: (path) => {
      // Check if await is at top level (not inside async function)
      let parent = path.parent;
      while (parent) {
        if (parent.type === "FunctionDeclaration" || 
            parent.type === "FunctionExpression" ||
            parent.type === "ArrowFunctionExpression") {
          return false;
        }
        parent = parent.parent;
      }
      return true;
    }
  },
  "Array.prototype.includes": {
    type: "MemberExpression",
    test: (path) =>
      path.node.property?.name === "includes" &&
      path.node.object?.type === "MemberExpression" &&
      path.node.object.property?.name === "prototype"
  },
  "Object.entries": {
    type: "MemberExpression",
    test: (path) =>
      path.node.property?.name === "entries" &&
      path.node.object?.name === "Object"
  },
  "Object.values": {
    type: "MemberExpression",
    test: (path) =>
      path.node.property?.name === "values" &&
      path.node.object?.name === "Object"
  },
  "String.prototype.padStart": {
    type: "MemberExpression",
    test: (path) =>
      path.node.property?.name === "padStart" &&
      path.node.object?.type === "MemberExpression" &&
      path.node.object.property?.name === "prototype"
  },
  "String.prototype.padEnd": {
    type: "MemberExpression",
    test: (path) =>
      path.node.property?.name === "padEnd" &&
      path.node.object?.type === "MemberExpression" &&
      path.node.object.property?.name === "prototype"
  }
};

module.exports = { BASELINE_FEATURES, FEATURE_PATTERNS };