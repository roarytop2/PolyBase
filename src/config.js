// src/config.js
const fs = require('fs');
const path = require('path');

class Config {
  constructor() {
    this.configPath = path.join(process.cwd(), 'polybase.config.json');
    this.defaultConfig = {
      target: '2023',
      ignorePatterns: ['node_modules', 'dist', 'build'],
      includeExtensions: ['.js', '.jsx', '.ts', '.tsx'],
      output: 'console'
    };
  }

  load() {
    if (fs.existsSync(this.configPath)) {
      try {
        const userConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        return { ...this.defaultConfig, ...userConfig };
      } catch (error) {
        console.warn('⚠️  Invalid config file, using defaults');
        return this.defaultConfig;
      }
    }
    return this.defaultConfig;
  }

  generateTemplate() {
    const template = {
      target: "2023",
      ignorePatterns: ["node_modules", "dist", "build", "*.test.js"],
      includeExtensions: [".js", ".jsx", ".ts", ".tsx", ".vue"],
      output: "console",
      customPolyfills: {
        "MyCustomFeature": "my-polyfill-package"
      }
    };
    
    fs.writeFileSync('polybase.config.json', JSON.stringify(template, null, 2));
    console.log('✅ Created polybase.config.json template');
  }
}

module.exports = Config;