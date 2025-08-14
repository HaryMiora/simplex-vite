// src/simplex/parser.js
// Fonctions de parsing pour les expressions et contraintes

/**
 * Parse une expression linéaire du type "3x1 + 5x2 - 2x3"
 * @param {string} expr - Expression à parser
 * @returns {number[]} - Tableau des coefficients
 */
export function parseExpression(expr) {
  if (!expr || typeof expr !== 'string') return [];

  expr = expr.replace(/\s+/g, '');
  if (!expr.startsWith('-') && !expr.startsWith('+')) expr = '+' + expr;

  const terms = expr.match(/[+-][^+-]+/g) || [];
  const coefficients = [];
  let maxVarIndex = -1;

  terms.forEach(term => {
    const match = term.match(/([+-]?)(\d*\.?\d*)x(\d+)/i);
    if (match) {
      const sign = match[1] === '-' ? -1 : 1;
      const coeffStr = match[2];
      const coeffVal = coeffStr === '' ? 1 : parseFloat(coeffStr);
      const coef = sign * coeffVal;
      const varIdx = parseInt(match[3], 10) - 1;
      if (!Number.isFinite(varIdx) || varIdx < 0) return;
      maxVarIndex = Math.max(maxVarIndex, varIdx);
      if (coefficients[varIdx] === undefined) coefficients[varIdx] = 0;
      coefficients[varIdx] += coef;
    }
  });

  for (let i = 0; i <= maxVarIndex; i++) {
    if (coefficients[i] === undefined) coefficients[i] = 0;
  }
  return coefficients;
}

/**
 * Parse un tableau de contraintes
 * @param {string[]} constraints - Tableau des contraintes
 * @returns {Array} - Tableau des contraintes parsées
 */
export function parseConstraints(constraints) {
  if (!Array.isArray(constraints)) {
    throw new Error("constraints doit être un tableau de chaînes");
  }

  return constraints.map(constraint => {
    if (typeof constraint !== 'string') {
      throw new Error(`Contrainte invalide: ${constraint}`);
    }
    
    let operator, parts;
    if (constraint.includes('<=')) {
      operator = '<=';
      parts = constraint.split('<=');
    } else if (constraint.includes('>=')) {
      operator = '>=';
      parts = constraint.split('>=');
    } else if (constraint.includes('=') && !constraint.includes('<=') && !constraint.includes('>=')) {
      operator = '=';
      parts = constraint.split('=');
    } else {
      throw new Error(`Contrainte invalide: ${constraint}`);
    }
    
    if (parts.length !== 2) {
      throw new Error(`Contrainte mal formée: ${constraint}`);
    }
    
    const lhs = parts[0].trim();
    const rhs = parseFloat(parts[1].trim().replace(/\s+/g, '')); // enlever espaces dans 63 000 etc
    
    if (!Number.isFinite(rhs)) {
      throw new Error(`RHS invalide dans: ${constraint}`);
    }
    
    const coefficients = parseExpression(lhs);
    return { coefficients, sign: operator, rhs };
  });
}