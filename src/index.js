#!/usr/bin/env node
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
    console.log(`Scanning ${path} against Baseline ${options.target}...`);
    
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
    console.log(`Generating polyfills for ${path} against Baseline ${options.target}...`);
    
    const scanResults = scanDirectory(path);
    const report = generatePolyfillReport(scanResults, options.target);

    switch (options.output) {
      case "json":
        console.log(JSON.stringify(report, null, 2));
        break;
      case "markdown":
        displayMarkdownReport(report);
        break;
      case "html":
  const html = generateHTMLReport(report);
  console.log("📊 HTML report generated. Save the following as report.html:");
  console.log(html);
  break;
      default:
        displayPolyfillReport(report);
    }
  });

program
  .command("debug <path>")
  .option("--target <year>", "Target Baseline year", "2023")
  .action((path, options) => {
    console.log(`🔍 Debug scan for ${path}...`);
    
    const scanResults = scanDirectory(path);
    
    console.log(`📁 Found ${Object.keys(scanResults).length} files:`);
    for (const [filePath, features] of Object.entries(scanResults)) {
      console.log(`\n${filePath}:`);
      if (features.length === 0) {
        console.log("  No features detected");
      } else {
        features.forEach(feat => console.log(`  ✅ ${feat}`));
      }
    }
    
    // Test against baseline
    const report = generateReport(scanResults, options.target);
    console.log(`\n📊 Baseline ${options.target} Analysis:`);
    console.log(`Risky features: ${report.summary.totalRiskyFeatures}`);
    console.log(`Safe features: ${report.summary.totalSafeFeatures}`);
  });

  program
  .command("generate-config <path>")
  .option("--target <year>", "Target Baseline year", "2023")
  .option("--format <type>", "Config format: babel, package, or webpack", "babel")
  .action((path, options) => {
    console.log(`⚙️  Generating ${options.format} config for ${path}...`);
    
    const scanResults = scanDirectory(path);
    const report = generatePolyfillReport(scanResults, options.target);
    
    if (report.summary.totalRiskyFeatures === 0) {
      console.log("🎉 No config needed - your code is already Baseline compatible!");
      return;
    }
    
    const config = generateConfigFile(report, options.format);
    console.log(`\n📁 Save as ${config.filename}:\n`);
    console.log(config.content);
  });

function displayHumanReadableReport(report) {
  console.log(`\nBaseline ${report.summary.baselineYear} Compatibility Report`);
  console.log("=".repeat(50));
  console.log(`Files scanned: ${report.summary.filesScanned}`);
  console.log(`Safe features: ${report.summary.totalSafeFeatures}`);
  console.log(`Risky features: ${report.summary.totalRiskyFeatures}`);
  
  const totalFeatures = report.summary.totalSafeFeatures + report.summary.totalRiskyFeatures;
  const coverage = totalFeatures === 0 ? 100 : Math.round((report.summary.totalSafeFeatures / totalFeatures) * 100);
  console.log(`Coverage: ${coverage}%`);

  console.log("\nFile Details:");
  for (const [filePath, fileReport] of Object.entries(report.files)) {
    if (fileReport.hasIssues) {
      console.log(`\n${filePath}:`);
      fileReport.riskyFeatures.forEach(feat => console.log(`  - ${feat}`));
    } else {
      console.log(`\n${filePath}:`);
      console.log("  No compatibility issues found");
    }
  }
}

function displayPolyfillReport(report) {
  console.log(`\n🔧 Polyfill Recommendations for Baseline ${report.summary.baselineYear}`);
  console.log("=".repeat(60));
  
  // Summary with emoji visualization
  const totalFeatures = report.summary.totalRiskyFeatures + report.summary.totalSafeFeatures;
  const coverage = totalFeatures === 0 ? 100 : Math.round((report.summary.totalSafeFeatures / totalFeatures) * 100);
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files scanned: ${report.summary.filesScanned}`);
  console.log(`   Features found: ${totalFeatures}`);
  console.log(`   ✅ Safe: ${report.summary.totalSafeFeatures} (${coverage}% coverage)`);
  console.log(`   ⚠️  Needs polyfills: ${report.summary.totalRiskyFeatures}`);
  
  // Show risky features by file
  console.log(`\n🔍 Risky Features by File:`);
  let foundRisky = false;
  for (const [filePath, fileReport] of Object.entries(report.files)) {
    if (fileReport.riskyFeatures.length > 0) {
      foundRisky = true;
      console.log(`\n   📄 ${filePath}`);
      fileReport.riskyFeatures.forEach(feat => console.log(`      ⚠️  ${feat}`));
    }
  }
  
  if (!foundRisky) {
    console.log(`   🎉 No risky features found! Your code is Baseline ${report.summary.baselineYear} compatible!`);
    return;
  }

  // Polyfill recommendations
  const polyfillRecs = report.polyfillRecommendations;
  
  if (polyfillRecs.installationCommands.length > 0) {
    console.log(`\n📦 Installation Commands:`);
    polyfillRecs.installationCommands.forEach(cmd => {
      console.log(`   $ ${cmd}`);
    });
  }
  
  if (polyfillRecs.npmPackages.length > 0) {
    console.log(`\n📚 Required NPM Packages (runtime):`);
    polyfillRecs.npmPackages.forEach(pkg => {
      console.log(`   • ${pkg}`);
    });
  }
  
  if (polyfillRecs.babelPlugins.length > 0) {
    console.log(`\n⚙️  Required Babel Plugins (build time):`);
    polyfillRecs.babelPlugins.forEach(plugin => {
      console.log(`   • ${plugin}`);
    });
    
    console.log(`\n💡 Babel Configuration Example:`);
    console.log(`
   // .babelrc or babel.config.js
   {
     "plugins": [
       ${polyfillRecs.babelPlugins.map(plugin => `"${plugin}"`).join(",\n       ")}
     ]
   }
    `);
  }
  
  if (Object.keys(polyfillRecs.codeSnippets).length > 0) {
    console.log(`\n💡 Manual Implementation Snippets:`);
    for (const [feature, snippet] of Object.entries(polyfillRecs.codeSnippets)) {
      console.log(`\n   ${feature}:`);
      console.log(snippet.split('\n').map(line => `      ${line}`).join('\n'));
    }
  }
  
  console.log(`\n🎯 Next Steps:`);
  console.log(`   1. Run the installation commands above`);
  console.log(`   2. Configure your build system (Babel, Webpack, etc.)`);
  console.log(`   3. Run 'polybase check' again to verify compatibility`);
}

function displayMarkdownReport(report) {
  console.log(`# Polyfill Report for Baseline ${report.summary.baselineYear}`);
  console.log("\n## Summary");
  console.log(`- Files scanned: ${report.summary.filesScanned}`);
  console.log(`- Risky features: ${report.polyfillRecommendations.riskyFeatures.length}`);
  
  if (report.polyfillRecommendations.installationCommands.length > 0) {
    console.log("\n## Installation");
    console.log(```bash`);
    report.polyfillRecommendations.installationCommands.forEach(cmd => console.log(cmd));
    console.log("```");
  }
}
// Add this function to src/index.js
function generateConfigFile(report, format) {
  const polyfillRecs = report.polyfillRecommendations;
  
  switch (format) {
    case 'babel':
      return {
        filename: 'babel.config.js',
        content: `module.exports = {
  plugins: [
    ${polyfillRecs.babelPlugins.map(plugin => `"${plugin}"`).join(',\n    ')}
  ]
};`
      };
      
    case 'package':
      return {
        filename: 'package.json.additions',
        content: JSON.stringify({
          dependencies: polyfillRecs.npmPackages.reduce((acc, pkg) => {
            acc[pkg] = 'latest';
            return acc;
          }, {}),
          devDependencies: polyfillRecs.babelPlugins.reduce((acc, plugin) => {
            acc[plugin] = 'latest';
            return acc;
          }, {})
        }, null, 2)
      };
      
    case 'webpack':
      return {
        filename: 'webpack.config.polyfills.js',
        content: `const webpack = require('webpack');

module.exports = {
  // Add to your existing webpack config
  plugins: [
    new webpack.ProvidePlugin({
      // Polyfill global objects if needed
    })
  ],
  resolve: {
    fallback: {
      // Add polyfill fallbacks if needed
    }
  }
};`
      };
  }
}

function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Polybase Compatibility Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .metric { display: inline-block; margin: 0 20px; }
        .risky { color: #e74c3c; }
        .safe { color: #27ae60; }
        .file { margin: 10px 0; padding: 10px; border-left: 3px solid #ccc; }
        .risky-file { border-left-color: #e74c3c; background: #fee; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 Baseline ${report.summary.baselineYear} Compatibility Report</h1>
        <div class="metric">📁 <strong>Files scanned:</strong> ${report.summary.filesScanned}</div>
        <div class="metric safe">✅ <strong>Safe features:</strong> ${report.summary.totalSafeFeatures}</div>
        <div class="metric risky">⚠️ <strong>Risky features:</strong> ${report.summary.totalRiskyFeatures}</div>
    </div>
    
    <h2>🔍 File Analysis</h2>
    ${Object.entries(report.files).map(([file, data]) => `
        <div class="file ${data.hasIssues ? 'risky-file' : ''}">
            <strong>${file}</strong><br>
            ${data.riskyFeatures.length > 0 ? 
                `Risky: ${data.riskyFeatures.join(', ')}` : 
                '✅ No compatibility issues'
            }
        </div>
    `).join('')}
</body>
</html>`;
}

program.parse(process.argv);
