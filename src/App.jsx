import React, { useState } from 'react';
import ProblemInput from './components/ProblemInput';
import SimplexTable from './components/SimplexTable';
import Solution from './components/Solution';
import MatrixView from './components/MatrixView';
// Import depuis la nouvelle structure modulaire
import { solveSimplex } from './simplex/index';

function App() {
  const [result, setResult] = useState(null);
  const [rawSteps, setRawSteps] = useState([]);
  const [solutionValues, setSolutionValues] = useState([]);
  const [zValue, setZValue] = useState(null);
  const [status, setStatus] = useState(null);

  const handleSolve = (problem) => {
    try {
      // Utilisation du solveur modulaire
      const solverResult = solveSimplex(problem);
      
      // Stocker le résultat complet
      setResult(solverResult);
      setStatus(solverResult.status);
      setRawSteps(solverResult.steps || []);

      // Traitement selon le statut
      if (solverResult.status === 'optimal') {
        // Extraction des valeurs des variables depuis l'objet solution
        const solution = solverResult.solution || {};
        const numVars = Object.keys(solution).length;
        const vars = Array(numVars).fill(0).map((_, i) => {
          const varName = `x${i + 1}`;
          return solution[varName] || 0;
        });

        setSolutionValues(vars);
        setZValue(solverResult.z || 0);
      } else {
        // Pour les cas non optimaux, réinitialiser
        setSolutionValues([]);
        setZValue(null);
      }

    } catch (error) {
      console.error('Erreur lors de la résolution:', error);
      setResult({
        status: 'error',
        message: error.message,
        steps: [`Erreur: ${error.message}`]
      });
      setStatus('error');
      setRawSteps([`Erreur: ${error.message}`]);
      setSolutionValues([]);
      setZValue(null);
    }
  };

  const renderStatusBadge = () => {
    if (!status) return null;

    const statusConfig = {
      optimal: { class: 'success', text: 'Solution Optimale' },
      infeasible: { class: 'danger', text: 'Problème Infaisable' },
      unbounded: { class: 'warning', text: 'Solution Non Bornée' },
      invalid: { class: 'secondary', text: 'Données Invalides' },
      error: { class: 'danger', text: 'Erreur' }
    };

    const config = statusConfig[status] || { class: 'secondary', text: status };

    return (
      <div className={`alert alert-${config.class} mb-3`}>
        <strong>Statut: </strong>{config.text}
        {result?.message && <div className="mt-2"><em>{result.message}</em></div>}
      </div>
    );
  };

  const renderSteps = () => {
    if (!rawSteps.length) return null;

    return rawSteps.map((step, i) => {
      // Détection des tableaux (contiennent des tabulations)
      if (step.includes('\t')) {
        const lines = step.split('\n');
        const title = lines[0];
        const tableLines = lines.slice(1).filter(line => line.trim());
        
        if (tableLines.length > 0) {
          try {
            // Parser le tableau
            const headers = tableLines[0].split('\t');
            const matrix = tableLines.slice(1).map(line => 
              line.split('\t').map(val => {
                const num = parseFloat(val);
                return isNaN(num) ? val : num;
              })
            );
            
            return (
              <SimplexTable 
                key={i} 
                matrix={matrix} 
                headers={headers}
                title={title} 
              />
            );
          } catch {
            // Si parsing échoue, afficher comme texte
            return (
              <div key={i} className="alert alert-secondary">
                <pre className="m-0">{step}</pre>
              </div>
            );
          }
        }
      }
      
      // Étapes textuelles normales
      return (
        <div key={i} className="alert alert-info">
          <pre className="m-0 text-wrap">{step}</pre>
        </div>
      );
    });
  };

  return (
    <div className="container py-4">
      <h1 className="text-center text-primary mb-4">
        <i className="fas fa-calculator me-2"></i>
        Algorithme du Simplexe
      </h1>
      
      <div className="row">
        <div className="col-12">
          <ProblemInput onSolve={handleSolve} />
        </div>
      </div>

      {/* Affichage du statut */}
      {status && (
        <div className="row mt-4">
          <div className="col-12">
            {renderStatusBadge()}
          </div>
        </div>
      )}

      {/* Affichage de la solution optimale */}
      {status === 'optimal' && solutionValues.length > 0 && zValue !== null && (
        <div className="row mt-3">
          <div className="col-12">
            <Solution values={solutionValues} z={zValue} />
          </div>
        </div>
      )}

      {/* Affichage des étapes détaillées */}
      {rawSteps.length > 0 && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="fas fa-list-ol me-2"></i>
                  Étapes détaillées de la résolution
                </h5>
              </div>
              <div className="card-body">
                {renderSteps()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tableau final (optionnel) */}
      {result?.tableau && status === 'optimal' && (
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-table me-2"></i>
                  Tableau final
                </h5>
              </div>
              <div className="card-body">
                <MatrixView 
                  matrix={result.tableau} 
                  varNames={result.varNames}
                  title="Tableau optimal"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Informations de debug (en développement) */}
      {import.meta.env.MODE === 'development' && result && (
        <div className="row mt-4">
          <div className="col-12">
            <details className="border rounded p-3">
              <summary className="text-muted mb-2">
                <small>Informations de debug (développement)</small>
              </summary>
              <pre className="text-muted small">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;