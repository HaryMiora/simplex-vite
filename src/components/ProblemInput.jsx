import React, { useState } from 'react';

const ProblemInput = ({ onSolve }) => {
  const [objective, setObjective] = useState('');
  const [constraints, setConstraints] = useState(['']);

  const handleAddConstraint = () => setConstraints([...constraints, '']);
  
  const handleChange = (i, value) => {
    const updated = [...constraints];
    updated[i] = value;
    setConstraints(updated);
  };

  const handleRemoveConstraint = (i) => {
    if (constraints.length > 1) {
      const updated = constraints.filter((_, index) => index !== i);
      setConstraints(updated);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSolve({ objective, constraints });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Entrée du problème
        </h2>
        <div className="w-16 h-1 bg-blue-500 rounded"></div>
      </div>

      <div className="space-y-6">
        {/* Fonction Objectif */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Fonction Objectif
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
            placeholder="MAX: 3x1 + 5x2"
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
          />
        </div>

        {/* Contraintes */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Contraintes</h3>
          <div className="space-y-3">
            {constraints.map((c, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Contrainte {i + 1}
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-400"
                    placeholder="Ex: 2x1 + 3x2 <= 8"
                    value={c}
                    onChange={(e) => handleChange(i, e.target.value)}
                  />
                </div>
                {constraints.length > 1 && (
                  <button
                    onClick={() => handleRemoveConstraint(i)}
                    className="mt-7 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Supprimer cette contrainte"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
          <button
            onClick={handleAddConstraint}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium border border-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter contrainte
          </button>
          
          <button
            onClick={handleSubmit}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
          >
            Résoudre le problème
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProblemInput;
