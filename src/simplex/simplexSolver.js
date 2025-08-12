// src/simplex/simplexSolver.js
// Solveur Simplexe 2-phases complet (MAX / MIN), compatible <=, >=, =
// Exporte: parseExpression, parseConstraints, solveSimplex, testSimplex

const EPS = 1e-9;

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

export function parseConstraints(constraints) {
  if (!Array.isArray(constraints)) throw new Error("constraints doit être un tableau de chaînes");

  return constraints.map(constraint => {
    if (typeof constraint !== 'string') throw new Error(`Contrainte invalide: ${constraint}`);
    let operator, parts;
    if (constraint.includes('<=')) {
      operator = '<=';
      parts = constraint.split('<=');
    } else if (constraint.includes('>=')) {
      operator = '>=';
      parts = constraint.split('>=');
    } else if (constraint.includes('=') && !constraint.includes('<=' ) && !constraint.includes('>=')) {
      operator = '=';
      parts = constraint.split('=');
    } else {
      throw new Error(`Contrainte invalide: ${constraint}`);
    }
    if (parts.length !== 2) throw new Error(`Contrainte mal formée: ${constraint}`);
    const lhs = parts[0].trim();
    const rhs = parseFloat(parts[1].trim().replace(/\s+/g, '')); // enlever espaces dans 63 000 etc
    if (!Number.isFinite(rhs)) throw new Error(`RHS invalide dans: ${constraint}`);
    const coefficients = parseExpression(lhs);
    return { coefficients, sign: operator, rhs };
  });
}


// ----------------------- SOLVE SIMPLEX (2 PHASES) -----------------------
export function solveSimplex({ objective, constraints }) {
  const steps = [];
  try {
    if (!objective || !constraints || constraints.length === 0) {
      steps.push("Erreur: Données d'entrée invalides");
      return { status: 'invalid', message: "Données d'entrée invalides", steps };
    }

    let isMax = objective.toLowerCase().includes('max');
    const objExpr = objective.replace(/max|min|:/gi, '').trim();
    let objCoeffs = parseExpression(objExpr);
    const parsedCons = parseConstraints(constraints);

    // déterminer le nombre de variables originales (prendre max entre obj et contraintes)
    let maxVarCount = objCoeffs.length;
    parsedCons.forEach(c => { maxVarCount = Math.max(maxVarCount, c.coefficients.length); });

    // normaliser objCoeffs length
    for (let i = 0; i < maxVarCount; i++) if (objCoeffs[i] === undefined) objCoeffs[i] = 0;

    // normaliser toutes les contraintes coefficients
    parsedCons.forEach(c => {
      for (let i = 0; i < maxVarCount; i++) if (c.coefficients[i] === undefined) c.coefficients[i] = 0;
    });

    // normaliser RHS négatives : multiplier par -1 si nécessaire
    parsedCons.forEach(c => {
      if (c.rhs < 0) {
        c.coefficients = c.coefficients.map(v => -v);
        c.rhs = -c.rhs;
        if (c.sign === '<=') c.sign = '>=';
        else if (c.sign === '>=') c.sign = '<=';
      }
    });

    // garder une copie des coefficients originaux (pour calcul Z final si on convertit min->max)
    const origObjCoeffs = objCoeffs.slice();

    steps.push(`Objectif: ${objective}`);
    steps.push(`Contraintes: ${constraints.join('; ')}`);
    steps.push(`Type: ${isMax ? 'MAX' : 'MIN'}`);
    steps.push(`Coeffs objectif (orig): [${origObjCoeffs.join(', ')}]`);

    // --- IMPORTANT ---
    // Pour éviter les confusions de signe en Phase 2, on convertit tout problème MIN en MAX
    // en inversant les coefficients de l'objectif; on garde origObjCoeffs pour le calcul final de Z.
    if (!isMax) {
      objCoeffs = objCoeffs.map(v => -v);
      isMax = true;
      steps.push("Conversion MIN -> MAX (coefficients de l'objectif inversés pour le solveur interne).");
      steps.push(`Coeffs objectif (après conversion): [${objCoeffs.join(', ')}]`);
    }

    // construire indices pour colonnes supplémentaires (slack / artificielles)
    const extraByConstraint = parsedCons.map(c => c.sign === '<=' ? 1 : (c.sign === '>=' ? 2 : 1));
    const totalExtra = extraByConstraint.reduce((a,b) => a+b, 0);
    const numOriginal = maxVarCount;
    const totalVars = numOriginal + totalExtra;
    const totalCols = totalVars + 1; // +1 pour RHS

    // varNames (x1..xn) + we'll push s.. and a..
    const varNames = [];
    for (let i = 0; i < numOriginal; i++) varNames.push(`x${i+1}`);

    // build mapping of extra columns for each constraint
    const mapping = [];
    let curExtra = numOriginal;
    const artificialCols = [];
    let slackCount = 0;
    let artificialCount = 0;

    for (let i = 0; i < parsedCons.length; i++) {
      const sign = parsedCons[i].sign;
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

    // construire le tableau initial (sans ligne Z)
    let tableau = [];
    for (let i = 0; i < parsedCons.length; i++) {
      const row = new Array(totalCols).fill(0);
      // copier coefficients originales
      for (let j = 0; j < numOriginal; j++) row[j] = parsedCons[i].coefficients[j];
      // slack / artificial selon mapping
      for (let k = 0; k < parsedCons.length; k++) {
        const map = mapping[k];
        if (map.slack !== null) {
          const sign = parsedCons[k].sign;
          if (i === k) {
            row[map.slack] = (sign === '<=') ? 1 : -1;
          }
        }
        if (map.artificial !== null) {
          if (i === k) row[map.artificial] = 1;
        }
      }
      row[row.length - 1] = parsedCons[i].rhs;
      tableau.push(row);
    }

    steps.push("Tableau initial (sans Z):");
    steps.push(formatTableau(tableau, varNames));

    // ---------------- PHASE 1 ----------------
    if (artificialCols.length > 0) {
      steps.push("=== PHASE 1: chercher une base réalisable (min sum artificielles) ===");

      // construire ligne phase1 comme - sum(lignes de base artificielles)
      const phase1Row = new Array(totalCols).fill(0);
      artificialCols.forEach(colIdx => {
        for (let r = 0; r < tableau.length; r++) {
          if (Math.abs(tableau[r][colIdx] - 1) < EPS) {
            for (let j = 0; j < totalCols; j++) phase1Row[j] += tableau[r][j];
            break;
          }
        }
      });
      for (let j = 0; j < phase1Row.length; j++) phase1Row[j] = -phase1Row[j];

      tableau.push(phase1Row);
      steps.push("Tableau Phase 1 initial:");
      steps.push(formatTableau(tableau, varNames));

      try {
        simplexIteration(tableau, true, steps, varNames);
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes('non born')) {
          return { status: 'unbounded', message: 'Phase 1 non bornée', steps };
        }
        throw err;
      }

      steps.push("Tableau après Phase 1:");
      steps.push(formatTableau(tableau, varNames));

      // vérifier faisabilité : la valeur de la fonction objectif phase1 (RHS) doit être ~ 0
      const zPhase1 = tableau[tableau.length - 1][tableau[0].length - 1];
      if (Math.abs(zPhase1) > 1e-6) {
        steps.push(`Valeur Phase 1 = ${zPhase1.toFixed(9)} => problème infaisable`);
        return { status: 'infeasible', message: 'Problème infaisable (Phase 1 > 0)', steps };
      }

      // tenter retirer artificielles basiques en pivotant si possible
      const artColsSorted = artificialCols.slice().sort((a,b) => b-a); // desc
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

      // supprimer la ligne phase1 (la dernière ligne)
      tableau.pop();

      // supprimer colonnes artificielles (garder la RHS)
      const keepCols = [];
      for (let c = 0; c < tableau[0].length; c++) {
        if (!artificialCols.includes(c) || c === tableau[0].length - 1) keepCols.push(c);
      }
      const newTableau = [];
      const newVarNames = [];
      for (let r = 0; r < tableau.length; r++) {
        const newRow = keepCols.map(ci => tableau[r][ci]);
        newTableau.push(newRow);
      }
      keepCols.forEach(ci => {
        if (ci < varNames.length) newVarNames.push(varNames[ci]);
      });

      tableau = newTableau;
      // rewrite varNames cleanly
      for (let i = 0; i < newVarNames.length; i++) { varNames[i] = newVarNames[i]; }
      varNames.length = newVarNames.length;

      steps.push("Tableau après suppression des artificielles:");
      steps.push(formatTableau(tableau, varNames));
    } // fin if artificial

    // ---------------- PHASE 2 ----------------
    steps.push("=== PHASE 2: optimisation de l'objectif réel ===");

    // construire ligne Z selon isMax (ici isMax est true, on a éventuellement converti un min->max)
    const numColsNow = tableau[0].length;
    const zRow = new Array(numColsNow).fill(0);
    for (let j = 0; j < numOriginal; j++) {
      zRow[j] = isMax ? -objCoeffs[j] : objCoeffs[j];
    }
    tableau.push(zRow);

    // éliminer contributions des variables basiques sur la ligne Z
    eliminateBasicVarsFromObjective(tableau, varNames);

    steps.push("Tableau initial Phase 2 (avec Z):");
    steps.push(formatTableau(tableau, varNames));

    // exécuter simplex final
    try {
      simplexIteration(tableau, isMax, steps, varNames);
    } catch (err) {
      if (err.message && err.message.toLowerCase().includes('non born')) {
        return { status: 'unbounded', message: 'Solution non bornée (Phase 2)', steps };
      }
      throw err;
    }

    steps.push("Tableau final Phase 2:");
    steps.push(formatTableau(tableau, varNames));

    // extraire solution pour x1..xN
    const solution = {};
    for (let i = 0; i < numOriginal; i++) solution[`x${i+1}`] = 0;
    for (let col = 0; col < numOriginal; col++) {
      let oneRow = -1;
      let oneCount = 0;
      for (let r = 0; r < tableau.length - 1; r++) {
        if (Math.abs(tableau[r][col] - 1) < EPS) { oneCount++; oneRow = r; }
        else if (Math.abs(tableau[r][col]) > EPS) { oneCount = -1; break; }
      }
      if (oneCount === 1 && oneRow !== -1) {
        solution[`x${col+1}`] = Math.max(0, tableau[oneRow][tableau[0].length - 1]);
      } else {
        solution[`x${col+1}`] = 0;
      }
    }

    // calculer Z à partir des coefficients originaux (avant conversion min->max)
    let zCalc = 0;
    for (let i = 0; i < numOriginal; i++) zCalc += (origObjCoeffs[i] || 0) * (solution[`x${i+1}`] || 0);

    steps.push("Solution extraite:");
    Object.keys(solution).forEach(k => steps.push(`${k} = ${solution[k].toFixed(6)}`));
    steps.push(`Z = ${zCalc.toFixed(6)}`);

    return {
      status: 'optimal',
      solution,
      z: zCalc,
      tableau,
      varNames,
      message: 'Solution optimale trouvée',
      steps
    };

  } catch (error) {
    steps.push(`Erreur: ${error.message}`);
    return { status: 'error', message: error.message, steps };
  }
}


// ------------------ FONCTIONS UTILITAIRES --------------------

function eliminateBasicVarsFromObjective(tableau, varNames) {
  const zRowIndex = tableau.length - 1;
  const numCols = tableau[0].length;
  for (let col = 0; col < Math.min(varNames.length, numCols - 1); col++) {
    let basicRow = -1;
    let oneFound = false;
    let isBasic = true;
    for (let r = 0; r < tableau.length - 1; r++) {
      const v = tableau[r][col];
      if (Math.abs(v - 1) < EPS && !oneFound) { basicRow = r; oneFound = true; }
      else if (Math.abs(v) > EPS) { isBasic = false; break; }
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

function simplexIteration(tableau, isMax, steps = [], varNames = []) {
  const maxIter = 1000;
  let iter = 0;
  while (iter++ < maxIter) {
    const zRowIdx = tableau.length - 1;
    const zRow = tableau[zRowIdx];
    // choisir colonne entrante
    let pivotCol = -1;
    if (isMax) {
      let minVal = 0;
      for (let j = 0; j < zRow.length - 1; j++) {
        if (zRow[j] < minVal - EPS) { minVal = zRow[j]; pivotCol = j; }
      }
      if (pivotCol === -1) {
        steps.push(`Optimalité atteinte (itérations=${iter-1})`);
        break;
      }
    } else {
      let maxVal = 0;
      for (let j = 0; j < zRow.length - 1; j++) {
        if (zRow[j] > maxVal + EPS) { maxVal = zRow[j]; pivotCol = j; }
      }
      if (pivotCol === -1) {
        steps.push(`Optimalité atteinte (itérations=${iter-1})`);
        break;
      }
    }

    steps.push(`Itération ${iter}: variable entrante = ${varNames[pivotCol] || 'col'+pivotCol}`);

    // ratio test
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
    if (pivotRow === -1) throw new Error("Solution non bornée");

    steps.push(`Pivot ligne ${pivotRow}, ratio = ${minRatio.toFixed(6)}`);

    // pivot
    performPivot(tableau, pivotRow, pivotCol);
    steps.push("Tableau après pivot:");
    steps.push(formatTableau(tableau, varNames));
  }

  if (iter >= maxIter) throw new Error("Nombre maximum d'itérations atteint");
}

function performPivot(tableau, pivotRow, pivotCol) {
  const pivot = tableau[pivotRow][pivotCol];
  if (Math.abs(pivot) < EPS) throw new Error("Pivot trop petit");
  // diviser ligne pivot
  for (let j = 0; j < tableau[pivotRow].length; j++) tableau[pivotRow][j] /= pivot;
  // éliminer dans les autres lignes
  for (let r = 0; r < tableau.length; r++) {
    if (r === pivotRow) continue;
    const factor = tableau[r][pivotCol];
    if (Math.abs(factor) > EPS) {
      for (let j = 0; j < tableau[r].length; j++) tableau[r][j] -= factor * tableau[pivotRow][j];
    }
  }
}

function formatTableau(tableau, varNames = []) {
  if (!tableau || tableau.length === 0) return "";
  const ncols = tableau[0].length;
  const cols = [];
  for (let i = 0; i < ncols - 1; i++) cols.push(varNames[i] || `c${i}`);
  cols.push('RHS');
  const header = cols.join('\t');
  const lines = tableau.map(row => row.map(v => v.toFixed(6)).join('\t'));
  return header + '\n' + lines.join('\n');
}


// ------------------ TEST SIMPLEX ------------------
export function testSimplex() {
  console.log("=== Tests Simplexe ===");

  const tests = [
    {
      name: "Max classique (3x1+5x2)",
      problem: {
        objective: "max: 3x1 + 5x2",
        constraints: ["x1 + 2x2 <= 6", "3x1 + 2x2 <= 12"]
      },
      expect: null
    },
    {
      name: "Min avec >=",
      problem: {
        objective: "min: 4x1 + 3x2",
        constraints: ["2x1 + x2 >= 4", "x1 + 2x2 >= 6"]
      }
    },
    {
      name: "Ton problème originel (max 420..)",
      problem: {
        objective: "max: 420x1 + 510x2 + 360x3",
        constraints: [
          "x1 + x2 + x3 <= 40",
          "1500x1 + 1800x2 + 1050x3 <= 63000",
          "18x1 + 27x2 + 15x3 <= 840"
        ]
      }
    }
  ];

  tests.forEach(t => {
    console.log(`\n--- ${t.name} ---`);
    const res = solveSimplex(t.problem);
    console.log("Status:", res.status);
    console.log("Z:", res.z);
    console.log("Solution:", res.solution);
    // console.log(res.steps.join('\n'));
  });

  return true;
}
