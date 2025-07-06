// src/simplex/simplexSolver.js

function parseExpression(expr) {
  const vars = expr.replace(/\s+/g, '').match(/([+-]?\d*\.?\d*)x\d+/g);
  return vars.map(v => {
    const coef = v.match(/([+-]?\d*\.?\d*)x\d+/)[1];
    return coef === '' || coef === '+' ? 1 : coef === '-' ? -1 : parseFloat(coef);
  });
}

function parseConstraints(constraints) {
  return constraints.map(c => {
    const [lhs, rhs] = c.split(/<=|>=|=/);
    const sign = c.includes('<=') ? '<=' : c.includes('>=') ? '>=' : '=';
    return {
      coefficients: parseExpression(lhs),
      rhs: parseFloat(rhs.trim()),
      sign,
    };
  });
}

function toCanonicalForm(parsedConstraints) {
  const tableau = [];

  parsedConstraints.forEach((con, idx) => {
    const row = [...con.coefficients];
    const slackVars = Array(parsedConstraints.length).fill(0);
    if (con.sign === '<=') slackVars[idx] = 1;
    else if (con.sign === '>=') slackVars[idx] = -1;
    row.push(...slackVars);
    row.push(con.rhs);
    tableau.push(row);
  });

  return tableau;
}

function objectiveRow(objCoeffs, slackCount, isMaximization) {
  const row = objCoeffs.map(c => (isMaximization ? -c : c));
  for (let i = 0; i < slackCount; i++) row.push(0);
  row.push(0); // valeur Z
  return row;
}

export function solveSimplex({ objective, constraints }) {
  const steps = [];
  const isMaximization = objective.toLowerCase().includes('max');
  const objectiveExpr = objective.replace(/max|min|:/gi, '');
  const objCoeffs = parseExpression(objectiveExpr);
  const parsedConstraints = parseConstraints(constraints);

  const slackCount = parsedConstraints.length;
  let tableau = toCanonicalForm(parsedConstraints, isMaximization);
  const zRow = objectiveRow(objCoeffs, slackCount, isMaximization);
  tableau.push(zRow);

  // Affichage forme canonique + forme matricielle
  steps.push("Forme canonique:\n" + tableau.map(r => r.join("\t")).join("\n"));

  const matrixA = tableau.slice(0, -1).map(row => row.slice(0, objCoeffs.length + slackCount));
  const matrixB = tableau.slice(0, -1).map(row => row[row.length - 1]);

  const exprZ = objCoeffs.map((c, i) => `${c}x${i + 1}`).join(' + ');
  const matrixString = matrixA.map(row => '[' + row.join('\t') + ']').join('\n');

  steps.push("\nReprésentation matricielle:\n" +
    `Z = ${exprZ} + 0x${objCoeffs.length + 1} + ... + 0x${objCoeffs.length + slackCount}\n` +
    `[A] =\n${matrixString}\n` +
    `[B] = [${matrixB.join(', ')}]`);

  let iter = 0;
  while (true) {
    iter++;
    const z = tableau[tableau.length - 1];
    const pivotColIndex = z.slice(0, -1).findIndex(v => v < 0);
    if (pivotColIndex === -1) break;

    let minRatio = Infinity;
    let pivotRowIndex = -1;
    for (let i = 0; i < tableau.length - 1; i++) {
      const row = tableau[i];
      if (row[pivotColIndex] > 0) {
        const ratio = row[row.length - 1] / row[pivotColIndex];
        if (ratio < minRatio) {
          minRatio = ratio;
          pivotRowIndex = i;
        }
      }
    }

    if (pivotRowIndex === -1) {
      steps.push("Solution non bornée.");
      break;
    }

    const pivot = tableau[pivotRowIndex][pivotColIndex];
    tableau[pivotRowIndex] = tableau[pivotRowIndex].map(v => v / pivot);
    for (let i = 0; i < tableau.length; i++) {
      if (i !== pivotRowIndex) {
        const factor = tableau[i][pivotColIndex];
        tableau[i] = tableau[i].map((v, j) => v - factor * tableau[pivotRowIndex][j]);
      }
    }

    steps.push(`\nItération ${iter} (pivot ligne ${pivotRowIndex + 1}, colonne ${pivotColIndex + 1})\n` + tableau.map(r => r.join("\t")).join("\n"));
  }

  const solution = [];
  const varCount = objCoeffs.length;
  for (let j = 0; j < varCount; j++) {
    let oneRow = -1;
    let isBasic = true;
    for (let i = 0; i < tableau.length - 1; i++) {
      if (tableau[i][j] === 1) {
        if (oneRow === -1) oneRow = i;
        else {
          isBasic = false;
          break;
        }
      } else if (tableau[i][j] !== 0) {
        isBasic = false;
        break;
      }
    }
    solution.push(isBasic && oneRow !== -1 ? tableau[oneRow][tableau[0].length - 1] : 0);
  }

  const zFinal = tableau[tableau.length - 1][tableau[0].length - 1];
  const verification = solution.map((v, i) => `${objCoeffs[i]}*${v.toFixed(2)}`).join(' + ');
  steps.push("\nRésultat :\n" +
    solution.map((v, i) => `x${i + 1} = ${v.toFixed(2)}`).join("\n") +
    `\nZ = ${zFinal.toFixed(2)}` +
    `\n\nVérification : Z = ${verification} = ${zFinal.toFixed(2)}`);

  return { steps, tableau, rhs: matrixB };
}
