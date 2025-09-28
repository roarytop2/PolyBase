const { BASELINE_FEATURES } = require("./baseline-data");
const PolyfillGenerator = require('./polyfillGen');

function checkAgainstBaseline(detectedFeatures, targetYear = "2023") {
  const baseline = BASELINE_FEATURES[targetYear];
  if (!baseline) {
    throw new Error(`Unknown baseline year: ${targetYear}`);
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
