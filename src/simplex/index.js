// src/simplex/index.js
// Point d'entrée principal du module Simplex

export { parseExpression, parseConstraints } from './parser.js';
export { solveSimplex } from './solver.js';
export { testSimplex } from './test.js';
export { EPS } from './constants.js';