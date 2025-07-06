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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSolve({ objective, constraints });
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white border rounded shadow-sm mb-4">
      <h5 className="mb-3 text-primary fw-bold">Entrée du problème</h5>
      <div className="mb-3">
        <label className="form-label">Fonction Objectif</label>
        <input
          type="text"
          className="form-control"
          placeholder="MAX: 3x1 + 5x2"
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
        />
      </div>
      {constraints.map((c, i) => (
        <div key={i} className="mb-2">
          <label className="form-label">Contrainte {i + 1}</label>
          <input
            className="form-control"
            placeholder="Ex: 2x1 + 3x2 <= 8"
            value={c}
            onChange={(e) => handleChange(i, e.target.value)}
          />
        </div>
      ))}
      <div className="d-flex gap-2 mt-3">
        <button type="button" onClick={handleAddConstraint} className="btn btn-outline-secondary btn-sm">
          + Ajouter contrainte
        </button>
        <button type="submit" className="btn btn-success btn-sm">Résoudre</button>
      </div>
    </form>
  );
};

export default ProblemInput;
