// test-run.js - Simple test from root
console.log("🧪 Testing from root directory...");

try {
  // Test if we can load the scanner
  const { scanDirectory } = require("../src/scanner");
  console.log("✅ Scanner loaded successfully!");
  
  // Test if we can load baselineCheck
  const { generateReport } = require("../src/baselineCheck");
  console.log("✅ BaselineCheck loaded successfully!");
  
  // Test scanning
  console.log("📁 Scanning current directory...");
  const results = scanDirectory(".");
  console.log(`📊 Found ${Object.keys(results).length} files`);
  
  // Generate report
  const report = generateReport(results, "2023");
  console.log("✅ Report generated successfully!");
  
} catch (error) {
  console.error("❌ Error:", error.message);
  console.error("Stack:", error.stack);
}