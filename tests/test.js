// test.js - More explicit feature testing
// Array methods
const arr = [1, 2, 3];
console.log(arr.at(-1));                    // Array.prototype.at
console.log(arr.includes(2));               // Array.prototype.includes

// Optional chaining and nullish coalescing
const user = { profile: null };
console.log(user?.profile?.name);           // Optional chaining
const name = user?.name ?? 'Anonymous';     // Nullish coalescing

// Logical assignment
let x = 1;
x &&= 2;                                    // Logical assignment
let y = null;
y ||= 'default';

// Class features
class Counter {
  #value = 0;                              // Private fields
  static version = '1.0.0';                // Static class fields
  #privateMethod() {                       // Private methods
    return this.#value;
  }
}

// Object methods
console.log(Object.entries({a: 1, b: 2}));  // Object.entries
console.log(Object.values({a: 1, b: 2}));   // Object.values

// String methods
console.log('hello'.padStart(10, '-'));     // String.prototype.padStart
console.log('hello'.padEnd(10, '-'));       // String.prototype.padEnd
console.log('hello world'.replaceAll('hello', 'hi')); // String.prototype.replaceAll

// Explicit function calls to trigger MemberExpression
const includesTest = [1, 2, 3].includes(2);
const atTest = [1, 2, 3].at(0);