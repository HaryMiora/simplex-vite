import React from 'react';

const SimplexTable = ({ matrix, title }) => {
  if (!matrix || matrix.length === 0) return null;

  return (
    <div className="my-8">
      {title && (
        <h3 className="text-2xl font-bold text-gray-800 text-center mb-6">
          {title}
        </h3>
      )}
      
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              {matrix.map((row, i) => (
                <tr key={i} className={i === 0 ? "bg-gray-100" : "hover:bg-gray-50"}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`px-4 py-3 text-center border border-gray-300 font-medium ${
                        i === 0 ? "bg-gray-200 text-gray-800 font-semibold" : "text-gray-900"
                      }`}
                    >
                      {typeof cell === 'number' ? cell.toFixed(2) : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SimplexTable;
