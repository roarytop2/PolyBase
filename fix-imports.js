// fix-imports.js - Quick script to fix the imports
const fs = require('fs');

// Fix src/index.js imports
const indexContent = `#!/usr/bin/env node
const { Command } = require("commander");
const { scanDirectory } = require("./scanner");
const { generateReport, generatePolyfillReport } = require("./baselineCheck");

const program = new Command();

program
  .name("polybase")
  .description("CLI tool to scan JS for non-Baseline features and auto-polyfill")
  .version("0.1.0");

program
  .command("check <path>")
  .option("--target <year>", "Target Baseline year", "2023")
  .option("--json", "Output results as JSON")
  .action((path, options) => {
    console.log(\`Scanning \${path} against Baseline \${options.target}...\`);
    
    const scanResults = scanDirectory(path);
    const report = generateReport(scanResults, options.target);

    if (options.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      displayHumanReadableReport(report);
    }
  });

program
  .command("polyfill <path>")
  .option("--target <year>", "Target Baseline year", "2023")
  .option("--output <format>", "Output format: console, json, or markdown", "console")
  .action((path, options) => {
    console.log(\`Generating polyfills for \${path} against Baseline \${options.target}...\`);
    
    const scanResults = scanDirectory(path);
    const report = generatePolyfillReport(scanResults, options.target);

    switch (options.output) {
      case "json":
        console.log(JSON.stringify(report, null, 2));
        break;
      case "markdown":
        displayMarkdownReport(report);
        break;
      default:
        displayPolyfillReport(report);
    }
  });

function displayHumanReadableReport(report) {
  console.log(\`\\nBaseline \${report.summary.baselineYear} Compatibility Report\`);
  console.log("=".repeat(50));
  console.log(\`Files scanned: \${report.summary.filesScanned}\`);
  console.log(\`Safe features: \${report.summary.totalSafeFeatures}\`);
  console.log(\`Risky features: \${report.summary.totalRiskyFeatures}\`);
  
  const totalFeatures = report.summary.totalSafeFeatures + report.summary.totalRiskyFeatures;
  const coverage = totalFeatures === 0 ? 100 : Math.round((report.summary.totalSafeFeatures / totalFeatures) * 100);
  console.log(\`Coverage: \${coverage}%\`);

  console.log("\\nFile Details:");
  for (const [filePath, fileReport] of Object.entries(report.files)) {
    if (fileReport.hasIssues) {
      console.log(\`\\n\${filePath}:\`);
      fileReport.riskyFeatures.forEach(feat => console.log(\`  - \${feat}\`));
    } else {
      console.log(\`\\n\${filePath}:\`);
      console.log("  No compatibility issues found");
    }
  }
}

function displayPolyfillReport(report) {
  console.log(\`\\nPolyfill Recommendations for Baseline \${report.summary.baselineYear}\`);
  console.log("=".repeat(60));
  
  console.log(\`\\nSummary:\`);
  console.log(\`  Files scanned: \${report.summary.filesScanned}\`);
  console.log(\`  Risky features found: \${report.polyfillRecommendations.riskyFeatures.length}\`);
  
  if (report.polyfillRecommendations.installationCommands.length > 0) {
    console.log("\\nInstallation Commands:");
    report.polyfillRecommendations.installationCommands.forEach(cmd => console.log(\`  \${cmd}\`));
  }
  
  if (report.polyfillRecommendations.npmPackages.length > 0) {
    console.log("\\nRequired NPM Packages:");
    report.polyfillRecommendations.npmPackages.forEach(pkg => console.log(\`  - \${pkg}\`));
  }
  
  if (report.polyfillRecommendations.babelPlugins.length > 0) {
    console.log("\\nRequired Babel Plugins:");
    report.polyfillRecommendations.babelPlugins.forEach(plugin => console.log(\`  - \${plugin}\`));
  }
  
  if (Object.keys(report.polyfillRecommendations.codeSnippets).length > 0) {
    console.log("\\nCode Snippets for Manual Implementation:");
    for (const [feature, snippet] of Object.entries(report.polyfillRecommendations.codeSnippets)) {
      console.log(\`\\n\${feature}:\`);
      console.log(snippet.split('\\n').map(line => \`  \${line}\`).join('\\n'));
    }
  }
}

function displayMarkdownReport(report) {
  console.log(\`# Polyfill Report for Baseline \${report.summary.baselineYear}\`);
  console.log("\\n## Summary");
  console.log(\`- Files scanned: \${report.summary.filesScanned}\`);
  console.log(\`- Risky features: \${report.polyfillRecommendations.riskyFeatures.length}\`);
  
  if (report.polyfillRecommendations.installationCommands.length > 0) {
    console.log("\\n## Installation");
    console.log(\`\`\`bash\`);
    report.polyfillRecommendations.installationCommands.forEach(cmd => console.log(cmd));
    console.log("\`\`\`");
  }
}

program.parse(process.argv);
`;

// Fix src/baselineCheck.js imports
const baselineCheckContent = `const { BASELINE_FEATURES } = require("./baseline-data");
const PolyfillGenerator = require('./polyfillGen');

function checkAgainstBaseline(detectedFeatures, targetYear = "2023") {
  const baseline = BASELINE_FEATURES[targetYear];
  if (!baseline) {
    throw new Error(\`Unknown baseline year: \${targetYear}\`);
  }

  const riskyFeatures = detectedFeatures.filter(feature => 
    !baseline.supported.includes(feature)
  );

  const safeFeatures = detectedFeatures.filter(feature =>
    baseline.supported.includes(feature)
  );

  return {
    riskyFeatures,
    safeFeatures,
    baselineYear: targetYear,
    totalDetected: detectedFeatures.length,
    coverage: (safeFeatures.length / detectedFeatures.length) * 100 || 100
  };
}

function generateReport(scanResults, targetYear) {
  const report = {
    summary: {
      filesScanned: Object.keys(scanResults).length,
      totalRiskyFeatures: 0,
      totalSafeFeatures: 0,
      baselineYear: targetYear
    },
    files: {}
  };

  for (const [filePath, features] of Object.entries(scanResults)) {
    const fileCheck = checkAgainstBaseline(features, targetYear);
    
    report.files[filePath] = {
      riskyFeatures: fileCheck.riskyFeatures,
      safeFeatures: fileCheck.safeFeatures,
      hasIssues: fileCheck.riskyFeatures.length > 0
    };
    
    report.summary.totalRiskyFeatures += fileCheck.riskyFeatures.length;
    report.summary.totalSafeFeatures += fileCheck.safeFeatures.length;
  }

  return report;
}

function generatePolyfillReport(scanResults, targetYear) {
  const generator = new PolyfillGenerator(targetYear);
  const report = generateReport(scanResults, targetYear);
  
  const allRiskyFeatures = new Set();
  for (const fileReport of Object.values(report.files)) {
    fileReport.riskyFeatures.forEach(feat => allRiskyFeatures.add(feat));
  }

  const recommendations = generator.generateRecommendations(Array.from(allRiskyFeatures));
  const installationCommands = generator.generateInstallationCommands(recommendations);
  const codeSnippets = generator.generateCodeSnippets(Array.from(allRiskyFeatures));

  return {
    ...report,
    polyfillRecommendations: {
      riskyFeatures: Array.from(allRiskyFeatures),
      npmPackages: Array.from(recommendations.npmPackages),
      babelPlugins: Array.from(recommendations.babelPlugins),
      installationCommands,
      manualFixes: recommendations.manualFixes,
      codeSnippets
    }
  };
}

module.exports = { 
  checkAgainstBaseline, 
  generateReport,
  generatePolyfillReport
};
`;

// Write the fixed files
fs.writeFileSync('./src/index.js', indexContent);
fs.writeFileSync('./src/baselineCheck.js', baselineCheckContent);

console.log('✅ Fixed imports in index.js and baselineCheck.js');
