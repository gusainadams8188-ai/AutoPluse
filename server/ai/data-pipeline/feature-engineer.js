const math = require('mathjs');

class FeatureEngineer {
  constructor() {
    this.windowSize = 10; // Default window size for rolling calculations
  }

  /**
   * Engineer features from raw vehicle data
   * @param {Array} data - Raw vehicle data
   * @returns {Array} Data with engineered features
   */
  engineerFeatures(data) {
    if (!data || data.length === 0) return [];

    const engineeredData = data.map((point, index) => {
      const engineered = { ...point };

      // Basic statistical features
      const windowData = this.getWindowData(data, index, this.windowSize);
      engineered.rolling_mean_rpm = this.calculateRollingMean(windowData, 'rpm');
      engineered.rolling_std_rpm = this.calculateRollingStd(windowData, 'rpm');
      engineered.rolling_mean_speed = this.calculateRollingMean(windowData, 'speed');
      engineered.rolling_std_speed = this.calculateRollingStd(windowData, 'speed');

      // Rate of change features
      engineered.rpm_rate_of_change = this.calculateRateOfChange(data, index, 'rpm');
      engineered.speed_rate_of_change = this.calculateRateOfChange(data, index, 'speed');
      engineered.temp_rate_of_change = this.calculateRateOfChange(data, index, 'coolant_temp');

      // Efficiency features
      engineered.power_to_weight_ratio = this.calculatePowerToWeightRatio(point);
      engineered.fuel_efficiency_index = this.calculateFuelEfficiencyIndex(point);

      // Health indicators
      engineered.engine_stress_index = this.calculateEngineStressIndex(point);
      engineered.cooling_system_health = this.calculateCoolingSystemHealth(point);
      engineered.fuel_system_health = this.calculateFuelSystemHealth(point);

      // Derived mechanical features
      engineered.engine_power_estimate = this.estimateEnginePower(point);
      engineered.transmission_load = this.calculateTransmissionLoad(point);

      // Environmental and operational features
      engineered.ambient_temp_difference = point.intake_air_temp - point.coolant_temp;
      engineered.throttle_response = this.calculateThrottleResponse(point);

      // Time-based features
      engineered.hour_of_day = new Date(point.timestamp).getHours();
      engineered.is_peak_hour = this.isPeakHour(point.timestamp);
      engineered.is_weekend = this.isWeekend(point.timestamp);

      return engineered;
    });

    return engineeredData;
  }

  /**
   * Get window of data around current index
   * @param {Array} data - Full dataset
   * @param {number} index - Current index
   * @param {number} windowSize - Size of window
   * @returns {Array} Window data
   */
  getWindowData(data, index, windowSize) {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, index + Math.floor(windowSize / 2) + 1);
    return data.slice(start, end);
  }

  /**
   * Calculate rolling mean for a feature
   * @param {Array} windowData - Window of data
   * @param {string} feature - Feature name
   * @returns {number} Rolling mean
   */
  calculateRollingMean(windowData, feature) {
    const values = windowData.map(d => d[feature]).filter(v => !isNaN(v));
    return values.length > 0 ? math.mean(values) : 0;
  }

  /**
   * Calculate rolling standard deviation for a feature
   * @param {Array} windowData - Window of data
   * @param {string} feature - Feature name
   * @returns {number} Rolling standard deviation
   */
  calculateRollingStd(windowData, feature) {
    const values = windowData.map(d => d[feature]).filter(v => !isNaN(v));
    return values.length > 1 ? math.std(values) : 0;
  }

  /**
   * Calculate rate of change for a feature
   * @param {Array} data - Full dataset
   * @param {number} index - Current index
   * @param {string} feature - Feature name
   * @returns {number} Rate of change
   */
  calculateRateOfChange(data, index, feature) {
    if (index === 0) return 0;

    const current = data[index][feature];
    const previous = data[index - 1][feature];

    if (isNaN(current) || isNaN(previous)) return 0;

    // Assuming 2-second intervals between data points
    const timeInterval = 2; // seconds
    return (current - previous) / timeInterval;
  }

  /**
   * Calculate power-to-weight ratio estimate
   * @param {Object} point - Data point
   * @returns {number} Power-to-weight ratio
   */
  calculatePowerToWeightRatio(point) {
    // Estimate power based on RPM and load
    const estimatedPower = (point.rpm * point.engine_load) / 1000;

    // Estimate weight based on vehicle type (rough estimates)
    const weightEstimates = {
      sedan: 1500,
      suv: 2000,
      truck: 2500
    };

    const estimatedWeight = weightEstimates[point.vehicle_type] || 1500;
    return estimatedPower / estimatedWeight;
  }

  /**
   * Calculate fuel efficiency index
   * @param {Object} point - Data point
   * @returns {number} Fuel efficiency index
   */
  calculateFuelEfficiencyIndex(point) {
    // Combine multiple factors affecting fuel efficiency
    const speedEfficiency = Math.max(0, 1 - Math.abs(point.speed - 60) / 60); // Optimal around 60 km/h
    const loadEfficiency = 1 - point.engine_load / 100;
    const throttleEfficiency = 1 - point.throttle_pos / 100;

    return (speedEfficiency + loadEfficiency + throttleEfficiency) / 3;
  }

  /**
   * Calculate engine stress index
   * @param {Object} point - Data point
   * @returns {number} Engine stress index (0-1)
   */
  calculateEngineStressIndex(point) {
    const rpmStress = Math.min(point.rpm / 6000, 1); // High RPM stress
    const loadStress = point.engine_load / 100;
    const tempStress = Math.max(0, (point.coolant_temp - 90) / 30); // Temperature stress

    return Math.min(1, (rpmStress + loadStress + tempStress) / 3);
  }

  /**
   * Calculate cooling system health indicator
   * @param {Object} point - Data point
   * @returns {number} Cooling system health (0-1, higher is better)
   */
  calculateCoolingSystemHealth(point) {
    const optimalTemp = 85;
    const tempDeviation = Math.abs(point.coolant_temp - optimalTemp);
    const tempHealth = Math.max(0, 1 - tempDeviation / 50);

    // Consider temperature stability (would need historical data for full calculation)
    return tempHealth;
  }

  /**
   * Calculate fuel system health indicator
   * @param {Object} point - Data point
   * @returns {number} Fuel system health (0-1, higher is better)
   */
  calculateFuelSystemHealth(point) {
    const pressureHealth = Math.max(0, 1 - Math.abs(point.fuel_pressure - 45) / 30);
    const manifoldPressureHealth = point.intake_manifold_pressure > 20 ? 1 : 0.5;

    return (pressureHealth + manifoldPressureHealth) / 2;
  }

  /**
   * Estimate engine power
   * @param {Object} point - Data point
   * @returns {number} Estimated power in horsepower
   */
  estimateEnginePower(point) {
    // Rough estimation based on RPM and manifold pressure
    const basePower = (point.rpm * point.intake_manifold_pressure) / 10000;
    const loadMultiplier = point.engine_load / 100;

    return basePower * loadMultiplier;
  }

  /**
   * Calculate transmission load
   * @param {Object} point - Data point
   * @returns {number} Transmission load indicator
   */
  calculateTransmissionLoad(point) {
    // Estimate based on speed, RPM ratio, and throttle position
    const gearRatio = point.speed > 0 ? point.rpm / point.speed : 0;
    const throttleLoad = point.throttle_pos / 100;

    return gearRatio * throttleLoad;
  }

  /**
   * Calculate throttle response
   * @param {Object} point - Data point
   * @returns {number} Throttle response indicator
   */
  calculateThrottleResponse(point) {
    // Relationship between throttle position and engine load
    const expectedLoad = point.throttle_pos * 0.8; // Expected load for given throttle
    const response = Math.abs(point.engine_load - expectedLoad) / 100;

    return Math.max(0, 1 - response); // Higher is better response
  }

  /**
   * Check if timestamp is during peak hour
   * @param {number} timestamp - Unix timestamp
   * @returns {boolean} Is peak hour
   */
  isPeakHour(timestamp) {
    const hour = new Date(timestamp).getHours();
    return (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18);
  }

  /**
   * Check if timestamp is weekend
   * @param {number} timestamp - Unix timestamp
   * @returns {boolean} Is weekend
   */
  isWeekend(timestamp) {
    const day = new Date(timestamp).getDay();
    return day === 0 || day === 6;
  }

  /**
   * Create lag features for time series prediction
   * @param {Array} data - Time series data
   * @param {Array} features - Features to create lags for
   * @param {Array} lagSteps - Lag steps to create
   * @returns {Array} Data with lag features
   */
  createLagFeatures(data, features = ['rpm', 'speed'], lagSteps = [1, 2, 3]) {
    return data.map((point, index) => {
      const laggedPoint = { ...point };

      features.forEach(feature => {
        lagSteps.forEach(lag => {
          const lagIndex = index - lag;
          const lagValue = lagIndex >= 0 ? data[lagIndex][feature] : 0;
          laggedPoint[`${feature}_lag_${lag}`] = lagValue;
        });
      });

      return laggedPoint;
    });
  }

  /**
   * Create moving average features
   * @param {Array} data - Time series data
   * @param {Array} features - Features to create moving averages for
   * @param {Array} windows - Window sizes for moving averages
   * @returns {Array} Data with moving average features
   */
  createMovingAverageFeatures(data, features = ['rpm', 'speed'], windows = [5, 10, 20]) {
    return data.map((point, index) => {
      const maPoint = { ...point };

      features.forEach(feature => {
        windows.forEach(window => {
          const start = Math.max(0, index - window + 1);
          const windowData = data.slice(start, index + 1);
          const values = windowData.map(d => d[feature]).filter(v => !isNaN(v));

          if (values.length > 0) {
            maPoint[`${feature}_ma_${window}`] = math.mean(values);
          } else {
            maPoint[`${feature}_ma_${window}`] = 0;
          }
        });
      });

      return maPoint;
    });
  }

  /**
   * Detect anomalies using statistical methods
   * @param {Array} data - Data to analyze
   * @param {string} feature - Feature to check for anomalies
   * @param {number} threshold - Z-score threshold for anomaly detection
   * @returns {Array} Data with anomaly flags
   */
  detectAnomalies(data, feature = 'rpm', threshold = 3) {
    const values = data.map(d => d[feature]).filter(v => !isNaN(v));

    if (values.length < 10) return data;

    const mean = math.mean(values);
    const std = math.std(values);

    return data.map(point => ({
      ...point,
      [`${feature}_anomaly`]: Math.abs(point[feature] - mean) / std > threshold,
      [`${feature}_zscore`]: (point[feature] - mean) / std
    }));
  }

  /**
   * Set window size for rolling calculations
   * @param {number} size - Window size
   */
  setWindowSize(size) {
    this.windowSize = size;
  }
}

module.exports = FeatureEngineer;