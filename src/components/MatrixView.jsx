import React from 'react';

const MatrixView = ({ A, B, title }) => {
  if (!A || !B || A.length === 0) return null;

  return (
    <div className="my-5">
      {title && <h5 className="text-primary text-center mb-3 fw-bold">{title}</h5>}

      <div className="d-flex flex-wrap justify-content-center gap-4">
        <div>
          <p className="text-center mb-1 fw-semibold">Matrice A</p>
          <table className="table table-bordered table-sm text-center">
            <tbody>
              {A.map((row, i) => (
                <tr key={i}>
                  {row.map((val, j) => (
                    <td key={j}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="text-center mb-1 fw-semibold">Vecteur B</p>
          <table className="table table-bordered table-sm text-center">
            <tbody>
              {B.map((val, i) => (
                <tr key={i}>
                  <td>{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MatrixView;
