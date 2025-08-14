// src/simplex/phase1.js
// Gestion de la Phase 1 du simplexe (recherche d'une base réalisable)

import { EPS } from './constants.js';
import { simplexIteration } from './iterations.js';
import { formatTableau, performPivot } from './tableau.js';

/**
 * Exécute la Phase 1 du simplexe pour trouver une base réalisable
 * @param {number[][]} tableau - Le tableau du simplexe
 * @param {number[]} artificialCols - Indices des colonnes artificielles
 * @param {string[]} steps - Tableau pour stocker les étapes
 * @param {string[]} varNames - Noms des variables
 * @returns {Object} - Résultat de la Phase 1
 */
export function executePhase1(tableau, artificialCols, steps, varNames) {
  if (artificialCols.length === 0) {
    return { success: true, tableau, varNames };
  }

  steps.push("=== PHASE 1: chercher une base réalisable (min sum artificielles) ===");

  // Construire ligne phase1 comme - sum(lignes de base artificielles)
  const totalCols = tableau[0].length;
  const phase1Row = new Array(totalCols).fill(0);
  
  artificialCols.forEach(colIdx => {
    for (let r = 0; r < tableau.length; r++) {
      if (Math.abs(tableau[r][colIdx] - 1) < EPS) {
        for (let j = 0; j < totalCols; j++) {
          phase1Row[j] += tableau[r][j];
        }
        break;
      }
    }
  });
  
  // Inverser les signes pour minimiser
  for (let j = 0; j < phase1Row.length; j++) {
    phase1Row[j] = -phase1Row[j];
  }

  tableau.push(phase1Row);
  steps.push("Tableau Phase 1 initial:");
  steps.push(formatTableau(tableau, varNames));

  try {
    simplexIteration(tableau, true, steps, varNames);
  } catch (err) {
    if (err.message && err.message.toLowerCase().includes('non born')) {
      return { success: false, error: 'Phase 1 non bornée' };
    }
    throw err;
  }

  steps.push("Tableau après Phase 1:");
  steps.push(formatTableau(tableau, varNames));

  // Vérifier faisabilité
  const zPhase1 = tableau[tableau.length - 1][tableau[0].length - 1];
  if (Math.abs(zPhase1) > 1e-6) {
    steps.push(`Valeur Phase 1 = ${zPhase1.toFixed(9)} => problème infaisable`);
    return { success: false, error: 'Problème infaisable (Phase 1 > 0)' };
  }

  // Retirer les variables artificielles basiques
  removeBasicArtificialVariables(tableau, artificialCols, steps, varNames);

  // Supprimer la ligne phase1
  tableau.pop();

  // Supprimer colonnes artificielles
  const { newTableau, newVarNames } = removeArtificialColumns(tableau, artificialCols, varNames);

  steps.push("Tableau après suppression des artificielles:");
  steps.push(formatTableau(newTableau, newVarNames));

  return { success: true, tableau: newTableau, varNames: newVarNames };
}

/**
 * Retire les variables artificielles basiques en pivotant si possible
 * @param {number[][]} tableau - Le tableau du simplexe
 * @param {number[]} artificialCols - Indices des colonnes artificielles
 * @param {string[]} steps - Tableau pour stocker les étapes
 * @param {string[]} varNames - Noms des variables
 */
function removeBasicArtificialVariables(tableau, artificialCols, steps, varNames) {
  const artColsSorted = artificialCols.slice().sort((a, b) => b - a); // desc
  
  for (const artCol of artColsSorted) {
    let basicRow = -1;
    let oneCount = 0;
    
    for (let r = 0; r < tableau.length - 1; r++) {
      if (Math.abs(tableau[r][artCol] - 1) < EPS) {
        oneCount++;
        basicRow = r;
      } else if (Math.abs(tableau[r][artCol]) > EPS) {
        oneCount = 0;
        basicRow = -1;
        break;
      }
    }
    
    if (oneCount === 1 && basicRow !== -1) {
      let foundCol = -1;
      for (let c = 0; c < tableau[0].length - 1; c++) {
        if (!artificialCols.includes(c) && Math.abs(tableau[basicRow][c]) > EPS) {
          foundCol = c;
          break;
        }
      }
      
      if (foundCol !== -1) {
        performPivot(tableau, basicRow, foundCol);
        steps.push(`Pivot pour sortir artificielle: ligne ${basicRow}, col ${foundCol}`);
        steps.push(formatTableau(tableau, varNames));
      }
    }
  }
}

/**
 * Supprime les colonnes artificielles du tableau
 * @param {number[][]} tableau - Le tableau du simplexe
 * @param {number[]} artificialCols - Indices des colonnes artificielles
 * @param {string[]} varNames - Noms des variables
 * @returns {Object} - Nouveau tableau et noms de variables
 */
function removeArtificialColumns(tableau, artificialCols, varNames) {
  const keepCols = [];
  const newVarNames = [];
  
  for (let c = 0; c < tableau[0].length; c++) {
    if (!artificialCols.includes(c) || c === tableau[0].length - 1) {
      keepCols.push(c);
      if (c < varNames.length) {
        newVarNames.push(varNames[c]);
      }
    }
  }
  
  const newTableau = [];
  for (let r = 0; r < tableau.length; r++) {
    const newRow = keepCols.map(ci => tableau[r][ci]);
    newTableau.push(newRow);
  }
  
  return { newTableau, newVarNames };
}