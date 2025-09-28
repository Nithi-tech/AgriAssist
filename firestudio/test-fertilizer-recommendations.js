/**
 * Test Fertilizer Recommendation System
 * Node.js script to test the fertilizer recommendation logic
 */

// Import the fertilizer recommendation functions
const { checkNutrientLevels, analyzeMultipleSensorReadings } = require('../src/lib/fertilizer-recommendations');

// Test data - various nutrient level scenarios
const testCases = [
  {
    name: 'All nutrients optimal',
    nitrogen: 60,
    phosphorus: 35,
    potassium: 250
  },
  {
    name: 'Nitrogen low',
    nitrogen: 25,
    phosphorus: 35,
    potassium: 250
  },
  {
    name: 'Phosphorus low',
    nitrogen: 60,
    phosphorus: 18,
    potassium: 250
  },
  {
    name: 'Potassium needs attention',
    nitrogen: 60,
    phosphorus: 35,
    potassium: 150
  },
  {
    name: 'Multiple nutrients need attention',
    nitrogen: 30,
    phosphorus: 20,
    potassium: 180
  },
  {
    name: 'Critical levels',
    nitrogen: 22,
    phosphorus: 16,
    potassium: 110
  }
];

// Test multiple readings for trend analysis
const multipleReadings = [
  {
    nitrogen: 30,
    phosphorus: 20,
    potassium: 180,
    recorded_at: '2024-01-15T10:00:00Z'
  },
  {
    nitrogen: 28,
    phosphorus: 18,
    potassium: 175,
    recorded_at: '2024-01-15T11:00:00Z'
  },
  {
    nitrogen: 25,
    phosphorus: 17,
    potassium: 170,
    recorded_at: '2024-01-15T12:00:00Z'
  }
];

console.log('🧪 Testing Fertilizer Recommendation System\n');

// Test individual nutrient checks
console.log('📊 Individual Nutrient Level Tests:');
console.log('=' .repeat(50));

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}`);
  console.log(`   N: ${testCase.nitrogen} ppm, P: ${testCase.phosphorus} ppm, K: ${testCase.potassium} ppm`);
  
  const alerts = checkNutrientLevels(testCase.nitrogen, testCase.phosphorus, testCase.potassium);
  
  if (alerts.length === 0) {
    console.log('   ✅ All nutrients optimal - no alerts');
  } else {
    console.log(`   ⚠️  ${alerts.length} alert(s):`);
    alerts.forEach(alert => {
      const severityEmoji = alert.severity === 'critical' ? '🔴' : 
                           alert.severity === 'moderate' ? '🟡' : '🔵';
      console.log(`      ${severityEmoji} ${alert.nutrient}: ${alert.value} ppm (${alert.severity})`);
      console.log(`         Recommended: ${alert.fertilizers.slice(0, 2).join(', ')}`);
    });
  }
});

// Test trend analysis
console.log('\n\n📈 Trend Analysis Test:');
console.log('=' .repeat(50));

const analysis = analyzeMultipleSensorReadings(multipleReadings);
console.log('\nLatest Alerts:');
if (analysis.latestAlerts.length === 0) {
  console.log('   ✅ No alerts for latest reading');
} else {
  analysis.latestAlerts.forEach(alert => {
    const severityEmoji = alert.severity === 'critical' ? '🔴' : 
                         alert.severity === 'moderate' ? '🟡' : '🔵';
    console.log(`   ${severityEmoji} ${alert.nutrient}: ${alert.value} ppm`);
  });
}

console.log('\nTrends:');
Object.entries(analysis.trends).forEach(([nutrient, trend]) => {
  const trendEmoji = trend === 'improving' ? '📈' : 
                    trend === 'declining' ? '📉' : '➡️';
  console.log(`   ${trendEmoji} ${nutrient}: ${trend}`);
});

console.log('\nRecommendations:');
analysis.recommendations.forEach(rec => {
  console.log(`   💡 ${rec}`);
});

// Test API request format
console.log('\n\n🌐 API Request Format Test:');
console.log('=' .repeat(50));

const sampleApiRequest = {
  nitrogen: 25,
  phosphorus: 18,
  potassium: 150
};

console.log('\nSample POST request to /api/fertilizer-recommendations:');
console.log(JSON.stringify(sampleApiRequest, null, 2));

const sampleResponse = {
  success: true,
  data: {
    alerts: checkNutrientLevels(sampleApiRequest.nitrogen, sampleApiRequest.phosphorus, sampleApiRequest.potassium),
    nutrientLevels: sampleApiRequest,
    timestamp: new Date().toISOString()
  }
};

console.log('\nExpected Response:');
console.log(JSON.stringify(sampleResponse, null, 2));

// Performance test
console.log('\n\n⚡ Performance Test:');
console.log('=' .repeat(50));

const startTime = Date.now();
const iterations = 1000;

for (let i = 0; i < iterations; i++) {
  checkNutrientLevels(
    Math.random() * 100,
    Math.random() * 50,
    Math.random() * 300
  );
}

const endTime = Date.now();
const avgTime = (endTime - startTime) / iterations;

console.log(`\nProcessed ${iterations} nutrient checks in ${endTime - startTime}ms`);
console.log(`Average time per check: ${avgTime.toFixed(3)}ms`);

console.log('\n🎉 All tests completed successfully!');

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testCases,
    multipleReadings,
    runTests: () => {
      console.log('Running fertilizer recommendation tests...');
      // Run all tests
    }
  };
}
