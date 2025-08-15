import React, { useState } from 'react';
import ProblemInput from './components/ProblemInput';
import SimplexTable from './components/SimplexTable';
import Solution from './components/Solution';
import MatrixView from './components/MatrixView';
import { solveSimplex } from './simplex/solver'; // Assurez-vous que le chemin est correct
// Import depuis la nouvelle structure modulaire

const App = () => {
  const [problem, setProblem] = useState(null);
  const [results, setResults] = useState(null);
  // const [isCalculating, setIsCalculating] = useState(false);

  // Fonction pour analyser l'entrée utilisateur et extraire les matrices
  const parseInput = (problemData) => {
    try {
      // Ici vous devez implémenter votre logique de parsing
      // Exemple basique pour comprendre le format
      const { constraints: _constraints } = problemData;
      
      // Parser la fonction objectif (ex: "MAX: 3x1 + 5x2")
      // Parser les contraintes (ex: ["2x1 + 3x2 <= 8", "x1 + 2x2 <= 6"])
      
      // Retourner les matrices parsées
      return {
        A: [], // Matrice des coefficients
        B: [], // Vecteur des constantes
        C: [], // Coefficients de la fonction objectif
        isMaximization: true
      };
    } catch (error) {
      console.error('Erreur de parsing:', error);
      return null;
    }
  };

  // Votre algorithme du simplex
  // (Utilisez la fonction importée solveSimplex depuis './simplex/solver')

  const handleSolve = (problemData) => {
    setProblem(problemData);
    
    // Parser l'entrée
    const parsed = parseInput(problemData);
    if (!parsed) {
      alert('Erreur dans le format du problème');
      return;
    }
    
    // Résoudre avec votre algorithme
    const result = solveSimplex(parsed.A, parsed.B, parsed.C, parsed.isMaximization);
    setResults(result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Solveur Simplex
          </h1>
          <p className="text-gray-600 text-lg">
            Interface moderne pour la résolution de problèmes d'optimisation linéaire
          </p>
        </header>

        <ProblemInput onSolve={handleSolve} />
        
        {/* Indicateur de calcul */}
        {/* {isCalculating && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-center">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
              <span className="text-blue-700 font-medium">Calcul en cours...</span>
            </div>
          </div>
        )} */}
        
        {/* Affichage du problème saisi */}
        {problem && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Problème saisi :</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-800"><strong>Objectif :</strong> {problem.objective}</p>
              <div className="mt-2">
                <strong className="text-gray-800">Contraintes :</strong>
                <ul className="mt-1 space-y-1">
                  {problem.constraints.map((constraint, i) => (
                    <li key={i} className="text-gray-700">• {constraint}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Affichage des résultats calculés */}
        {results && results.success && (
          <>
            {/* Matrices du système original */}
            <MatrixView 
              A={results.solution.matrices.A} 
              B={results.solution.matrices.B} 
              title="Matrices du système"
            />
            
            {/* Tableau(x) du Simplex - Itérations */}
            {results.solution.iterations && results.solution.iterations.map((table, index) => (
              <SimplexTable 
                key={index}
                matrix={table} 
                title={`Table du Simplex - Itération ${index + 1}`}
              />
            ))}
            
            {/* Tableau final */}
            {results.solution.finalTable && (
              <SimplexTable 
                matrix={results.solution.finalTable} 
                title="Tableau Final du Simplex"
              />
            )}
            
            {/* Solution optimale */}
            <Solution 
              values={results.solution.variables} 
              z={results.solution.objectiveValue}
            />
          </>
        )}

        {/* Gestion des erreurs */}
        {results && !results.success && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-red-800 mb-2">Erreur de calcul</h3>
            <p className="text-red-700">{results.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;