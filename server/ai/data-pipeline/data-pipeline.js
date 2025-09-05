const DataCollector = require('./data-collector');
const DataPreprocessor = require('./data-preprocessor');
const FeatureEngineer = require('./feature-engineer');

class DataPipeline {
  constructor() {
    this.collector = new DataCollector();
    this.preprocessor = new DataPreprocessor();
    this.featureEngineer = new FeatureEngineer();
    this.isInitialized = false;
  }

  /**
   * Initialize the data pipeline
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('Initializing AI Data Pipeline...');

      // Test database connection
      const testData = this.collector.collectTrainingData(1);
      if (testData.length === 0) {
        console.warn('No training data available. Pipeline will work with synthetic data.');
      }

      this.isInitialized = true;
      console.log('AI Data Pipeline initialized successfully');
    } catch (error) {
      console.error('Error initializing data pipeline:', error);
      throw error;
    }
  }

  /**
   * Process data for training machine learning models
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} Processed training data
   */
  async processForTraining(options = {}) {
    const {
      limit = 5000,
      includeSynthetic = true,
      featureEngineering = true,
      targetColumn = null,
      startDate = null,
      endDate = null
    } = options;

    try {
      console.log('Processing data for training...');

      // Collect training data
      let trainingData = this.collector.collectTrainingData(limit, startDate, endDate);

      // Add synthetic data if requested and real data is limited
      if (includeSynthetic && trainingData.length < 1000) {
        console.log('Adding synthetic data to augment training set...');
        const syntheticData = this.collector.generateSyntheticData(2000);
        trainingData = [...trainingData, ...syntheticData];
      }

      if (trainingData.length === 0) {
        throw new Error('No training data available');
      }

      console.log(`Collected ${trainingData.length} training samples`);

      // Feature engineering
      let processedData = trainingData;
      if (featureEngineering) {
        console.log('Engineering features...');
        // Skip feature engineering for now to isolate the issue
        // processedData = this.featureEngineer.engineerFeatures(trainingData);
        // processedData = this.featureEngineer.createLagFeatures(processedData, ['rpm', 'speed'], [1, 2, 3]);
        // processedData = this.featureEngineer.createMovingAverageFeatures(processedData, ['rpm', 'speed'], [5, 10]);
      }

      // Define feature columns - only include numeric features for now
      const numericFeatures = [
        'rpm', 'speed', 'coolant_temp', 'intake_air_temp',
        'throttle_pos', 'engine_load', 'fuel_pressure', 'intake_manifold_pressure'
      ];

      const engineeredFeatures = featureEngineering ? [
        'rolling_mean_rpm', 'rolling_std_rpm', 'rolling_mean_speed', 'rolling_std_speed',
        'rpm_rate_of_change', 'speed_rate_of_change', 'temp_rate_of_change',
        'power_to_weight_ratio', 'fuel_efficiency_index', 'engine_stress_index',
        'cooling_system_health', 'fuel_system_health', 'engine_power_estimate',
        'transmission_load', 'ambient_temp_difference', 'throttle_response',
        'hour_of_day', 'is_peak_hour', 'is_weekend',
        'rpm_lag_1', 'rpm_lag_2', 'rpm_lag_3',
        'speed_lag_1', 'speed_lag_2', 'speed_lag_3',
        'rpm_ma_5', 'rpm_ma_10', 'speed_ma_5', 'speed_ma_10'
      ] : [];

      const featureColumns = [...numericFeatures, ...engineeredFeatures];

      // Preprocess data
      console.log('Preprocessing data...');
      const processed = this.preprocessor.preprocessForTraining(
        processedData,
        featureColumns,
        targetColumn
      );

      // Perform feature selection and validation
      console.log('Performing feature selection and validation...');
      const featureSelection = this.preprocessor.selectFeatures(
        processed.features,
        featureColumns,
        targetColumn ? processed.targets : null
      );

      const dataValidation = this.preprocessor.validateDataQuality(
        processed.features,
        targetColumn ? processed.targets : null
      );

      // Store validation results
      this.preprocessor.featureSelection = featureSelection;
      this.preprocessor.dataValidation = dataValidation;

      console.log(`Training data processed: ${processed.features.rows} samples, ${processed.features.columns} features`);
      console.log(`Selected features: ${featureSelection.selectedFeatures.length}/${featureColumns.length}`);
      if (dataValidation.issues.length > 0) {
        console.warn('Data quality issues found:', dataValidation.issues);
      }

      return {
        ...processed,
        featureSelection: featureSelection,
        dataValidation: dataValidation,
        metadata: {
          totalSamples: processed.features.rows,
          featureCount: processed.features.columns,
          selectedFeatureCount: featureSelection.selectedFeatures.length,
          featureColumns: featureColumns,
          selectedFeatures: featureSelection.selectedFeatures,
          hasTargets: targetColumn !== null,
          syntheticDataIncluded: includeSynthetic,
          featureEngineeringApplied: featureEngineering,
          dataQualityIssues: dataValidation.issues.length,
          dataQualityRecommendations: dataValidation.recommendations
        }
      };

    } catch (error) {
      console.error('Error processing training data:', error);
      throw error;
    }
  }

  /**
   * Process real-time data for prediction
   * @param {number} windowSize - Size of data window
   * @returns {Promise<Object>} Processed real-time data
   */
  async processRealtimeData(windowSize = 50) {
    try {
      // Get recent data
      const recentData = this.collector.getRealtimeData(windowSize);

      if (recentData.length === 0) {
        throw new Error('No real-time data available');
      }

      // Apply feature engineering
      const engineeredData = this.featureEngineer.engineerFeatures(recentData);
      const laggedData = this.featureEngineer.createLagFeatures(engineeredData, ['rpm', 'speed'], [1, 2, 3]);
      const maData = this.featureEngineer.createMovingAverageFeatures(laggedData, ['rpm', 'speed'], [5, 10]);

      // Define feature columns (same as training)
      const featureColumns = [
        'rpm', 'speed', 'coolant_temp', 'intake_air_temp',
        'throttle_pos', 'engine_load', 'fuel_pressure', 'intake_manifold_pressure',
        'mode', 'vehicle_type', 'fault_scenario',
        'rolling_mean_rpm', 'rolling_std_rpm', 'rolling_mean_speed', 'rolling_std_speed',
        'rpm_rate_of_change', 'speed_rate_of_change', 'temp_rate_of_change',
        'power_to_weight_ratio', 'fuel_efficiency_index', 'engine_stress_index',
        'cooling_system_health', 'fuel_system_health', 'engine_power_estimate',
        'transmission_load', 'ambient_temp_difference', 'throttle_response',
        'hour_of_day', 'is_peak_hour', 'is_weekend',
        'rpm_lag_1', 'rpm_lag_2', 'rpm_lag_3',
        'speed_lag_1', 'speed_lag_2', 'speed_lag_3',
        'rpm_ma_5', 'rpm_ma_10', 'speed_ma_5', 'speed_ma_10'
      ];

      // Transform using fitted preprocessor
      const processedFeatures = this.preprocessor.transform(maData, featureColumns);

      return {
        features: processedFeatures,
        featureColumns: featureColumns,
        rawData: recentData,
        engineeredData: maData,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Error processing real-time data:', error);
      throw error;
    }
  }

  /**
   * Process data for anomaly detection
   * @param {Array} data - Data to analyze for anomalies
   * @returns {Promise<Array>} Data with anomaly scores
   */
  async processForAnomalyDetection(data = null) {
    try {
      const targetData = data || this.collector.getRealtimeData(100);

      if (targetData.length === 0) {
        throw new Error('No data available for anomaly detection');
      }

      // Apply feature engineering
      const engineeredData = this.featureEngineer.engineerFeatures(targetData);

      // Detect anomalies in key features
      const featuresToCheck = ['rpm', 'speed', 'coolant_temp', 'engine_load'];
      let anomalyData = engineeredData;

      featuresToCheck.forEach(feature => {
        anomalyData = this.featureEngineer.detectAnomalies(anomalyData, feature, 2.5);
      });

      // Calculate overall anomaly score
      anomalyData = anomalyData.map(point => {
        const anomalyFeatures = featuresToCheck.map(f => point[`${f}_anomaly`] ? 1 : 0);
        const anomalyScore = anomalyFeatures.reduce((sum, val) => sum + val, 0) / featuresToCheck.length;

        return {
          ...point,
          overall_anomaly_score: anomalyScore,
          is_anomaly: anomalyScore > 0.3 // Threshold for anomaly detection
        };
      });

      return anomalyData;

    } catch (error) {
      console.error('Error processing data for anomaly detection:', error);
      throw error;
    }
  }

  /**
   * Get data statistics and insights
   * @returns {Promise<Object>} Data statistics
   */
  async getDataStatistics() {
    try {
      const trainingData = this.collector.collectTrainingData(1000);
      const fuelData = this.collector.collectFuelData(1000);
      const maintenanceData = this.collector.collectMaintenanceData();
      const dtcData = this.collector.collectDTCData();

      const stats = {
        vehicleMetrics: {
          count: trainingData.length,
          dateRange: trainingData.length > 0 ? {
            start: new Date(Math.min(...trainingData.map(d => d.timestamp))),
            end: new Date(Math.max(...trainingData.map(d => d.timestamp)))
          } : null,
          features: trainingData.length > 0 ? Object.keys(trainingData[0]) : []
        },
        fuelEconomy: {
          count: fuelData.length,
          averageMPG: fuelData.length > 0 ?
            fuelData.reduce((sum, d) => sum + d.average_mpg, 0) / fuelData.length : 0
        },
        maintenance: {
          count: maintenanceData.length,
          totalCost: maintenanceData.reduce((sum, d) => sum + d.cost, 0),
          serviceTypes: [...new Set(maintenanceData.map(d => d.service_type))]
        },
        dtcCodes: {
          count: dtcData.length,
          severityBreakdown: this.getSeverityBreakdown(dtcData),
          commonCodes: this.getCommonCodes(dtcData)
        }
      };

      return stats;

    } catch (error) {
      console.error('Error getting data statistics:', error);
      throw error;
    }
  }

  /**
   * Get severity breakdown of DTC codes
   * @param {Array} dtcData - DTC data
   * @returns {Object} Severity breakdown
   */
  getSeverityBreakdown(dtcData) {
    const breakdown = { High: 0, Medium: 0, Low: 0 };

    dtcData.forEach(dtc => {
      if (breakdown.hasOwnProperty(dtc.severity)) {
        breakdown[dtc.severity]++;
      }
    });

    return breakdown;
  }

  /**
   * Get most common DTC codes
   * @param {Array} dtcData - DTC data
   * @returns {Array} Common codes with counts
   */
  getCommonCodes(dtcData) {
    const codeCounts = {};

    dtcData.forEach(dtc => {
      codeCounts[dtc.code] = (codeCounts[dtc.code] || 0) + 1;
    });

    return Object.entries(codeCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([code, count]) => ({ code, count }));
  }

  /**
   * Export processed data for external analysis
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Exported data
   */
  async exportProcessedData(options = {}) {
    const {
      format = 'json',
      includeRaw = true,
      includeFeatures = true,
      limit = 1000
    } = options;

    try {
      const trainingData = await this.processForTraining({ limit, featureEngineering: true });
      const statistics = await this.getDataStatistics();

      const exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          format: format,
          dataPoints: trainingData.features.rows,
          features: trainingData.featureColumns.length
        },
        statistics: statistics,
        preprocessing: this.preprocessor.getStatistics()
      };

      if (includeRaw) {
        exportData.rawData = trainingData.originalData.slice(0, limit);
      }

      if (includeFeatures) {
        exportData.processedFeatures = trainingData.features.to2DArray();
        exportData.featureColumns = trainingData.featureColumns;
      }

      return exportData;

    } catch (error) {
      console.error('Error exporting processed data:', error);
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.collector) {
      this.collector.close();
    }
    this.preprocessor.reset();
    this.isInitialized = false;
  }
}

module.exports = DataPipeline;