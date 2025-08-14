// src/simplex/test.js
// Suite de tests pour le solveur Simplex

import { solveSimplex } from './solver.js';

/**
 * Exécute la suite de tests du solveur Simplex
 * @returns {boolean} - True si tous les tests passent
 */
export function testSimplex() {
  console.log("=== Tests Simplexe ===");

  const tests = [
    {
      name: "Max classique (3x1+5x2)",
      problem: {
        objective: "max: 3x1 + 5x2",
        constraints: ["x1 + 2x2 <= 6", "3x1 + 2x2 <= 12"]
      },
      expected: {
        status: 'optimal',
        // On peut ajouter les valeurs attendues si besoin
      }
    },
    {
      name: "Min avec contraintes >=",
      problem: {
        objective: "min: 4x1 + 3x2",
        constraints: ["2x1 + x2 >= 4", "x1 + 2x2 >= 6"]
      },
      expected: {
        status: 'optimal'
      }
    },
    {
      name: "Problème mixte avec égalités",
      problem: {
        objective: "max: 2x1 + 3x2",
        constraints: [
          "x1 + x2 = 5",
          "2x1 + x2 <= 8",
          "x1 + 2x2 >= 6"
        ]
      },
      expected: {
        status: 'optimal'
      }
    },
    {
      name: "Problème complexe (420x1 + 510x2 + 360x3)",
      problem: {
        objective: "max: 420x1 + 510x2 + 360x3",
        constraints: [
          "x1 + x2 + x3 <= 40",
          "1500x1 + 1800x2 + 1050x3 <= 63000",
          "18x1 + 27x2 + 15x3 <= 840"
        ]
      },
      expected: {
        status: 'optimal'
      }
    },
    {
      name: "Problème infaisable",
      problem: {
        objective: "max: x1 + x2",
        constraints: [
          "x1 + x2 >= 10",
          "x1 + x2 <= 5"
        ]
      },
      expected: {
        status: 'infeasible'
      }
    }
  ];

  let allTestsPassed = true;

  tests.forEach((test, index) => {
    console.log(`\n--- Test ${index + 1}: ${test.name} ---`);
    
    try {
      const result = solveSimplex(test.problem);
      
      console.log(`Status: ${result.status}`);
      
      if (result.status === 'optimal') {
        console.log(`Z: ${result.z}`);
        console.log("Solution:", result.solution);
      }
      
      // Vérification basique du statut attendu
      if (test.expected && test.expected.status !== result.status) {
        console.log(`❌ ÉCHEC: Statut attendu ${test.expected.status}, obtenu ${result.status}`);
        allTestsPassed = false;
      } else {
        console.log("✅ Test réussi");
      }
      
      // Optionnel: afficher quelques étapes pour debug
      if (result.steps && result.steps.length > 0) {
        console.log("Premières étapes:");
        result.steps.slice(0, 5).forEach(step => console.log(`  ${step}`));
        if (result.steps.length > 5) {
          console.log(`  ... (${result.steps.length - 5} étapes supplémentaires)`);
        }
      }
      
    } catch (error) {
      console.log(`❌ ERREUR: ${error.message}`);
      allTestsPassed = false;
    }
  });

  console.log(`\n=== Résultat des tests ===`);
  console.log(`${allTestsPassed ? '✅ Tous les tests ont réussi' : '❌ Certains tests ont échoué'}`);
  
  return allTestsPassed;
}

/**
 * Test rapide pour vérification de base
 * @returns {Object} - Résultat d'un test simple
 */
export function quickTest() {
  return solveSimplex({
    objective: "max: 3x1 + 5x2",
    constraints: ["x1 + 2x2 <= 6", "3x1 + 2x2 <= 12"]
  });
}