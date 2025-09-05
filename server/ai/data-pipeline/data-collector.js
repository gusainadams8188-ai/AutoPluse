const Database = require('better-sqlite3');
const path = require('path');
const math = require('mathjs');

class DataCollector {
  constructor(dbPath = path.join(__dirname, '../../../database/vehicle_data.db')) {
    this.db = new Database(dbPath);
    this.featureColumns = [
      'rpm', 'speed', 'coolant_temp', 'intake_air_temp', 'throttle_pos',
      'engine_load', 'fuel_pressure', 'intake_manifold_pressure'
    ];
  }

  /**
   * Collect historical vehicle metrics data for training
   * @param {number} limit - Maximum number of records to collect
   * @param {Date} startDate - Start date for data collection
   * @param {Date} endDate - End date for data collection
   * @returns {Array} Array of processed data points
   */
  collectTrainingData(limit = 10000, startDate = null, endDate = null) {
    let query = `
      SELECT
        id, timestamp, rpm, speed, coolant_temp, intake_air_temp,
        throttle_pos, engine_load, fuel_pressure, intake_manifold_pressure,
        mode, vehicle_type, fault_scenario
      FROM vehicle_metrics
      WHERE rpm IS NOT NULL AND speed IS NOT NULL
    `;

    const params = [];

    if (startDate) {
      query += ' AND timestamp >= ?';
      params.push(startDate.toISOString());
    }

    if (endDate) {
      query += ' AND timestamp <= ?';
      params.push(endDate.toISOString());
    }

    query += ' ORDER BY timestamp DESC LIMIT ?';
    params.push(limit);

    const stmt = this.db.prepare(query);
    const rawData = stmt.all(...params);

    return this.preprocessData(rawData);
  }

  /**
   * Collect fuel economy data for efficiency analysis
   * @param {number} limit - Maximum number of records
   * @returns {Array} Fuel economy data
   */
  collectFuelData(limit = 5000) {
    const query = `
      SELECT
        timestamp, fuel_level, fuel_consumed, distance_traveled,
        instant_mpg, average_mpg, range_remaining
      FROM fuel_economy
      WHERE instant_mpg IS NOT NULL AND fuel_consumed > 0
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const stmt = this.db.prepare(query);
    return stmt.all(limit);
  }

  /**
   * Collect maintenance history for predictive modeling
   * @returns {Array} Maintenance records
   */
  collectMaintenanceData() {
    const query = `
      SELECT
        service_type, description, mileage, cost, date_performed,
        next_service_mileage, timestamp
      FROM maintenance_history
      ORDER BY date_performed DESC
    `;

    const stmt = this.db.prepare(query);
    return stmt.all();
  }

  /**
   * Collect DTC codes for failure pattern analysis
   * @returns {Array} DTC code data
   */
  collectDTCData() {
    const query = `
      SELECT
        code, status, description, severity, timestamp
      FROM dtc_codes
      ORDER BY timestamp DESC
    `;

    const stmt = this.db.prepare(query);
    return stmt.all();
  }

  /**
   * Preprocess raw vehicle metrics data
   * @param {Array} rawData - Raw data from database
   * @returns {Array} Processed data ready for ML
   */
  preprocessData(rawData) {
    if (rawData.length === 0) return [];

    // Extract only numerical features for ML processing
    const features = rawData.map(row => ({
      timestamp: new Date(row.timestamp).getTime(),
      rpm: parseFloat(row.rpm) || 0,
      speed: parseFloat(row.speed) || 0,
      coolant_temp: parseFloat(row.coolant_temp) || 0,
      intake_air_temp: parseFloat(row.intake_air_temp) || 0,
      throttle_pos: parseFloat(row.throttle_pos) || 0,
      engine_load: parseFloat(row.engine_load) || 0,
      fuel_pressure: parseFloat(row.fuel_pressure) || 0,
      intake_manifold_pressure: parseFloat(row.intake_manifold_pressure) || 0
      // Categorical columns (mode, vehicle_type, fault_scenario) are excluded for now
    }));

    // Normalize numerical features
    const normalizedFeatures = this.normalizeFeatures(features);

    return normalizedFeatures;
  }

  /**
   * Normalize numerical features using z-score normalization
   * @param {Array} data - Data to normalize
   * @returns {Array} Normalized data
   */
  normalizeFeatures(data) {
    if (data.length === 0) return [];

    // Calculate means and standard deviations for each feature
    const stats = {};
    this.featureColumns.forEach(feature => {
      const values = data.map(d => d[feature]).filter(v => !isNaN(v));
      if (values.length > 0) {
        stats[feature] = {
          mean: math.mean(values),
          std: math.std(values)
        };
      }
    });

    // Normalize each data point
    return data.map(point => {
      const normalized = { ...point };

      this.featureColumns.forEach(feature => {
        if (stats[feature] && stats[feature].std > 0) {
          normalized[feature] = (point[feature] - stats[feature].mean) / stats[feature].std;
        }
      });

      return normalized;
    });
  }

  /**
   * Get real-time data for prediction
   * @param {number} windowSize - Number of recent data points to collect
   * @returns {Array} Recent data for prediction
   */
  getRealtimeData(windowSize = 50) {
    const query = `
      SELECT
        timestamp, rpm, speed, coolant_temp, intake_air_temp,
        throttle_pos, engine_load, fuel_pressure, intake_manifold_pressure,
        mode, vehicle_type, fault_scenario
      FROM vehicle_metrics
      ORDER BY timestamp DESC
      LIMIT ?
    `;

    const stmt = this.db.prepare(query);
    const rawData = stmt.all(windowSize);

    return this.preprocessData(rawData.reverse()); // Reverse to chronological order
  }

  /**
   * Collect OEM-specific data for enhanced analysis
   * @param {string} manufacturer - OEM manufacturer code
   * @returns {Array} OEM-specific data
   */
  collectOEMData(manufacturer) {
    const query = `
      SELECT
        ovm.*, om.manufacturer_name
      FROM oem_vehicle_metrics ovm
      JOIN oem_manufacturers om ON ovm.manufacturer_id = om.id
      WHERE om.manufacturer_code = ?
      ORDER BY ovm.timestamp DESC
      LIMIT 1000
    `;

    const stmt = this.db.prepare(query);
    return stmt.all(manufacturer);
  }

  /**
   * Generate synthetic data for testing and training augmentation
   * @param {number} count - Number of synthetic samples to generate
   * @returns {Array} Synthetic data
   */
  generateSyntheticData(count = 1000) {
    const syntheticData = [];

    for (let i = 0; i < count; i++) {
      const baseData = {
        timestamp: Date.now() - (i * 2000), // 2 seconds apart
        rpm: 800 + Math.random() * 3200,
        speed: Math.random() * 120,
        coolant_temp: 70 + Math.random() * 40,
        intake_air_temp: 15 + Math.random() * 35,
        throttle_pos: Math.random() * 100,
        engine_load: Math.random() * 100,
        fuel_pressure: 30 + Math.random() * 25,
        intake_manifold_pressure: 20 + Math.random() * 60,
        mode: ['city', 'highway', 'sport'][Math.floor(Math.random() * 3)],
        vehicle_type: ['sedan', 'suv', 'truck'][Math.floor(Math.random() * 3)],
        fault_scenario: Math.random() < 0.1 ? ['overheat', 'low_oil', 'sensor_fault'][Math.floor(Math.random() * 3)] : 'normal'
      };

      syntheticData.push(baseData);
    }

    return this.preprocessData(syntheticData);
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close();
    }
  }
}

module.exports = DataCollector;