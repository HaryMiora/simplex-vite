import React, { useState } from 'react';
import ProblemInput from './components/ProblemInput';
import SimplexTable from './components/SimplexTable';
import Solution from './components/Solution';
import { solveSimplex } from './simplex/simplexSolver';
import MatrixView from './components/MatrixView';

function App() {
  const [rawSteps, setRawSteps] = useState([]);
  const [solutionValues, setSolutionValues] = useState([]);
  const [zValue, setZValue] = useState(null);

  const handleSolve = (problem) => {
    const { steps } = solveSimplex(problem);
    setRawSteps(steps);

    const lastStep = steps[steps.length - 1];
    const matchVars = [...lastStep.matchAll(/x(\\d+) = ([\\d.\\-]+)/g)];
    const vars = Array(matchVars.length).fill(0).map((_, i) => {
      const found = matchVars.find(m => parseInt(m[1]) === i + 1);
      return found ? parseFloat(found[2]) : 0;
    });

    const matchZ = lastStep.match(/Z = ([\\d.\\-]+)/);
    const z = matchZ ? parseFloat(matchZ[1]) : 0;

    setSolutionValues(vars);
    setZValue(z);
  };

  return (
    <div className="container py-4">
      <h1 className="text-center text-danger mb-4">Algorithme de Simplexe</h1>
      <ProblemInput onSolve={handleSolve} />
      {rawSteps.length > 0 && (
        <div className="mt-4">
          <h4 className="text-success mb-3">Étapes de la résolution :</h4>
          {rawSteps.map((step, i) => {
            if (step.includes('\\t')) {
              const [title, ...tableLines] = step.split('\\n');
              const matrix = tableLines.map(line => line.split('\\t').map(val => parseFloat(val)));
              return <SimplexTable key={i} matrix={matrix} title={title} />;
            } else {
              return (
                <div key={i} className="alert alert-secondary">
                  <pre className="m-0">{step}</pre>
                </div>
              );
            }
          })}
          {solutionValues.length > 0 && zValue !== null && (
            <Solution values={solutionValues} z={zValue} />
          )}
        </div>
      )}
    </div>
  );
}

export default App;
