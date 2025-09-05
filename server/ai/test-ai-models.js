const DataPipeline = require('./data-pipeline/data-pipeline');
const FuelEfficiencyOptimizer = require('./services/fuel-efficiency-optimizer');
const MaintenancePerformanceAnalyzer = require('./services/maintenance-performance-analyzer');
const DiagnosticReportGenerator = require('./services/diagnostic-report-generator');

class AIModelTester {
  constructor() {
    this.dataPipeline = new DataPipeline();
    this.fuelOptimizer = new FuelEfficiencyOptimizer();
    this.maintenanceAnalyzer = new MaintenancePerformanceAnalyzer();
    this.reportGenerator = new DiagnosticReportGenerator();
  }

  /**
   * Run comprehensive AI model tests
   */
  async runAllTests() {
    console.log('🚀 Starting AI Model Tests...\n');

    try {
      // Initialize data pipeline
      await this.dataPipeline.initialize();
      console.log('✅ Data Pipeline initialized');

      // Test 1: Data Collection and Processing
      console.log('\n📊 Test 1: Data Collection and Processing');
      await this.testDataCollection();

      // Test 2: Fuel Efficiency Analysis
      console.log('\n⛽ Test 2: Fuel Efficiency Analysis');
      await this.testFuelEfficiency();

      // Test 3: Maintenance Performance Analysis
      console.log('\n🔧 Test 3: Maintenance Performance Analysis');
      await this.testMaintenanceAnalysis();

      // Test 4: Diagnostic Report Generation
      console.log('\n📋 Test 4: Diagnostic Report Generation');
      await this.testReportGeneration();

      // Test 5: Real-time AI Processing
      console.log('\n⚡ Test 5: Real-time AI Processing');
      await this.testRealtimeProcessing();

      console.log('\n🎉 All AI model tests completed successfully!');

    } catch (error) {
      console.error('❌ AI Model testing failed:', error);
      throw error;
    }
  }

  /**
   * Test data collection and processing
   */
  async testDataCollection() {
    try {
      // Collect training data
      const trainingData = this.dataPipeline.collector.collectTrainingData(100);
      console.log(`  ✅ Collected ${trainingData.length} training samples`);

      // Test data preprocessing
      const processedData = this.dataPipeline.preprocessor.preprocessForTraining(
        trainingData,
        ['rpm', 'speed', 'coolant_temp', 'engine_load']
      );
      console.log(`  ✅ Preprocessed data: ${processedData.features.rows} rows, ${processedData.features.columns} features`);

      // Test feature engineering
      const engineeredData = this.dataPipeline.featureEngineer.engineerFeatures(trainingData);
      console.log(`  ✅ Engineered features: ${Object.keys(engineeredData[0] || {}).length} total features`);

      return true;
    } catch (error) {
      console.error('  ❌ Data collection test failed:', error);
      throw error;
    }
  }

  /**
   * Test fuel efficiency analysis
   */
  async testFuelEfficiency() {
    try {
      // Get test data
      const fuelData = this.dataPipeline.collector.collectFuelData(50);
      const realtimeData = await this.dataPipeline.processRealtimeData(20);
      const sensorData = realtimeData.rawData;

      // Test fuel efficiency analysis
      const analysis = this.fuelOptimizer.analyzeFuelEfficiency(fuelData, sensorData);
      console.log(`  ✅ Fuel efficiency analysis: ${analysis.current_efficiency?.instant_mpg?.toFixed(1)} MPG`);

      // Test eco-driving score
      const ecoScore = this.fuelOptimizer.generateEcoDrivingScore(sensorData);
      console.log(`  ✅ Eco-driving score: ${ecoScore.score}/100 (${ecoScore.grade})`);

      // Test driving pattern identification
      const pattern = this.fuelOptimizer.identifyDrivingPattern(sensorData);
      console.log(`  ✅ Driving pattern: ${pattern}`);

      return true;
    } catch (error) {
      console.error('  ❌ Fuel efficiency test failed:', error);
      throw error;
    }
  }

  /**
   * Test maintenance performance analysis
   */
  async testMaintenanceAnalysis() {
    try {
      // Get test data
      const maintenanceHistory = this.dataPipeline.collector.collectMaintenanceData();
      const performanceData = this.dataPipeline.collector.collectTrainingData(200);

      // Test maintenance impact analysis
      const analysis = this.maintenanceAnalyzer.analyzeMaintenanceImpact(
        maintenanceHistory,
        performanceData
      );

      if (analysis.status === 'success') {
        console.log(`  ✅ Maintenance analysis: ${analysis.maintenance_events_analyzed} events analyzed`);
        console.log(`  ✅ Overall effectiveness: ${(analysis.analysis?.maintenance_effectiveness?.overall_score || 0).toFixed(1)}/100`);
      } else {
        console.log(`  ⚠️  Maintenance analysis: ${analysis.message}`);
      }

      // Test maintenance impact prediction
      const prediction = this.maintenanceAnalyzer.predictMaintenanceImpact(
        'oil_change',
        { fuel_efficiency: 25, engine_performance: 1.0 }
      );

      if (prediction.prediction_available) {
        console.log(`  ✅ Impact prediction: ${(prediction.expected_improvements?.fuel_efficiency?.improvement_percentage || 0).toFixed(1)}% improvement expected`);
      }

      return true;
    } catch (error) {
      console.error('  ❌ Maintenance analysis test failed:', error);
      throw error;
    }
  }

  /**
   * Test diagnostic report generation
   */
  async testReportGeneration() {
    try {
      // Prepare test diagnostic data
      const realtimeData = await this.dataPipeline.processRealtimeData(10);
      const diagnosticData = {
        vehicleData: realtimeData.rawData[realtimeData.rawData.length - 1],
        sensorData: realtimeData.rawData[realtimeData.rawData.length - 1],
        dtcCodes: [
          { code: 'P0300', description: 'Random/Multiple Cylinder Misfire Detected', severity: 'High' }
        ],
        symptoms: ['Engine misfire', 'Rough idle'],
        maintenanceHistory: this.dataPipeline.collector.collectMaintenanceData().slice(0, 3)
      };

      // Generate comprehensive report
      const report = await this.reportGenerator.generateReport(diagnosticData, 'comprehensive');
      console.log(`  ✅ Generated report: ${report.title}`);
      console.log(`  ✅ Report sections: ${Object.keys(report.sections).length}`);

      // Test report export
      const htmlReport = this.reportGenerator.exportReport(report, 'html');
      console.log(`  ✅ Exported HTML report: ${htmlReport.length} characters`);

      return true;
    } catch (error) {
      console.error('  ❌ Report generation test failed:', error);
      throw error;
    }
  }

  /**
   * Test real-time AI processing
   */
  async testRealtimeProcessing() {
    try {
      // Test real-time data processing
      const realtimeData = await this.dataPipeline.processRealtimeData(30);
      console.log(`  ✅ Real-time data: ${realtimeData.rawData.length} data points processed`);

      // Test real-time anomaly detection (simulated)
      const sensorData = realtimeData.rawData;
      const anomalies = this.detectAnomaliesRealtime(sensorData);
      console.log(`  ✅ Anomaly detection: ${anomalies.length} potential anomalies detected`);

      // Test real-time fuel efficiency monitoring
      const fuelEfficiency = this.fuelOptimizer.analyzeFuelEfficiency([], sensorData);
      console.log(`  ✅ Real-time fuel efficiency: ${fuelEfficiency.current_efficiency?.instant_mpg?.toFixed(1)} MPG`);

      return true;
    } catch (error) {
      console.error('  ❌ Real-time processing test failed:', error);
      throw error;
    }
  }

  /**
   * Simple anomaly detection for testing
   */
  detectAnomaliesRealtime(sensorData) {
    const anomalies = [];
    const rpmValues = sensorData.map(d => d.rpm).filter(v => !isNaN(v));

    if (rpmValues.length > 5) {
      const mean = rpmValues.reduce((sum, val) => sum + val, 0) / rpmValues.length;
      const std = Math.sqrt(rpmValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / rpmValues.length);

      sensorData.forEach((point, index) => {
        if (Math.abs(point.rpm - mean) > 2 * std) {
          anomalies.push({
            index,
            value: point.rpm,
            deviation: Math.abs(point.rpm - mean) / std,
            timestamp: point.timestamp
          });
        }
      });
    }

    return anomalies;
  }

  /**
   * Run performance benchmark
   */
  async runPerformanceBenchmark() {
    console.log('\n⚡ Running AI Performance Benchmark...\n');

    try {
      const iterations = 10;
      const times = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();

        // Test data processing pipeline
        await this.dataPipeline.processRealtimeData(50);

        // Test fuel efficiency analysis
        const realtimeData = await this.dataPipeline.processRealtimeData(20);
        this.fuelOptimizer.analyzeFuelEfficiency([], realtimeData.rawData);

        const endTime = Date.now();
        times.push(endTime - startTime);
      }

      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      const minTime = Math.min(...times);
      const maxTime = Math.max(...times);

      console.log(`  📈 Average processing time: ${avgTime.toFixed(2)}ms`);
      console.log(`  🏃‍♂️ Fastest: ${minTime}ms`);
      console.log(`  🐌 Slowest: ${maxTime}ms`);
      console.log(`  📊 Throughput: ${(1000 / avgTime).toFixed(1)} operations/second`);

      return { avgTime, minTime, maxTime, throughput: 1000 / avgTime };
    } catch (error) {
      console.error('  ❌ Performance benchmark failed:', error);
      throw error;
    }
  }

  /**
   * Generate test report
   */
  async generateTestReport() {
    console.log('\n📋 Generating Test Report...\n');

    try {
      const results = {
        timestamp: new Date().toISOString(),
        tests: [],
        summary: {}
      };

      // Run individual tests and collect results
      const testDataCollection = await this.testDataCollection();
      results.tests.push({ name: 'Data Collection', status: testDataCollection ? 'passed' : 'failed' });

      const testFuelEfficiency = await this.testFuelEfficiency();
      results.tests.push({ name: 'Fuel Efficiency', status: testFuelEfficiency ? 'passed' : 'failed' });

      const testMaintenanceAnalysis = await this.testMaintenanceAnalysis();
      results.tests.push({ name: 'Maintenance Analysis', status: testMaintenanceAnalysis ? 'passed' : 'failed' });

      const testReportGeneration = await this.testReportGeneration();
      results.tests.push({ name: 'Report Generation', status: testReportGeneration ? 'passed' : 'failed' });

      const testRealtimeProcessing = await this.testRealtimeProcessing();
      results.tests.push({ name: 'Real-time Processing', status: testRealtimeProcessing ? 'passed' : 'failed' });

      // Generate summary
      const passedTests = results.tests.filter(test => test.status === 'passed').length;
      const totalTests = results.tests.length;

      results.summary = {
        total_tests: totalTests,
        passed_tests: passedTests,
        failed_tests: totalTests - passedTests,
        success_rate: (passedTests / totalTests * 100).toFixed(1) + '%',
        overall_status: passedTests === totalTests ? 'success' : 'partial'
      };

      console.log(`  📊 Test Results: ${passedTests}/${totalTests} tests passed (${results.summary.success_rate})`);

      // Save test report
      const fs = require('fs');
      const path = require('path');
      const reportPath = path.join(__dirname, '../../test-results', `ai-test-report-${Date.now()}.json`);

      // Ensure directory exists
      const dir = path.dirname(reportPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
      console.log(`  💾 Test report saved to: ${reportPath}`);

      return results;
    } catch (error) {
      console.error('  ❌ Test report generation failed:', error);
      throw error;
    }
  }
}

// Export for use as module
module.exports = AIModelTester;

// Run tests if called directly
if (require.main === module) {
  const tester = new AIModelTester();

  // Run all tests
  tester.runAllTests()
    .then(() => {
      console.log('\n🎯 Running performance benchmark...');
      return tester.runPerformanceBenchmark();
    })
    .then(() => {
      console.log('\n📄 Generating test report...');
      return tester.generateTestReport();
    })
    .then(() => {
      console.log('\n✅ All AI model tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ AI model tests failed:', error);
      process.exit(1);
    });
}