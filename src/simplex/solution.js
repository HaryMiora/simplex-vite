// src/simplex/solution.js
// Extraction de la solution finale du tableau

import { EPS } from './constants.js';

/**
 * Extrait la solution optimale du tableau final
 * @param {number[][]} tableau - Tableau final du simplexe
 * @param {number} numOriginal - Nombre de variables originales
 * @param {number[]} origObjCoeffs - Coefficients originaux de l'objectif
 * @param {string[]} steps - Tableau pour stocker les étapes
 * @returns {Object} - Solution avec valeurs des variables et fonction objectif
 */
export function extractSolution(tableau, numOriginal, origObjCoeffs, steps) {
  const solution = {};
  
  // Initialiser toutes les variables à 0
  for (let i = 0; i < numOriginal; i++) {
    solution[`x${i + 1}`] = 0;
  }
  
  // Extraire les valeurs des variables basiques
  for (let col = 0; col < numOriginal; col++) {
    let oneRow = -1;
    let oneCount = 0;
    
    for (let r = 0; r < tableau.length - 1; r++) {
      if (Math.abs(tableau[r][col] - 1) < EPS) {
        oneCount++;
        oneRow = r;
      } else if (Math.abs(tableau[r][col]) > EPS) {
        oneCount = -1;
        break;
      }
    }
    
    if (oneCount === 1 && oneRow !== -1) {
      solution[`x${col + 1}`] = Math.max(0, tableau[oneRow][tableau[0].length - 1]);
    } else {
      solution[`x${col + 1}`] = 0;
    }
  }
  
  // Calculer Z à partir des coefficients originaux
  let zCalc = 0;
  for (let i = 0; i < numOriginal; i++) {
    zCalc += (origObjCoeffs[i] || 0) * (solution[`x${i + 1}`] || 0);
  }
  
  // Ajouter les détails de la solution aux étapes
  steps.push("Solution extraite:");
  Object.keys(solution).forEach(k => {
    steps.push(`${k} = ${solution[k].toFixed(6)}`);
  });
  steps.push(`Z = ${zCalc.toFixed(6)}`);
  
  return {
    solution,
    z: zCalc
  };
}