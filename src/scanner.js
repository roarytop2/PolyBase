
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { FEATURE_PATTERNS } = require("./baseline-data");

function scanFile(filePath) {
  const code = fs.readFileSync(filePath, "utf-8");

  try {
    const ast = parser.parse(code, {
      sourceType: "module",
      ecmaVersion: "latest",
      plugins: [
        "jsx", 
        "typescript",
        "classProperties",
        "classPrivateProperties",
        "classPrivateMethods",
        "logicalAssignment",
        "optionalChaining",
        "nullishCoalescingOperator"
      ]
    });

    const features = new Set();

    traverse(ast, {
      enter(path) {
        // Check each node against our feature patterns
        for (const [featureName, pattern] of Object.entries(FEATURE_PATTERNS)) {
          if (path.node.type === pattern.type) {
            try {
              if (!pattern.test || pattern.test(path)) {
                features.add(featureName);
              }
            } catch (error) {
              // Skip patterns that error during testing
              console.warn(`Pattern test error for ${featureName}:`, error.message);
            }
          }
        }
      }
    });

    return [...features];
  } catch (error) {
    console.error(`Error parsing ${filePath}:`, error.message);
    return [];
  }
}


function scanDirectory(dir) {
  let results = {};
  
  function scan(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and other ignored directories
        if (item === 'node_modules' || item.startsWith('.')) continue;
        scan(fullPath);
      } else if (/\.(js|jsx|ts|tsx)$/.test(item)) {
        results[fullPath] = scanFile(fullPath);
      }
    }
  }
  
  scan(dir);
  return results;
}

module.exports = { scanFile, scanDirectory };