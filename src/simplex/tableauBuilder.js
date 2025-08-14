// src/simplex/tableauBuilder.js
// Construction du tableau initial du simplexe

/**
 * Construit le tableau initial du simplexe avec les variables d'écart et artificielles
 * @param {Array} parsedConstraints - Contraintes parsées
 * @param {number} numOriginal - Nombre de variables originales
 * @returns {Object} - Tableau initial et métadonnées
 */
export function buildInitialTableau(parsedConstraints, numOriginal) {
  // Calculer les indices pour colonnes supplémentaires
  const extraByConstraint = parsedConstraints.map(c => 
    c.sign === '<=' ? 1 : (c.sign === '>=' ? 2 : 1)
  );
  const totalExtra = extraByConstraint.reduce((a, b) => a + b, 0);
  const totalVars = numOriginal + totalExtra;
  const totalCols = totalVars + 1; // +1 pour RHS

  // Noms des variables
  const varNames = [];
  for (let i = 0; i < numOriginal; i++) {
    varNames.push(`x${i + 1}`);
  }

  // Construire le mapping des colonnes supplémentaires
  const mapping = [];
  let curExtra = numOriginal;
  const artificialCols = [];
  let slackCount = 0;
  let artificialCount = 0;

  for (let i = 0; i < parsedConstraints.length; i++) {
    const sign = parsedConstraints[i].sign;
    if (sign === '<=') {
      mapping[i] = { slack: curExtra, artificial: null };
      varNames.push(`s${++slackCount}`);
      curExtra += 1;
    } else if (sign === '>=') {
      mapping[i] = { slack: curExtra, artificial: curExtra + 1 };
      varNames.push(`s${++slackCount}`);
      varNames.push(`a${++artificialCount}`);
      artificialCols.push(curExtra + 1);
      curExtra += 2;
    } else { // =
      mapping[i] = { slack: null, artificial: curExtra };
      varNames.push(`a${++artificialCount}`);
      artificialCols.push(curExtra);
      curExtra += 1;
    }
  }

  // Construire le tableau initial (sans ligne Z)
  const tableau = [];
  for (let i = 0; i < parsedConstraints.length; i++) {
    const row = new Array(totalCols).fill(0);
    
    // Copier coefficients originaux
    for (let j = 0; j < numOriginal; j++) {
      row[j] = parsedConstraints[i].coefficients[j];
    }
    
    // Ajouter variables d'écart et artificielles
    for (let k = 0; k < parsedConstraints.length; k++) {
      const map = mapping[k];
      
      if (map.slack !== null) {
        const sign = parsedConstraints[k].sign;
        if (i === k) {
          row[map.slack] = (sign === '<=') ? 1 : -1;
        }
      }
      
      if (map.artificial !== null) {
        if (i === k) {
          row[map.artificial] = 1;
        }
      }
    }
    
    row[row.length - 1] = parsedConstraints[i].rhs;
    tableau.push(row);
  }

  return {
    tableau,
    varNames,
    artificialCols,
    mapping,
    totalVars,
    numOriginal
  };
}