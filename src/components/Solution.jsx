import React from 'react';

const Solution = ({ values, z }) => (
  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-300 p-6 mt-8">
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-800">Solution optimale</h3>
    </div>
    
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      <div className="bg-white rounded-lg p-4 border border-gray-300">
        <h4 className="font-semibold text-gray-700 mb-3">Variables</h4>
        <div className="space-y-2">
          {values.map((val, idx) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-gray-600 font-medium">
                x<sub>{idx + 1}</sub>
              </span>
              <span className="text-gray-900 font-semibold">
                {val.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white rounded-lg p-4 border border-gray-300">
        <h4 className="font-semibold text-gray-700 mb-3">Valeur optimale</h4>
        <div className="text-2xl font-bold text-gray-800">
          Z = {z.toFixed(2)}
        </div>
      </div>
    </div>
  </div>
);

export default Solution;
