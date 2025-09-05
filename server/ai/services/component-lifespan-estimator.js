const math = require('mathjs');

class ComponentLifespanEstimator {
  constructor() {
    this.componentModels = this.initializeComponentModels();
    this.wearFactors = this.initializeWearFactors();
  }

  /**
   * Initialize component lifespan models with baseline expectations
   * @returns {Object} Component models
   */
  initializeComponentModels() {
    return {
      engine_oil: {
        baselineLifespan: 7500, // km
        baselineMonths: 6,
        degradationFactors: ['engine_load', 'rpm', 'operating_temp'],
        wearRate: 0.8
      },
      brake_pads: {
        baselineLifespan: 50000, // km
        degradationFactors: ['speed', 'braking_events', 'vehicle_weight'],
        wearRate: 0.6
      },
      tires: {
        baselineLifespan: 40000, // km
        degradationFactors: ['speed', 'road_conditions', 'alignment'],
        wearRate: 0.7
      },
      battery: {
        baselineLifespan: 48, // months
        degradationFactors: ['temperature', 'charge_cycles', 'depth_of_discharge'],
        wearRate: 0.5
      },
      transmission_fluid: {
        baselineLifespan: 60000, // km
        baselineMonths: 36,
        degradationFactors: ['transmission_temp', 'load_patterns', 'driving_style'],
        wearRate: 0.4
      },
      spark_plugs: {
        baselineLifespan: 100000, // km
        degradationFactors: ['engine_temp', 'fuel_quality', 'ignition_timing'],
        wearRate: 0.3
      },
      air_filter: {
        baselineLifespan: 30000, // km
        degradationFactors: ['air_quality', 'driving_conditions', 'maintenance_schedule'],
        wearRate: 0.5
      },
      coolant: {
        baselineLifespan: 60000, // km
        baselineMonths: 36,
        degradationFactors: ['operating_temp', 'coolant_quality', 'system_pressure'],
        wearRate: 0.4
      }
    };
  }

  /**
   * Initialize wear factors for different conditions
   * @returns {Object} Wear factors
   */
  initializeWearFactors() {
    return {
      // Temperature factors
      temperature: {
        cold: 1.3,    // Increased wear in cold conditions
        normal: 1.0,
        hot: 1.4     // Increased wear in hot conditions
      },

      // Driving style factors
      driving_style: {
        aggressive: 1.8,
        normal: 1.0,
        conservative: 0.7
      },

      // Road conditions
      road_conditions: {
        highway: 0.8,
        city: 1.2,
        rough: 1.5
      },

      // Vehicle load
      vehicle_load: {
        light: 0.8,
        normal: 1.0,
        heavy: 1.3
      },

      // Maintenance quality
      maintenance_quality: {
        poor: 1.4,
        regular: 1.0,
        excellent: 0.8
      }
    };
  }

  /**
   * Estimate remaining lifespan for a specific component
   * @param {string} component - Component name
   * @param {Object} currentData - Current vehicle data
   * @param {Array} historicalData - Historical usage data
   * @param {Object} vehicleInfo - Vehicle information
   * @returns {Object} Lifespan estimation
   */
  estimateComponentLifespan(component, currentData, historicalData = [], vehicleInfo = {}) {
    if (!this.componentModels[component]) {
      throw new Error(`Unknown component: ${component}`);
    }

    const model = this.componentModels[component];

    // Calculate current usage
    const currentUsage = this.calculateCurrentUsage(component, currentData, vehicleInfo);

    // Calculate wear acceleration factors
    const wearFactors = this.calculateWearFactors(component, currentData, historicalData, vehicleInfo);

    // Estimate remaining lifespan
    const remainingLifespan = this.calculateRemainingLifespan(component, currentUsage, wearFactors);

    // Calculate confidence and risk assessment
    const riskAssessment = this.assessRiskLevel(component, remainingLifespan, wearFactors);

    return {
      component: component,
      currentUsage: currentUsage,
      remainingLifespan: remainingLifespan,
      wearFactors: wearFactors,
      riskAssessment: riskAssessment,
      recommendations: this.generateRecommendations(component, remainingLifespan, riskAssessment),
      estimatedReplacementDate: this.calculateReplacementDate(component, remainingLifespan),
      confidence: this.calculateConfidence(historicalData.length, wearFactors)
    };
  }

  /**
   * Calculate current usage for a component
   * @param {string} component - Component name
   * @param {Object} data - Current data
   * @param {Object} vehicleInfo - Vehicle information
   * @returns {Object} Current usage metrics
   */
  calculateCurrentUsage(component, data, vehicleInfo) {
    const model = this.componentModels[component];
    const usage = {
      distance: 0,
      time: 0,
      cycles: 0,
      severity: 1.0
    };

    // Calculate distance-based usage
    if (data.total_distance || vehicleInfo.total_distance) {
      usage.distance = data.total_distance || vehicleInfo.total_distance || 0;
    }

    // Calculate time-based usage
    if (data.operating_hours) {
      usage.time = data.operating_hours;
    } else if (data.timestamp && vehicleInfo.install_date) {
      const installDate = new Date(vehicleInfo.install_date);
      const currentDate = new Date(data.timestamp);
      usage.time = (currentDate - installDate) / (1000 * 60 * 60); // hours
    }

    // Calculate usage severity based on operating conditions
    usage.severity = this.calculateUsageSeverity(component, data);

    return usage;
  }

  /**
   * Calculate usage severity factor
   * @param {string} component - Component name
   * @param {Object} data - Current data
   * @returns {number} Severity factor
   */
  calculateUsageSeverity(component, data) {
    let severity = 1.0;

    switch (component) {
      case 'engine_oil':
        // Higher severity with high RPM and load
        if (data.rpm > 4000) severity *= 1.3;
        if (data.engine_load > 80) severity *= 1.2;
        if (data.coolant_temp > 95) severity *= 1.1;
        break;

      case 'brake_pads':
        // Higher severity with frequent hard braking
        if (data.speed > 100) severity *= 1.2;
        if (data.deceleration_rate > 5) severity *= 1.4;
        break;

      case 'battery':
        // Higher severity with extreme temperatures
        if (data.ambient_temp < 0) severity *= 1.3;
        if (data.ambient_temp > 35) severity *= 1.2;
        break;

      case 'transmission_fluid':
        // Higher severity with high temps and loads
        if (data.transmission_temp > 100) severity *= 1.4;
        if (data.engine_load > 85) severity *= 1.2;
        break;
    }

    return Math.min(severity, 2.0); // Cap at 2.0
  }

  /**
   * Calculate wear acceleration factors
   * @param {string} component - Component name
   * @param {Object} currentData - Current data
   * @param {Array} historicalData - Historical data
   * @param {Object} vehicleInfo - Vehicle information
   * @returns {Object} Wear factors
   */
  calculateWearFactors(component, currentData, historicalData, vehicleInfo) {
    const factors = {
      temperature: 1.0,
      driving_style: 1.0,
      road_conditions: 1.0,
      vehicle_load: 1.0,
      maintenance_quality: 1.0
    };

    // Temperature factor
    if (currentData.ambient_temp !== undefined) {
      if (currentData.ambient_temp < 5) factors.temperature = this.wearFactors.temperature.cold;
      else if (currentData.ambient_temp > 30) factors.temperature = this.wearFactors.temperature.hot;
    }

    // Driving style factor (based on throttle and speed patterns)
    if (currentData.throttle_pos > 70 && currentData.speed < 50) {
      factors.driving_style = this.wearFactors.driving_style.aggressive;
    } else if (currentData.throttle_pos < 30 && currentData.speed > 80) {
      factors.driving_style = this.wearFactors.driving_style.conservative;
    }

    // Road conditions (estimated from speed and load patterns)
    if (currentData.speed > 90 && currentData.engine_load < 60) {
      factors.road_conditions = this.wearFactors.road_conditions.highway;
    } else if (currentData.speed < 40 && currentData.engine_load > 70) {
      factors.road_conditions = this.wearFactors.road_conditions.city;
    }

    // Vehicle load factor
    if (currentData.vehicle_weight) {
      const weightRatio = currentData.vehicle_weight / vehicleInfo.curb_weight;
      if (weightRatio > 1.2) factors.vehicle_load = this.wearFactors.vehicle_load.heavy;
      else if (weightRatio < 0.9) factors.vehicle_load = this.wearFactors.vehicle_load.light;
    }

    // Maintenance quality factor (based on maintenance history regularity)
    if (historicalData && historicalData.length > 0) {
      const maintenanceRegularity = this.assessMaintenanceRegularity(historicalData);
      factors.maintenance_quality = maintenanceRegularity;
    }

    return factors;
  }

  /**
   * Assess maintenance regularity
   * @param {Array} historicalData - Historical maintenance data
   * @returns {number} Maintenance quality factor
   */
  assessMaintenanceRegularity(historicalData) {
    if (historicalData.length < 2) return 1.0;

    // Calculate average time between maintenance
    const dates = historicalData.map(d => new Date(d.date_performed)).sort((a, b) => a - b);
    const intervals = [];

    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24)); // days
    }

    const avgInterval = math.mean(intervals);
    const stdInterval = math.std(intervals);

    // Lower factor for more regular maintenance
    const regularity = Math.max(0.5, 1 - (stdInterval / avgInterval));

    if (regularity > 0.8) return this.wearFactors.maintenance_quality.excellent;
    else if (regularity > 0.6) return this.wearFactors.maintenance_quality.regular;
    else return this.wearFactors.maintenance_quality.poor;
  }

  /**
   * Calculate remaining lifespan
   * @param {string} component - Component name
   * @param {Object} currentUsage - Current usage
   * @param {Object} wearFactors - Wear factors
   * @returns {Object} Remaining lifespan
   */
  calculateRemainingLifespan(component, currentUsage, wearFactors) {
    const model = this.componentModels[component];

    // Calculate effective wear rate
    const wearMultiplier = Object.values(wearFactors).reduce((sum, factor) => sum + factor, 0) / Object.keys(wearFactors).length;
    const effectiveWearRate = model.wearRate * wearMultiplier;

    // Calculate remaining based on primary metric (distance or time)
    let remaining = 0;
    let unit = 'km';

    if (model.baselineLifespan) {
      // Distance-based calculation
      const expectedLifespan = model.baselineLifespan / effectiveWearRate;
      remaining = Math.max(0, expectedLifespan - currentUsage.distance);
    } else if (model.baselineMonths) {
      // Time-based calculation
      const expectedLifespanMonths = model.baselineMonths / effectiveWearRate;
      remaining = Math.max(0, expectedLifespanMonths - (currentUsage.time / 24 / 30)); // Convert hours to months
      unit = 'months';
    }

    // Apply usage severity
    remaining = remaining / currentUsage.severity;

    return {
      value: Math.round(remaining),
      unit: unit,
      percentage: Math.min(100, Math.max(0, (remaining / (model.baselineLifespan || model.baselineMonths * 1000)) * 100))
    };
  }

  /**
   * Assess risk level based on remaining lifespan and wear factors
   * @param {string} component - Component name
   * @param {Object} remainingLifespan - Remaining lifespan
   * @param {Object} wearFactors - Wear factors
   * @returns {Object} Risk assessment
   */
  assessRiskLevel(component, remainingLifespan, wearFactors) {
    let riskScore = 0;

    // Risk based on remaining lifespan
    if (remainingLifespan.percentage < 10) riskScore += 40;
    else if (remainingLifespan.percentage < 25) riskScore += 25;
    else if (remainingLifespan.percentage < 50) riskScore += 10;

    // Risk based on wear factors
    const avgWearFactor = Object.values(wearFactors).reduce((sum, factor) => sum + factor, 0) / Object.keys(wearFactors).length;
    if (avgWearFactor > 1.3) riskScore += 20;
    else if (avgWearFactor > 1.1) riskScore += 10;

    // Component-specific risk adjustments
    const model = this.componentModels[component];
    if (model.wearRate > 0.7) riskScore += 15; // High-wear components

    let riskLevel = 'low';
    let riskDescription = 'Low risk of failure';

    if (riskScore > 50) {
      riskLevel = 'critical';
      riskDescription = 'Critical risk - immediate attention required';
    } else if (riskScore > 30) {
      riskLevel = 'high';
      riskDescription = 'High risk - schedule maintenance soon';
    } else if (riskScore > 15) {
      riskLevel = 'medium';
      riskDescription = 'Medium risk - monitor closely';
    }

    return {
      level: riskLevel,
      score: riskScore,
      description: riskDescription
    };
  }

  /**
   * Generate recommendations based on lifespan and risk
   * @param {string} component - Component name
   * @param {Object} remainingLifespan - Remaining lifespan
   * @param {Object} riskAssessment - Risk assessment
   * @returns {Array} Recommendations
   */
  generateRecommendations(component, remainingLifespan, riskAssessment) {
    const recommendations = [];

    if (riskAssessment.level === 'critical') {
      recommendations.push({
        priority: 'immediate',
        action: `Replace ${component.replace('_', ' ')} immediately`,
        reason: 'Component has reached critical wear level'
      });
    } else if (riskAssessment.level === 'high') {
      recommendations.push({
        priority: 'high',
        action: `Schedule ${component.replace('_', ' ')} inspection within 1 week`,
        reason: 'Component showing signs of accelerated wear'
      });
    } else if (remainingLifespan.percentage < 30) {
      recommendations.push({
        priority: 'medium',
        action: `Plan ${component.replace('_', ' ')} replacement`,
        reason: 'Component approaching end of service life'
      });
    }

    // Add preventive recommendations
    if (remainingLifespan.percentage > 50) {
      recommendations.push({
        priority: 'low',
        action: `Continue regular monitoring of ${component.replace('_', ' ')}`,
        reason: 'Component in good condition'
      });
    }

    return recommendations;
  }

  /**
   * Calculate estimated replacement date
   * @param {string} component - Component name
   * @param {Object} remainingLifespan - Remaining lifespan
   * @returns {Date} Estimated replacement date
   */
  calculateReplacementDate(component, remainingLifespan) {
    const now = new Date();
    let daysToReplacement = 0;

    if (remainingLifespan.unit === 'km') {
      // Estimate daily distance (rough approximation)
      const avgDailyDistance = 50; // km per day
      daysToReplacement = remainingLifespan.value / avgDailyDistance;
    } else if (remainingLifespan.unit === 'months') {
      daysToReplacement = remainingLifespan.value * 30; // Convert months to days
    }

    const replacementDate = new Date(now.getTime() + (daysToReplacement * 24 * 60 * 60 * 1000));
    return replacementDate.toISOString().split('T')[0];
  }

  /**
   * Calculate confidence in estimation
   * @param {number} historicalDataPoints - Number of historical data points
   * @param {Object} wearFactors - Wear factors
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(historicalDataPoints, wearFactors) {
    let confidence = 0.5; // Base confidence

    // Increase confidence with more historical data
    if (historicalDataPoints > 100) confidence += 0.2;
    else if (historicalDataPoints > 50) confidence += 0.1;
    else if (historicalDataPoints > 10) confidence += 0.05;

    // Decrease confidence with high wear factor variability
    const wearFactorVariability = math.std(Object.values(wearFactors));
    if (wearFactorVariability > 0.3) confidence -= 0.1;

    return Math.max(0.1, Math.min(1.0, confidence));
  }

  /**
   * Get lifespan estimates for all components
   * @param {Object} currentData - Current vehicle data
   * @param {Array} historicalData - Historical data
   * @param {Object} vehicleInfo - Vehicle information
   * @returns {Array} Component lifespan estimates
   */
  estimateAllComponents(currentData, historicalData = [], vehicleInfo = {}) {
    const estimates = [];

    Object.keys(this.componentModels).forEach(component => {
      try {
        const estimate = this.estimateComponentLifespan(component, currentData, historicalData, vehicleInfo);
        estimates.push(estimate);
      } catch (error) {
        console.error(`Error estimating lifespan for ${component}:`, error);
      }
    });

    // Sort by risk level and remaining percentage
    return estimates.sort((a, b) => {
      const riskOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      const riskDiff = riskOrder[b.riskAssessment.level] - riskOrder[a.riskAssessment.level];
      if (riskDiff !== 0) return riskDiff;
      return a.remainingLifespan.percentage - b.remainingLifespan.percentage;
    });
  }

  /**
   * Get maintenance schedule based on component lifespans
   * @param {Array} lifespanEstimates - Component lifespan estimates
   * @returns {Object} Maintenance schedule
   */
  generateMaintenanceSchedule(lifespanEstimates) {
    const schedule = {
      immediate: [],
      thisWeek: [],
      thisMonth: [],
      thisQuarter: [],
      thisYear: []
    };

    const now = new Date();

    lifespanEstimates.forEach(estimate => {
      const replacementDate = new Date(estimate.estimatedReplacementDate);
      const daysUntilReplacement = (replacementDate - now) / (1000 * 60 * 60 * 24);

      if (estimate.riskAssessment.level === 'critical' || daysUntilReplacement < 7) {
        schedule.immediate.push(estimate);
      } else if (daysUntilReplacement < 30) {
        schedule.thisWeek.push(estimate);
      } else if (daysUntilReplacement < 90) {
        schedule.thisMonth.push(estimate);
      } else if (daysUntilReplacement < 365) {
        schedule.thisQuarter.push(estimate);
      } else {
        schedule.thisYear.push(estimate);
      }
    });

    return schedule;
  }
}

module.exports = ComponentLifespanEstimator;