const FailurePredictionModel = require('../models/failure-prediction-model');
const AnomalyDetectionModel = require('../models/anomaly-detection-model');
const DataPipeline = require('../data-pipeline/data-pipeline');

class MaintenanceRecommendationEngine {
  constructor() {
    this.failureModel = new FailurePredictionModel();
    this.anomalyModel = new AnomalyDetectionModel();
    this.dataPipeline = new DataPipeline();
    this.isInitialized = false;
    this.maintenanceRules = this.initializeMaintenanceRules();
  }

  /**
   * Initialize maintenance rules and thresholds
   * @returns {Object} Maintenance rules
   */
  initializeMaintenanceRules() {
    return {
      // Engine oil rules
      engine_oil: {
        max_mileage: 7500,
        max_months: 6,
        critical_level: 20,
        warning_level: 30,
        indicators: ['engine_oil_level', 'rpm', 'engine_load']
      },

      // Coolant system rules
      coolant: {
        max_temp: 100,
        critical_temp: 110,
        warning_temp: 95,
        indicators: ['coolant_temp', 'engine_load', 'ambient_temp_difference']
      },

      // Fuel system rules
      fuel_system: {
        min_pressure: 30,
        critical_pressure: 25,
        indicators: ['fuel_pressure', 'engine_load', 'fuel_consumed']
      },

      // Brake system rules
      brakes: {
        max_mileage: 50000,
        max_months: 24,
        indicators: ['brake_pad_wear', 'speed', 'deceleration_events']
      },

      // Battery rules
      battery: {
        min_voltage: 12.0,
        critical_voltage: 11.5,
        indicators: ['battery_voltage', 'engine_start_time', 'electrical_load']
      },

      // Transmission rules
      transmission: {
        max_temp: 120,
        critical_temp: 130,
        max_mileage: 60000,
        indicators: ['transmission_temp', 'transmission_slip', 'gear_changes']
      }
    };
  }

  /**
   * Initialize the recommendation engine
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      console.log('Initializing Maintenance Recommendation Engine...');

      await this.dataPipeline.initialize();

      // Try to load pre-trained models
      try {
        await this.failureModel.loadModel('./models/failure-prediction');
        console.log('Failure prediction model loaded');
      } catch (error) {
        console.log('Failure prediction model not found, will use rule-based recommendations');
      }

      try {
        await this.anomalyModel.loadModel('./models/anomaly-detection');
        console.log('Anomaly detection model loaded');
      } catch (error) {
        console.log('Anomaly detection model not found, will use statistical methods');
      }

      this.isInitialized = true;
      console.log('Maintenance Recommendation Engine initialized successfully');
    } catch (error) {
      console.error('Error initializing recommendation engine:', error);
      throw error;
    }
  }

  /**
   * Generate maintenance recommendations based on current data
   * @param {Object} options - Options for recommendation generation
   * @returns {Promise<Array>} Maintenance recommendations
   */
  async generateRecommendations(options = {}) {
    const {
      includePredictive = true,
      includePreventive = true,
      includeAnomalyBased = true,
      urgencyThreshold = 0.7
    } = options;

    try {
      const recommendations = [];

      // Get current vehicle data
      const realtimeData = await this.dataPipeline.processRealtimeData(100);
      const currentMetrics = realtimeData.rawData[realtimeData.rawData.length - 1];

      // Get maintenance history
      const maintenanceHistory = await this.getMaintenanceHistory();

      // Rule-based recommendations
      if (includePreventive) {
        const ruleBasedRecs = this.generateRuleBasedRecommendations(currentMetrics, maintenanceHistory);
        recommendations.push(...ruleBasedRecs);
      }

      // Predictive recommendations
      if (includePredictive && this.failureModel.isTrained) {
        const predictiveRecs = await this.generatePredictiveRecommendations(realtimeData);
        recommendations.push(...predictiveRecs);
      }

      // Anomaly-based recommendations
      if (includeAnomalyBased) {
        const anomalyRecs = await this.generateAnomalyBasedRecommendations(realtimeData);
        recommendations.push(...anomalyRecs);
      }

      // Sort by urgency and filter by threshold
      const filteredRecommendations = recommendations
        .filter(rec => rec.urgency >= urgencyThreshold)
        .sort((a, b) => b.urgency - a.urgency);

      return filteredRecommendations;

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  /**
   * Generate rule-based maintenance recommendations
   * @param {Object} currentMetrics - Current vehicle metrics
   * @param {Array} maintenanceHistory - Maintenance history
   * @returns {Array} Rule-based recommendations
   */
  generateRuleBasedRecommendations(currentMetrics, maintenanceHistory) {
    const recommendations = [];

    // Engine oil recommendation
    const oilRec = this.checkEngineOilMaintenance(currentMetrics, maintenanceHistory);
    if (oilRec) recommendations.push(oilRec);

    // Coolant system recommendation
    const coolantRec = this.checkCoolantSystem(currentMetrics);
    if (coolantRec) recommendations.push(coolantRec);

    // Fuel system recommendation
    const fuelRec = this.checkFuelSystem(currentMetrics);
    if (fuelRec) recommendations.push(fuelRec);

    // Brake system recommendation
    const brakeRec = this.checkBrakeSystem(maintenanceHistory);
    if (brakeRec) recommendations.push(brakeRec);

    // Battery recommendation
    const batteryRec = this.checkBatterySystem(currentMetrics);
    if (batteryRec) recommendations.push(batteryRec);

    // Transmission recommendation
    const transmissionRec = this.checkTransmissionSystem(currentMetrics, maintenanceHistory);
    if (transmissionRec) recommendations.push(transmissionRec);

    return recommendations;
  }

  /**
   * Check engine oil maintenance needs
   * @param {Object} metrics - Current metrics
   * @param {Array} history - Maintenance history
   * @returns {Object|null} Recommendation or null
   */
  checkEngineOilMaintenance(metrics, history) {
    const rules = this.maintenanceRules.engine_oil;

    // Check oil level
    if (metrics.engine_oil_level < rules.critical_level) {
      return {
        id: 'engine_oil_critical',
        type: 'engine_oil',
        priority: 'critical',
        urgency: 0.95,
        title: 'Critical: Engine Oil Level Low',
        description: `Engine oil level is critically low at ${metrics.engine_oil_level}%. Immediate oil top-up required.`,
        recommended_action: 'Add engine oil immediately and check for leaks',
        estimated_cost: 20,
        time_estimate: '30 minutes',
        indicators: ['engine_oil_level']
      };
    }

    if (metrics.engine_oil_level < rules.warning_level) {
      return {
        id: 'engine_oil_warning',
        type: 'engine_oil',
        priority: 'high',
        urgency: 0.85,
        title: 'Warning: Engine Oil Level Low',
        description: `Engine oil level is low at ${metrics.engine_oil_level}%. Oil change may be needed soon.`,
        recommended_action: 'Check oil level and consider oil change',
        estimated_cost: 15,
        time_estimate: '15 minutes',
        indicators: ['engine_oil_level']
      };
    }

    // Check mileage-based maintenance
    const lastOilChange = this.getLastMaintenanceByType(history, 'Oil Change');
    if (lastOilChange) {
      const daysSinceChange = (new Date() - new Date(lastOilChange.date_performed)) / (1000 * 60 * 60 * 24);
      const monthsSinceChange = daysSinceChange / 30;

      if (monthsSinceChange >= rules.max_months) {
        return {
          id: 'engine_oil_time_based',
          type: 'engine_oil',
          priority: 'medium',
          urgency: 0.7,
          title: 'Oil Change Due (Time-based)',
          description: `It's been ${Math.round(monthsSinceChange)} months since last oil change. Recommended interval: ${rules.max_months} months.`,
          recommended_action: 'Schedule oil change appointment',
          estimated_cost: 45,
          time_estimate: '45 minutes',
          indicators: ['time_since_last_service']
        };
      }
    }

    return null;
  }

  /**
   * Check coolant system health
   * @param {Object} metrics - Current metrics
   * @returns {Object|null} Recommendation or null
   */
  checkCoolantSystem(metrics) {
    const rules = this.maintenanceRules.coolant;

    if (metrics.coolant_temp >= rules.critical_temp) {
      return {
        id: 'coolant_overheat_critical',
        type: 'coolant',
        priority: 'critical',
        urgency: 0.98,
        title: 'Critical: Engine Overheating',
        description: `Coolant temperature is critically high at ${metrics.coolant_temp}°C. Engine damage possible.`,
        recommended_action: 'Stop vehicle immediately, check coolant level, and seek professional help',
        estimated_cost: 0,
        time_estimate: 'Emergency',
        indicators: ['coolant_temp']
      };
    }

    if (metrics.coolant_temp >= rules.warning_temp) {
      return {
        id: 'coolant_overheat_warning',
        type: 'coolant',
        priority: 'high',
        urgency: 0.9,
        title: 'Warning: High Coolant Temperature',
        description: `Coolant temperature is elevated at ${metrics.coolant_temp}°C. Monitor closely.`,
        recommended_action: 'Check coolant level, radiator, and cooling fan operation',
        estimated_cost: 0,
        time_estimate: '30 minutes',
        indicators: ['coolant_temp', 'engine_load']
      };
    }

    return null;
  }

  /**
   * Check fuel system health
   * @param {Object} metrics - Current metrics
   * @returns {Object|null} Recommendation or null
   */
  checkFuelSystem(metrics) {
    const rules = this.maintenanceRules.fuel_system;

    if (metrics.fuel_pressure <= rules.critical_pressure) {
      return {
        id: 'fuel_pressure_critical',
        type: 'fuel_system',
        priority: 'critical',
        urgency: 0.92,
        title: 'Critical: Fuel System Pressure Low',
        description: `Fuel pressure is critically low at ${metrics.fuel_pressure} kPa. Engine may stall.`,
        recommended_action: 'Check fuel pump, filter, and pressure regulator',
        estimated_cost: 150,
        time_estimate: '1 hour',
        indicators: ['fuel_pressure']
      };
    }

    if (metrics.fuel_pressure <= rules.min_pressure) {
      return {
        id: 'fuel_pressure_warning',
        type: 'fuel_system',
        priority: 'medium',
        urgency: 0.75,
        title: 'Warning: Fuel System Pressure Low',
        description: `Fuel pressure is below optimal at ${metrics.fuel_pressure} kPa.`,
        recommended_action: 'Inspect fuel system components',
        estimated_cost: 50,
        time_estimate: '30 minutes',
        indicators: ['fuel_pressure']
      };
    }

    return null;
  }

  /**
   * Check brake system maintenance needs
   * @param {Array} history - Maintenance history
   * @returns {Object|null} Recommendation or null
   */
  checkBrakeSystem(history) {
    const rules = this.maintenanceRules.brakes;
    const lastBrakeService = this.getLastMaintenanceByType(history, 'Brake Inspection');

    if (lastBrakeService) {
      const daysSinceService = (new Date() - new Date(lastBrakeService.date_performed)) / (1000 * 60 * 60 * 24);
      const monthsSinceService = daysSinceService / 30;

      if (monthsSinceService >= rules.max_months) {
        return {
          id: 'brake_inspection_due',
          type: 'brakes',
          priority: 'medium',
          urgency: 0.7,
          title: 'Brake Inspection Due',
          description: `It's been ${Math.round(monthsSinceService)} months since last brake inspection. Recommended interval: ${rules.max_months} months.`,
          recommended_action: 'Schedule brake inspection',
          estimated_cost: 80,
          time_estimate: '1 hour',
          indicators: ['time_since_last_service']
        };
      }
    }

    return null;
  }

  /**
   * Check battery system health
   * @param {Object} metrics - Current metrics
   * @returns {Object|null} Recommendation or null
   */
  checkBatterySystem(metrics) {
    const rules = this.maintenanceRules.battery;

    if (metrics.battery_voltage <= rules.critical_voltage) {
      return {
        id: 'battery_voltage_critical',
        type: 'battery',
        priority: 'high',
        urgency: 0.88,
        title: 'Critical: Battery Voltage Low',
        description: `Battery voltage is critically low at ${metrics.battery_voltage}V. Starting issues likely.`,
        recommended_action: 'Test battery and charging system, replace if necessary',
        estimated_cost: 120,
        time_estimate: '30 minutes',
        indicators: ['battery_voltage']
      };
    }

    if (metrics.battery_voltage <= rules.min_voltage) {
      return {
        id: 'battery_voltage_warning',
        type: 'battery',
        priority: 'medium',
        urgency: 0.72,
        title: 'Warning: Battery Voltage Low',
        description: `Battery voltage is below optimal at ${metrics.battery_voltage}V.`,
        recommended_action: 'Test battery health and clean terminals',
        estimated_cost: 30,
        time_estimate: '15 minutes',
        indicators: ['battery_voltage']
      };
    }

    return null;
  }

  /**
   * Check transmission system health
   * @param {Object} metrics - Current metrics
   * @param {Array} history - Maintenance history
   * @returns {Object|null} Recommendation or null
   */
  checkTransmissionSystem(metrics, history) {
    const rules = this.maintenanceRules.transmission;

    if (metrics.transmission_temp >= rules.critical_temp) {
      return {
        id: 'transmission_temp_critical',
        type: 'transmission',
        priority: 'critical',
        urgency: 0.95,
        title: 'Critical: Transmission Overheating',
        description: `Transmission temperature is critically high at ${metrics.transmission_temp}°C.`,
        recommended_action: 'Stop vehicle immediately and check transmission fluid',
        estimated_cost: 0,
        time_estimate: 'Emergency',
        indicators: ['transmission_temp']
      };
    }

    if (metrics.transmission_temp >= rules.max_temp) {
      return {
        id: 'transmission_temp_warning',
        type: 'transmission',
        priority: 'high',
        urgency: 0.8,
        title: 'Warning: Transmission Temperature High',
        description: `Transmission temperature is elevated at ${metrics.transmission_temp}°C.`,
        recommended_action: 'Check transmission fluid level and condition',
        estimated_cost: 40,
        time_estimate: '30 minutes',
        indicators: ['transmission_temp']
      };
    }

    return null;
  }

  /**
   * Generate predictive recommendations using ML models
   * @param {Object} realtimeData - Real-time processed data
   * @returns {Promise<Array>} Predictive recommendations
   */
  async generatePredictiveRecommendations(realtimeData) {
    const recommendations = [];

    try {
      if (this.failureModel.isTrained) {
        const failurePrediction = await this.failureModel.predictFailure(
          realtimeData.rawData,
          20
        );

        if (failurePrediction.prediction && failurePrediction.confidence > 0.7) {
          recommendations.push({
            id: 'predictive_failure_risk',
            type: 'predictive',
            priority: failurePrediction.riskLevel === 'high' ? 'critical' : 'high',
            urgency: failurePrediction.failureProbability,
            title: `Predictive: ${failurePrediction.riskLevel.toUpperCase()} Failure Risk Detected`,
            description: `AI model predicts ${Math.round(failurePrediction.failureProbability * 100)}% chance of component failure in the near future.`,
            recommended_action: 'Schedule comprehensive diagnostic inspection',
            estimated_cost: 150,
            time_estimate: '2 hours',
            indicators: ['rpm', 'engine_load', 'coolant_temp'],
            ai_confidence: failurePrediction.confidence
          });
        }
      }
    } catch (error) {
      console.error('Error generating predictive recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Generate anomaly-based recommendations
   * @param {Object} realtimeData - Real-time processed data
   * @returns {Promise<Array>} Anomaly-based recommendations
   */
  async generateAnomalyBasedRecommendations(realtimeData) {
    const recommendations = [];

    try {
      const anomalyResult = await this.anomalyModel.detectRealtimeAnomalies(realtimeData.rawData);

      if (anomalyResult.isAnomaly && anomalyResult.confidence > 0.6) {
        recommendations.push({
          id: 'anomaly_detected',
          type: 'anomaly',
          priority: anomalyResult.severity === 'critical' ? 'critical' : 'high',
          urgency: anomalyResult.confidence,
          title: `Anomaly Detected: ${anomalyResult.severity.toUpperCase()} Severity`,
          description: `AI detected anomalous sensor readings. Reconstruction error: ${anomalyResult.reconstructionError.toFixed(4)}`,
          recommended_action: 'Perform diagnostic scan and inspect affected systems',
          estimated_cost: 100,
          time_estimate: '1 hour',
          indicators: ['multiple_sensor_anomalies'],
          ai_confidence: anomalyResult.confidence
        });
      }
    } catch (error) {
      console.error('Error generating anomaly-based recommendations:', error);
    }

    return recommendations;
  }

  /**
   * Get last maintenance by type
   * @param {Array} history - Maintenance history
   * @param {string} type - Maintenance type
   * @returns {Object|null} Last maintenance record or null
   */
  getLastMaintenanceByType(history, type) {
    const filtered = history.filter(record =>
      record.service_type.toLowerCase().includes(type.toLowerCase())
    );

    if (filtered.length === 0) return null;

    return filtered.sort((a, b) =>
      new Date(b.date_performed) - new Date(a.date_performed)
    )[0];
  }

  /**
   * Get maintenance history from database
   * @returns {Promise<Array>} Maintenance history
   */
  async getMaintenanceHistory() {
    // This would typically query the database
    // For now, return mock data
    return [
      {
        service_type: 'Oil Change',
        description: 'Full synthetic oil change',
        mileage: 15000,
        cost: 45.99,
        date_performed: '2024-01-15'
      },
      {
        service_type: 'Brake Inspection',
        description: 'Inspect brake pads and rotors',
        mileage: 20000,
        cost: 0.00,
        date_performed: '2024-02-20'
      }
    ];
  }

  /**
   * Get recommendation summary
   * @returns {Promise<Object>} Summary of recommendations
   */
  async getRecommendationSummary() {
    const recommendations = await this.generateRecommendations();

    const summary = {
      total: recommendations.length,
      critical: recommendations.filter(r => r.priority === 'critical').length,
      high: recommendations.filter(r => r.priority === 'high').length,
      medium: recommendations.filter(r => r.priority === 'medium').length,
      low: recommendations.filter(r => r.priority === 'low').length,
      total_cost_estimate: recommendations.reduce((sum, r) => sum + (r.estimated_cost || 0), 0),
      ai_powered: recommendations.some(r => r.ai_confidence !== undefined)
    };

    return summary;
  }
}

module.exports = MaintenanceRecommendationEngine;