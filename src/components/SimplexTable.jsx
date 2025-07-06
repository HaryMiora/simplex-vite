import React from 'react';

const SimplexTable = ({ matrix, title }) => {
  if (!matrix || matrix.length === 0) return null;

  return (
    <div className="my-4">
      {title && <h5 className="text-center fw-bold text-primary mb-3">{title}</h5>}
      <table className="table table-bordered text-center table-sm align-middle">
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="bg-white">
                  {typeof cell === 'number' ? cell.toFixed(2) : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SimplexTable;
