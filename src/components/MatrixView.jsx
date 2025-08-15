import React from 'react';

// MatrixViewer amélioré
const MatrixView = ({ A, B, title }) => {
  if (!A || !B || A.length === 0) return null;

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
          {title}
        </h3>
      )}

      <div className="flex flex-col xl:flex-row items-start justify-center gap-6">
        {/* Matrice A */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 w-full xl:w-auto">
          <h4 className="text-lg font-semibold text-gray-700 text-center mb-4">
            Matrice A
          </h4>
          <div className="overflow-x-auto">
            <table className="mx-auto">
              <tbody>
                {A.map((row, i) => (
                  <tr key={i}>
                    {row.map((val, j) => (
                      <td key={j} className="px-4 py-3 text-center border border-gray-300 bg-gray-50 min-w-[60px] text-gray-900 font-medium">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vecteur B */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 w-full xl:w-auto">
          <h4 className="text-lg font-semibold text-gray-700 text-center mb-4">
            Vecteur B
          </h4>
          <div className="overflow-x-auto">
            <table className="mx-auto">
              <tbody>
                {B.map((val, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-center border border-gray-300 bg-gray-50 min-w-[60px] text-gray-900 font-medium">
                      {val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatrixView;