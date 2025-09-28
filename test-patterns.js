
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const { FEATURE_PATTERNS } = require('./src/baseline-data');

const testCode = `
const arr = [1, 2, 3];
console.log(arr.at(-1));

const user = { profile: null };
console.log(user?.profile?.name);

const name = user?.name ?? 'Anonymous';
let x = 1;
x &&= 2;

class Counter {
  #value = 0;
  static version = '1.0.0';
}

console.log([1, 2, 3].includes(2));
console.log(Object.entries({a: 1, b: 2}));
`;

function testPatterns(code) {
  const ast = parser.parse(code, {
    sourceType: 'module',
    ecmaVersion: 'latest',
    plugins: ['jsx', 'typescript']
  });

  const detectedFeatures = new Set();

  traverse(ast, {
    enter(path) {
      for (const [featureName, pattern] of Object.entries(FEATURE_PATTERNS)) {
        if (path.node.type === pattern.type) {
          if (!pattern.test || pattern.test(path)) {
            detectedFeatures.add(featureName);
          }
        }
      }
    }
  });

  return Array.from(detectedFeatures);
}

console.log('🧪 Testing feature patterns...');
const features = testPatterns(testCode);
console.log('Detected features:', features);