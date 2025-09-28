const { BASELINE_FEATURES } = require('./baseline-data');

class PolyfillGenerator {
  constructor(targetYear = '2023') {
    this.targetYear = targetYear;
    this.baseline = BASELINE_FEATURES[targetYear];
    this.polyfills = new Set();
  }

  // Map features to their polyfill packages
  getPolyfillMapping(feature) {
    const polyfillMap = {
      'Array.prototype.at': 'array.prototype.at',
      'Optional chaining (?.)': '@babel/plugin-proposal-optional-chaining',
      'Nullish coalescing (??)': '@babel/plugin-proposal-nullish-coalescing-operator',
      'Promise.any': 'promise.any',
      'String.prototype.replaceAll': 'string.prototype.replaceall',
      'Logical assignment (&&=, ||=, ??=)': '@babel/plugin-proposal-logical-assignment-operators',
      'Private fields': '@babel/plugin-proposal-class-properties',
      'Private methods': '@babel/plugin-proposal-private-methods',
      'Top-level await': '@babel/plugin-syntax-top-level-await',
      'Array.prototype.includes': 'array.prototype.includes',
      'Object.entries': 'object.entries',
      'Object.values': 'object.values',
      'String.prototype.padStart': 'string.prototype.padstart',
      'String.prototype.padEnd': 'string.prototype.padend',
      'Array.groupBy': 'array.prototype.group',
      'Object.hasOwn': 'object.hasown',
      'Error.cause': 'error-cause'
    };

    return polyfillMap[feature];
  }

  // Generate polyfill recommendations
  generateRecommendations(riskyFeatures) {
    const recommendations = {
      npmPackages: new Set(),
      babelPlugins: new Set(),
      polyfillScripts: new Set(),
      manualFixes: []
    };

    for (const feature of riskyFeatures) {
      const polyfill = this.getPolyfillMapping(feature);
      
      if (polyfill) {
        if (polyfill.startsWith('@babel/')) {
          recommendations.babelPlugins.add(polyfill);
        } else {
          recommendations.npmPackages.add(polyfill);
        }
      } else {
        recommendations.manualFixes.push(`Feature "${feature}" may require manual implementation`);
      }
    }

    return recommendations;
  }

  // Generate installation commands
  generateInstallationCommands(recommendations) {
    const commands = [];

    if (recommendations.npmPackages.size > 0) {
      const packages = Array.from(recommendations.npmPackages).join(' ');
      commands.push(`npm install ${packages}`);
    }

    if (recommendations.babelPlugins.size > 0) {
      const plugins = Array.from(recommendations.babelPlugins).join(' ');
      commands.push(`npm install --save-dev ${plugins}`);
    }

    return commands;
  }

  // Generate polyfill code snippets
  generateCodeSnippets(riskyFeatures) {
    const snippets = {};

    riskyFeatures.forEach(feature => {
      switch (feature) {
        case 'Array.prototype.at':
          snippets[feature] = `
// Polyfill for Array.prototype.at
if (!Array.prototype.at) {
  Array.prototype.at = function(index) {
    index = Math.trunc(index) || 0;
    if (index < 0) index += this.length;
    if (index < 0 || index >= this.length) return undefined;
    return this[index];
  };
}`;
          break;

        case 'Nullish coalescing (??)':
          snippets[feature] = `
// Alternative to nullish coalescing
const result = value != null ? value : defaultValue;
// Instead of: const result = value ?? defaultValue;`;
          break;

        case 'Optional chaining (?.)':
          snippets[feature] = `
// Alternative to optional chaining
const name = user && user.profile && user.profile.name;
// Instead of: const name = user?.profile?.name;`;
          break;

        case 'Array.prototype.includes':
          snippets[feature] = `
// Polyfill for Array.prototype.includes
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement, fromIndex) {
    if (this == null) throw new TypeError('"this" is null or not defined');
    
    var O = Object(this);
    var len = O.length >>> 0;
    if (len === 0) return false;
    
    var n = fromIndex | 0;
    var k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);
    
    while (k < len) {
      if (O[k] === searchElement) return true;
      k++;
    }
    return false;
  };
}`;
          break;

        case 'Object.entries':
          snippets[feature] = `
// Polyfill for Object.entries
if (!Object.entries) {
  Object.entries = function(obj) {
    var ownProps = Object.keys(obj);
    var i = ownProps.length;
    var resArray = new Array(i);
    while (i--) {
      resArray[i] = [ownProps[i], obj[ownProps[i]]];
    }
    return resArray;
  };
}`;
          break;

        case 'Promise.any':
          snippets[feature] = `
// Polyfill for Promise.any
if (!Promise.any) {
  Promise.any = function(promises) {
    return new Promise((resolve, reject) => {
      if (!promises || promises.length === 0) {
        reject(new AggregateError([], "All promises were rejected"));
      }
      
      var errors = [];
      var rejectedCount = 0;
      
      promises.forEach((promise, index) => {
        Promise.resolve(promise).then(resolve).catch(error => {
          errors[index] = error;
          rejectedCount++;
          if (rejectedCount === promises.length) {
            reject(new AggregateError(errors, "All promises were rejected"));
          }
        });
      });
    });
  };
}`;
          break;
      }
    });

    return snippets;
  }
}

module.exports = PolyfillGenerator;
