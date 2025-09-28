/**
 * Demo Script: Fertilizer Recommendations
 * Simple demo to show how to integrate the fertilizer recommendation system
 */

// This script demonstrates how to use the fertilizer recommendation components

console.log('🌱 Fertilizer Recommendation System Demo');
console.log('=========================================\n');

// 1. API Endpoint Usage
console.log('1. API Endpoint Usage:');
console.log('   GET /api/fertilizer-recommendations');
console.log('   Parameters:');
console.log('   - deviceId (optional): Filter by specific device');
console.log('   - cropId (optional): Filter by specific crop');
console.log('   - limit (optional): Number of readings to analyze');

console.log('\n   POST /api/fertilizer-recommendations');
console.log('   Body: { nitrogen: number, phosphorus: number, potassium: number }');

// 2. React Component Usage
console.log('\n2. React Component Usage:');

const componentExample = `
import FertilizerRecommendations from '@/components/FertilizerRecommendations';
import FertilizerAlertNotifications from '@/components/FertilizerAlertNotifications';

// Full recommendations component
<FertilizerRecommendations 
  deviceId="ESP32_001"
  cropId="1"
  pollInterval={30000}
  showTrends={true}
  showLatestReading={true}
/>

// Compact notification component for navbar
<FertilizerAlertNotifications
  deviceId="ESP32_001"
  pollInterval={60000}
  showCount={true}
/>
`;

console.log(componentExample);

// 3. Hook Usage
console.log('\n3. React Hook Usage:');

const hookExample = `
import { useFertilizerRecommendations, useManualNutrientCheck } from '@/hooks/useFertilizerRecommendations';

// Real-time monitoring hook
const {
  data,
  loading,
  error,
  hasAlerts,
  criticalAlerts,
  moderateAlerts,
  lowAlerts,
  refetch
} = useFertilizerRecommendations({
  deviceId: 'ESP32_001',
  pollInterval: 30000
});

// Manual nutrient checking hook
const { checkNutrients, loading, error } = useManualNutrientCheck();
const alerts = await checkNutrients(25, 18, 150);
`;

console.log(hookExample);

// 4. Direct Function Usage
console.log('\n4. Direct Function Usage:');

const functionExample = `
import { checkNutrientLevels, analyzeMultipleSensorReadings } from '@/lib/fertilizer-recommendations';

// Check specific nutrient levels
const alerts = checkNutrientLevels(25, 18, 150);

// Analyze multiple readings for trends
const analysis = analyzeMultipleSensorReadings([
  { nitrogen: 30, phosphorus: 20, potassium: 180, recorded_at: '2024-01-15T10:00:00Z' },
  { nitrogen: 28, phosphorus: 18, potassium: 175, recorded_at: '2024-01-15T11:00:00Z' }
]);
`;

console.log(functionExample);

// 5. Integration with existing components
console.log('\n5. Integration with Existing Components:');

const integrationExample = `
// Add to your main dashboard
import FertilizerRecommendations from '@/components/FertilizerRecommendations';

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* Existing components */}
      <RecentSensorData deviceId="ESP32_001" />
      
      {/* Add fertilizer recommendations */}
      <FertilizerRecommendations 
        deviceId="ESP32_001"
        pollInterval={30000}
      />
    </div>
  );
}

// Add notifications to navigation
import FertilizerAlertNotifications from '@/components/FertilizerAlertNotifications';

export default function Navbar() {
  return (
    <nav>
      <div className="nav-items">
        {/* Existing nav items */}
        <FertilizerAlertNotifications />
      </div>
    </nav>
  );
}
`;

console.log(integrationExample);

// 6. Customization options
console.log('\n6. Customization Options:');

const customizationExample = `
// Customize nutrient ranges (in fertilizer-recommendations.ts)
const CUSTOM_RANGES = {
  nitrogen: { min: 15, max: 45, fertilizers: ['Custom Urea Mix'] },
  phosphorus: { min: 12, max: 28, fertilizers: ['Custom Phosphate'] },
  potassium: { min: 80, max: 180, fertilizers: ['Custom Potash'] }
};

// Customize polling intervals
<FertilizerRecommendations pollInterval={15000} /> // 15 seconds
<FertilizerRecommendations pollInterval={300000} /> // 5 minutes

// Customize display options
<FertilizerRecommendations 
  showTrends={false}
  showLatestReading={false}
  className="custom-styling"
/>
`;

console.log(customizationExample);

// 7. Performance considerations
console.log('\n7. Performance Considerations:');
console.log('   - Default polling interval: 30 seconds for main component');
console.log('   - Notification component: 60 seconds (less frequent)');
console.log('   - API responses are lightweight (~2KB typical)');
console.log('   - Client-side caching prevents unnecessary re-renders');
console.log('   - SSR-safe with proper hydration handling');

// 8. Deployment checklist
console.log('\n8. Deployment Checklist:');
console.log('   ✅ API endpoint: /api/fertilizer-recommendations');
console.log('   ✅ React components: FertilizerRecommendations, FertilizerAlertNotifications');
console.log('   ✅ React hooks: useFertilizerRecommendations, useManualNutrientCheck');
console.log('   ✅ Core logic: fertilizer-recommendations.ts');
console.log('   ✅ Full page: /fertilizer-recommendations');
console.log('   ✅ Test script: test-fertilizer-recommendations.js');

console.log('\n9. Next Steps:');
console.log('   1. Integrate FertilizerAlertNotifications into your navigation');
console.log('   2. Add FertilizerRecommendations to your main dashboard');
console.log('   3. Test with your actual sensor data');
console.log('   4. Customize nutrient ranges if needed');
console.log('   5. Set up database triggers for real-time updates (optional)');

console.log('\n🎉 Fertilizer Recommendation System is ready to use!');

// Export for use in documentation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    examples: {
      component: componentExample,
      hook: hookExample,
      function: functionExample,
      integration: integrationExample,
      customization: customizationExample
    }
  };
}
