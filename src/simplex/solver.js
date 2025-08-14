// src/simplex/solver.js
// Solveur Simplexe principal (2-phases complet)

import { parseExpression, parseConstraints } from './parser.js';
import { buildInitialTableau } from './tableauBuilder.js';
import { executePhase1 } from './phase1.js';
import { simplexIteration } from './iterations.js';
import { eliminateBasicVarsFromObjective, formatTableau } from './tableau.js';
import { extractSolution } from './solution.js';

/**
 * Résout un problème de programmation linéaire avec la méthode du simplexe
 * @param {Object} problem - Problème à résoudre
 * @param {string} problem.objective - Fonction objectif (ex: "max: 3x1 + 5x2")
 * @param {string[]} problem.constraints - Contraintes (ex: ["x1 + 2x2 <= 6"])
 * @returns {Object} - Résultat de la résolution
 */
export function solveSimplex({ objective, constraints }) {
  const steps = [];
  
  try {
    // Validation des données d'entrée
    if (!objective || !constraints || constraints.length === 0) {
      steps.push("Erreur: Données d'entrée invalides");
      return { status: 'invalid', message: "Données d'entrée invalides", steps };
    }

    // Parse et normalise l'objectif
    let isMax = objective.toLowerCase().includes('max');
    const objExpr = objective.replace(/max|min|:/gi, '').trim();
    let objCoeffs = parseExpression(objExpr);
    const parsedCons = parseConstraints(constraints);

    // Détermine le nombre de variables originales
    let maxVarCount = objCoeffs.length;
    parsedCons.forEach(c => {
      maxVarCount = Math.max(maxVarCount, c.coefficients.length);
    });

    // Normalise les coefficients
    objCoeffs = normalizeCoefficients(objCoeffs, maxVarCount);
    parsedCons.forEach(c => {
      c.coefficients = normalizeCoefficients(c.coefficients, maxVarCount);
    });

    // Normalise les RHS négatives
    normalizeNegativeRHS(parsedCons);

    // Garde une copie des coefficients originaux
    const origObjCoeffs = objCoeffs.slice();

    steps.push(`Objectif: ${objective}`);
    steps.push(`Contraintes: ${constraints.join('; ')}`);
    steps.push(`Type: ${isMax ? 'MAX' : 'MIN'}`);
    steps.push(`Coeffs objectif (orig): [${origObjCoeffs.join(', ')}]`);

    // Convertit MIN en MAX pour simplifier le solveur
    if (!isMax) {
      objCoeffs = objCoeffs.map(v => -v);
      isMax = true;
      steps.push("Conversion MIN -> MAX (coefficients de l'objectif inversés pour le solveur interne).");
      steps.push(`Coeffs objectif (après conversion): [${objCoeffs.join(', ')}]`);
    }

    // Construit le tableau initial
    const {
      tableau,
      varNames,
      artificialCols,
      numOriginal
    } = buildInitialTableau(parsedCons, maxVarCount);

    steps.push("Tableau initial (sans Z):");
    steps.push(formatTableau(tableau, varNames));

    // Phase 1: trouve une base réalisable
    const phase1Result = executePhase1(tableau, artificialCols, steps, varNames);
    
    if (!phase1Result.success) {
      return {
        status: phase1Result.error.includes('non born') ? 'unbounded' : 'infeasible',
        message: phase1Result.error,
        steps
      };
    }

    let { tableau: finalTableau, varNames: finalVarNames } = phase1Result;

    // Phase 2: optimise l'objectif réel
    steps.push("=== PHASE 2: optimisation de l'objectif réel ===");

    // Construit la ligne Z
    const numColsNow = finalTableau[0].length;
    const zRow = new Array(numColsNow).fill(0);
    for (let j = 0; j < numOriginal; j++) {
      zRow[j] = isMax ? -objCoeffs[j] : objCoeffs[j];
    }
    finalTableau.push(zRow);

    // Élimine les contributions des variables basiques
    eliminateBasicVarsFromObjective(finalTableau, finalVarNames);

    steps.push("Tableau initial Phase 2 (avec Z):");
    steps.push(formatTableau(finalTableau, finalVarNames));

    // Exécute le simplexe final
    try {
      simplexIteration(finalTableau, isMax, steps, finalVarNames);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('non born')) {
        return { status: 'unbounded', message: 'Solution non bornée (Phase 2)', steps };
      }
      throw err;
    }

    steps.push("Tableau final Phase 2:");
    steps.push(formatTableau(finalTableau, finalVarNames));

    // Extrait la solution finale
    const { solution, z } = extractSolution(finalTableau, numOriginal, origObjCoeffs, steps);

    return {
      status: 'optimal',
      solution,
      z,
      tableau: finalTableau,
      varNames: finalVarNames,
      message: 'Solution optimale trouvée',
      steps
    };

  } catch (error) {
    steps.push(`Erreur: ${error.message}`);
    return { status: 'error', message: error.message, steps };
  }
}

/**
 * Normalise un tableau de coefficients à une longueur donnée
 * @param {number[]} coeffs - Coefficients à normaliser
 * @param {number} length - Longueur souhaitée
 * @returns {number[]} - Coefficients normalisés
 */
function normalizeCoefficients(coeffs, length) {
  const normalized = coeffs.slice();
  for (let i = 0; i < length; i++) {
    if (normalized[i] === undefined) normalized[i] = 0;
  }
  return normalized;
}

/**
 * Normalise les contraintes avec RHS négatives
 * @param {Array} constraints - Contraintes à normaliser
 */
function normalizeNegativeRHS(constraints) {
  constraints.forEach(c => {
    if (c.rhs < 0) {
      c.coefficients = c.coefficients.map(v => -v);
      c.rhs = -c.rhs;
      if (c.sign === '<=') c.sign = '>=';
      else if (c.sign === '>=') c.sign = '<=';
    }
  });
}