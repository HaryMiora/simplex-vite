// src/simplex/iterations.js
// Gestion des itérations du simplexe

import { EPS, MAX_ITERATIONS } from './constants.js';
import { performPivot, formatTableau } from './tableau.js';

/**
 * Exécute les itérations du simplexe
 * @param {number[][]} tableau - Le tableau du simplexe
 * @param {boolean} isMax - True si maximisation, false si minimisation
 * @param {string[]} steps - Tableau pour stocker les étapes
 * @param {string[]} varNames - Noms des variables
 */
export function simplexIteration(tableau, isMax, steps = [], varNames = []) {
  let iter = 0;
  
  while (iter++ < MAX_ITERATIONS) {
    const zRowIdx = tableau.length - 1;
    const zRow = tableau[zRowIdx];
    
    // Choisir colonne entrante
    const pivotCol = findEnteringVariable(zRow, isMax);
    
    if (pivotCol === -1) {
      steps.push(`Optimalité atteinte (itérations=${iter-1})`);
      break;
    }

    steps.push(`Itération ${iter}: variable entrante = ${varNames[pivotCol] || 'col'+pivotCol}`);

    // Test du ratio pour trouver la variable sortante
    const pivotRow = findLeavingVariable(tableau, pivotCol);
    
    if (pivotRow === -1) {
      throw new Error("Solution non bornée");
    }

    const minRatio = tableau[pivotRow][tableau[0].length - 1] / tableau[pivotRow][pivotCol];
    steps.push(`Pivot ligne ${pivotRow}, ratio = ${minRatio.toFixed(6)}`);

    // Effectuer le pivot
    performPivot(tableau, pivotRow, pivotCol);
    steps.push("Tableau après pivot:");
    steps.push(formatTableau(tableau, varNames));
  }

  if (iter >= MAX_ITERATIONS) {
    throw new Error("Nombre maximum d'itérations atteint");
  }
}

/**
 * Trouve la variable entrante (colonne pivot)
 * @param {number[]} zRow - Ligne de la fonction objectif
 * @param {boolean} isMax - True si maximisation
 * @returns {number} - Index de la colonne pivot (-1 si optimal)
 */
function findEnteringVariable(zRow, isMax) {
  let pivotCol = -1;
  
  if (isMax) {
    let minVal = 0;
    for (let j = 0; j < zRow.length - 1; j++) {
      if (zRow[j] < minVal - EPS) {
        minVal = zRow[j];
        pivotCol = j;
      }
    }
  } else {
    let maxVal = 0;
    for (let j = 0; j < zRow.length - 1; j++) {
      if (zRow[j] > maxVal + EPS) {
        maxVal = zRow[j];
        pivotCol = j;
      }
    }
  }
  
  return pivotCol;
}

/**
 * Trouve la variable sortante (ligne pivot) avec le test du ratio
 * @param {number[][]} tableau - Le tableau du simplexe
 * @param {number} pivotCol - Colonne pivot
 * @returns {number} - Index de la ligne pivot (-1 si non borné)
 */
function findLeavingVariable(tableau, pivotCol) {
  let pivotRow = -1;
  let minRatio = Infinity;
  
  for (let r = 0; r < tableau.length - 1; r++) {
    const a = tableau[r][pivotCol];
    if (a > EPS) {
      const ratio = tableau[r][tableau[0].length - 1] / a;
      if (ratio >= -EPS && ratio < minRatio - EPS) {
        minRatio = ratio;
        pivotRow = r;
      }
    }
  }
  
  return pivotRow;
}