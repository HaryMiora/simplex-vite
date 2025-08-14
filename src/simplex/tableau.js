// src/simplex/tableau.js
// Opérations sur le tableau du simplexe

import { EPS } from './constants.js';

/**
 * Effectue une opération de pivot sur le tableau
 * @param {number[][]} tableau - Le tableau du simplexe
 * @param {number} pivotRow - Ligne du pivot
 * @param {number} pivotCol - Colonne du pivot
 */
export function performPivot(tableau, pivotRow, pivotCol) {
  const pivot = tableau[pivotRow][pivotCol];
  if (Math.abs(pivot) < EPS) {
    throw new Error("Pivot trop petit");
  }
  
  // Diviser ligne pivot par l'élément pivot
  for (let j = 0; j < tableau[pivotRow].length; j++) {
    tableau[pivotRow][j] /= pivot;
  }
  
  // Éliminer dans les autres lignes
  for (let r = 0; r < tableau.length; r++) {
    if (r === pivotRow) continue;
    const factor = tableau[r][pivotCol];
    if (Math.abs(factor) > EPS) {
      for (let j = 0; j < tableau[r].length; j++) {
        tableau[r][j] -= factor * tableau[pivotRow][j];
      }
    }
  }
}

/**
 * Élimine les contributions des variables basiques de la ligne objectif
 * @param {number[][]} tableau - Le tableau du simplexe
 * @param {string[]} varNames - Noms des variables
 */
export function eliminateBasicVarsFromObjective(tableau, varNames) {
  const zRowIndex = tableau.length - 1;
  const numCols = tableau[0].length;
  
  for (let col = 0; col < Math.min(varNames.length, numCols - 1); col++) {
    let basicRow = -1;
    let oneFound = false;
    let isBasic = true;
    
    for (let r = 0; r < tableau.length - 1; r++) {
      const v = tableau[r][col];
      if (Math.abs(v - 1) < EPS && !oneFound) {
        basicRow = r;
        oneFound = true;
      } else if (Math.abs(v) > EPS) {
        isBasic = false;
        break;
      }
    }
    
    if (isBasic && oneFound) {
      const factor = tableau[zRowIndex][col];
      if (Math.abs(factor) > EPS) {
        for (let j = 0; j < numCols; j++) {
          tableau[zRowIndex][j] -= factor * tableau[basicRow][j];
        }
      }
    }
  }
}

/**
 * Formate le tableau pour l'affichage
 * @param {number[][]} tableau - Le tableau à formater
 * @param {string[]} varNames - Noms des variables
 * @returns {string} - Tableau formaté
 */
export function formatTableau(tableau, varNames = []) {
  if (!tableau || tableau.length === 0) return "";
  
  const ncols = tableau[0].length;
  const cols = [];
  
  for (let i = 0; i < ncols - 1; i++) {
    cols.push(varNames[i] || `c${i}`);
  }
  cols.push('RHS');
  
  const header = cols.join('\t');
  const lines = tableau.map(row => 
    row.map(v => v.toFixed(6)).join('\t')
  );
  
  return header + '\n' + lines.join('\n');
}