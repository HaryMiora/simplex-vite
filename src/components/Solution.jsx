import React from 'react';

const Solution = ({ values, z }) => (
  <div className="alert alert-success mt-4">
    <h5 className="fw-bold">Solution optimale :</h5>
    <ul className="mb-2">
      {values.map((val, idx) => (
        <li key={idx}>
          x<sub>{idx + 1}</sub> = {val.toFixed(2)}
        </li>
      ))}
    </ul>
    <p className="fw-semibold">Z = {z.toFixed(2)}</p>
  </div>
);

export default Solution;
