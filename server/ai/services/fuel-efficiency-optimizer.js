class FuelEfficiencyOptimizer {
  constructor() {
    this.efficiencyFactors = this.initializeEfficiencyFactors();
    this.drivingPatterns = this.initializeDrivingPatterns();
    this.optimizationStrategies = this.initializeOptimizationStrategies();
  }

  /**
   * Initialize fuel efficiency factors
   * @returns {Object} Efficiency factors
   */
  initializeEfficiencyFactors() {
    return {
      // Vehicle condition factors
      tire_pressure: {
        optimal: 32, // PSI
        impact: 0.04, // 4% efficiency loss per 10 PSI below optimal
        description: 'Proper tire pressure reduces rolling resistance'
      },
      engine_oil: {
        viscosity: '5W-30',
        impact: 0.03,
        description: 'Correct oil viscosity reduces engine friction'
      },
      air_filter: {
        cleanliness: 'clean',
        impact: 0.02,
        description: 'Clean air filter ensures proper air-fuel mixture'
      },

      // Driving behavior factors
      speed: {
        optimal_range: [55, 65], // mph
        impact_per_mph: 0.02,
        description: 'Optimal speed range minimizes air resistance and engine load'
      },
      acceleration: {
        smooth_threshold: 2.0, // m/s²
        impact: 0.15,
        description: 'Smooth acceleration reduces fuel consumption'
      },
      braking: {
        regenerative_efficiency: 0.3,
        impact: 0.08,
        description: 'Smooth braking recovers energy and reduces stop-start cycles'
      },
      idling: {
        threshold: 30, // seconds
        impact_per_minute: 0.5,
        description: 'Minimize unnecessary idling'
      },

      // Environmental factors
      temperature: {
        optimal_range: [60, 80], // °F
        impact_per_10f: 0.02,
        description: 'Extreme temperatures affect engine efficiency'
      },
      altitude: {
        sea_level_efficiency: 1.0,
        impact_per_1000ft: 0.03,
        description: 'Higher altitude reduces air density'
      },
      wind: {
        headwind_threshold: 15, // mph
        impact: 0.05,
        description: 'Headwinds increase aerodynamic drag'
      },

      // Maintenance factors
      fuel_system: {
        injector_efficiency: 0.95,
        impact: 0.06,
        description: 'Clean fuel injectors ensure proper atomization'
      },
      ignition_system: {
        timing_accuracy: 0.98,
        impact: 0.04,
        description: 'Proper ignition timing maximizes combustion efficiency'
      }
    };
  }

  /**
   * Initialize driving pattern analysis
   * @returns {Object} Driving patterns
   */
  initializeDrivingPatterns() {
    return {
      city: {
        characteristics: {
          speed: { avg: 25, std: 15 },
          acceleration: { avg: 1.2, std: 0.8 },
          braking: { frequency: 0.8, severity: 2.1 },
          idling: { percentage: 35 }
        },
        efficiency_multiplier: 0.75
      },
      highway: {
        characteristics: {
          speed: { avg: 65, std: 8 },
          acceleration: { avg: 0.5, std: 0.3 },
          braking: { frequency: 0.2, severity: 1.8 },
          idling: { percentage: 5 }
        },
        efficiency_multiplier: 1.0
      },
      mixed: {
        characteristics: {
          speed: { avg: 45, std: 20 },
          acceleration: { avg: 0.8, std: 0.5 },
          braking: { frequency: 0.5, severity: 2.0 },
          idling: { percentage: 20 }
        },
        efficiency_multiplier: 0.85
      }
    };
  }

  /**
   * Initialize optimization strategies
   * @returns {Object} Optimization strategies
   */
  initializeOptimizationStrategies() {
    return {
      immediate: [
        {
          id: 'tire_pressure_check',
          title: 'Check Tire Pressure',
          description: 'Ensure all tires are inflated to manufacturer recommended pressure',
          potential_savings: '3-5%',
          difficulty: 'easy',
          time_required: '5 minutes',
          cost: 0
        },
        {
          id: 'remove_excess_weight',
          title: 'Remove Excess Weight',
          description: 'Remove unnecessary items from vehicle to reduce load',
          potential_savings: '1-2%',
          difficulty: 'easy',
          time_required: '10 minutes',
          cost: 0
        },
        {
          id: 'smooth_driving',
          title: 'Practice Smooth Driving',
          description: 'Avoid rapid acceleration and hard braking',
          potential_savings: '10-15%',
          difficulty: 'medium',
          time_required: 'ongoing',
          cost: 0
        }
      ],
      short_term: [
        {
          id: 'air_filter_replacement',
          title: 'Replace Air Filter',
          description: 'Install new engine air filter for better air flow',
          potential_savings: '2-4%',
          difficulty: 'easy',
          time_required: '15 minutes',
          cost: 25
        },
        {
          id: 'fuel_injector_cleaning',
          title: 'Clean Fuel Injectors',
          description: 'Professional fuel injector cleaning service',
          potential_savings: '4-6%',
          difficulty: 'medium',
          time_required: '1 hour',
          cost: 80
        },
        {
          id: 'oil_change',
          title: 'Oil Change with Correct Viscosity',
          description: 'Use manufacturer recommended oil viscosity',
          potential_savings: '1-3%',
          difficulty: 'easy',
          time_required: '30 minutes',
          cost: 45
        }
      ],
      long_term: [
        {
          id: 'engine_tune_up',
          title: 'Complete Engine Tune-up',
          description: 'Replace spark plugs, wires, and perform ignition timing check',
          potential_savings: '5-8%',
          difficulty: 'hard',
          time_required: '2 hours',
          cost: 200
        },
        {
          id: 'aerodynamic_modifications',
          title: 'Aerodynamic Improvements',
          description: 'Add wheel covers, remove roof racks when not in use',
          potential_savings: '2-3%',
          difficulty: 'easy',
          time_required: '10 minutes',
          cost: 0
        },
        {
          id: 'tire_upgrade',
          title: 'Upgrade to Low Rolling Resistance Tires',
          description: 'Install tires designed for better fuel efficiency',
          potential_savings: '3-5%',
          difficulty: 'medium',
          time_required: '1 hour',
          cost: 600
        }
      ]
    };
  }

  /**
   * Analyze current fuel efficiency
   * @param {Array} fuelData - Historical fuel economy data
   * @param {Array} sensorData - Current sensor readings
   * @returns {Object} Fuel efficiency analysis
   */
  analyzeFuelEfficiency(fuelData, sensorData) {
    const analysis = {
      current_efficiency: this.calculateCurrentEfficiency(fuelData),
      driving_pattern: this.identifyDrivingPattern(sensorData),
      efficiency_factors: this.analyzeEfficiencyFactors(sensorData),
      potential_improvements: [],
      recommendations: [],
      projected_savings: {}
    };

    // Calculate potential improvements
    analysis.potential_improvements = this.calculatePotentialImprovements(analysis.efficiency_factors);

    // Generate recommendations
    analysis.recommendations = this.generateEfficiencyRecommendations(analysis);

    // Calculate projected savings
    analysis.projected_savings = this.calculateProjectedSavings(analysis.potential_improvements);

    return analysis;
  }

  /**
   * Calculate current fuel efficiency
   * @param {Array} fuelData - Fuel economy data
   * @returns {Object} Current efficiency metrics
   */
  calculateCurrentEfficiency(fuelData) {
    if (!fuelData || fuelData.length === 0) {
      return {
        instant_mpg: 0,
        average_mpg: 0,
        range: 0,
        trend: 'unknown'
      };
    }

    const recentData = fuelData.slice(-20); // Last 20 readings

    const instant_mpg = recentData.reduce((sum, d) => sum + (d.instant_mpg || 0), 0) / recentData.length;
    const average_mpg = recentData.reduce((sum, d) => sum + (d.average_mpg || 0), 0) / recentData.length;
    const range = recentData.reduce((sum, d) => sum + (d.range_remaining || 0), 0) / recentData.length;

    // Calculate trend
    const firstHalf = recentData.slice(0, 10);
    const secondHalf = recentData.slice(10);

    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + (d.instant_mpg || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + (d.instant_mpg || 0), 0) / secondHalf.length;

    let trend = 'stable';
    if (secondHalfAvg > firstHalfAvg * 1.05) trend = 'improving';
    else if (secondHalfAvg < firstHalfAvg * 0.95) trend = 'declining';

    return {
      instant_mpg: Math.round(instant_mpg * 10) / 10,
      average_mpg: Math.round(average_mpg * 10) / 10,
      range: Math.round(range),
      trend: trend
    };
  }

  /**
   * Identify driving pattern
   * @param {Array} sensorData - Sensor data
   * @returns {string} Driving pattern type
   */
  identifyDrivingPattern(sensorData) {
    if (!sensorData || sensorData.length === 0) return 'unknown';

    const recentData = sensorData.slice(-50);

    const avgSpeed = recentData.reduce((sum, d) => sum + (d.speed || 0), 0) / recentData.length;
    const speedVariability = this.calculateStandardDeviation(recentData.map(d => d.speed || 0));
    const idlingTime = recentData.filter(d => (d.speed || 0) < 5).length / recentData.length;

    // Classify driving pattern
    if (avgSpeed < 30 && speedVariability > 12 && idlingTime > 0.3) {
      return 'city';
    } else if (avgSpeed > 55 && speedVariability < 10 && idlingTime < 0.1) {
      return 'highway';
    } else {
      return 'mixed';
    }
  }

  /**
   * Analyze efficiency factors
   * @param {Array} sensorData - Sensor data
   * @returns {Object} Efficiency factors analysis
   */
  analyzeEfficiencyFactors(sensorData) {
    if (!sensorData || sensorData.length === 0) {
      return {};
    }

    const recentData = sensorData.slice(-20);
    const factors = {};

    // Speed efficiency
    const avgSpeed = recentData.reduce((sum, d) => sum + (d.speed || 0), 0) / recentData.length;
    const speedFactor = this.efficiencyFactors.speed;
    const speedDeviation = Math.abs(avgSpeed - ((speedFactor.optimal_range[0] + speedFactor.optimal_range[1]) / 2));
    factors.speed_efficiency = {
      current: avgSpeed,
      optimal: speedFactor.optimal_range,
      deviation: speedDeviation,
      impact: Math.min(speedDeviation * speedFactor.impact_per_mph, 0.2),
      recommendation: speedDeviation > 5 ? 'Adjust cruising speed to optimal range' : null
    };

    // Acceleration efficiency
    const accelerations = [];
    for (let i = 1; i < recentData.length; i++) {
      const dt = 2; // 2 seconds between readings
      const dv = recentData[i].speed - recentData[i-1].speed;
      accelerations.push(dv / dt);
    }
    const avgAcceleration = accelerations.reduce((sum, a) => sum + Math.abs(a), 0) / accelerations.length;
    const accelFactor = this.efficiencyFactors.acceleration;
    factors.acceleration_efficiency = {
      current: avgAcceleration,
      optimal: accelFactor.smooth_threshold,
      impact: avgAcceleration > accelFactor.smooth_threshold ? accelFactor.impact : 0,
      recommendation: avgAcceleration > accelFactor.smooth_threshold ? 'Practice smoother acceleration' : null
    };

    // Engine load efficiency
    const avgLoad = recentData.reduce((sum, d) => sum + (d.engine_load || 0), 0) / recentData.length;
    factors.engine_load_efficiency = {
      current: avgLoad,
      optimal: 60, // 60% is generally optimal
      impact: avgLoad > 80 ? 0.1 : 0,
      recommendation: avgLoad > 80 ? 'Reduce engine load through smoother driving' : null
    };

    // Temperature efficiency
    const avgTemp = recentData.reduce((sum, d) => sum + (d.coolant_temp || 0), 0) / recentData.length;
    const tempFactor = this.efficiencyFactors.temperature;
    const tempDeviation = Math.abs(avgTemp - ((tempFactor.optimal_range[0] + tempFactor.optimal_range[1]) / 2));
    factors.temperature_efficiency = {
      current: avgTemp,
      optimal: tempFactor.optimal_range,
      deviation: tempDeviation,
      impact: (tempDeviation / 10) * tempFactor.impact_per_10f,
      recommendation: tempDeviation > 15 ? 'Allow engine to reach optimal operating temperature' : null
    };

    return factors;
  }

  /**
   * Calculate potential improvements
   * @param {Object} efficiencyFactors - Analyzed efficiency factors
   * @returns {Array} Potential improvements
   */
  calculatePotentialImprovements(efficiencyFactors) {
    const improvements = [];

    Object.entries(efficiencyFactors).forEach(([factor, data]) => {
      if (data.impact > 0.01) { // Only include factors with meaningful impact
        improvements.push({
          factor: factor,
          current_impact: data.impact,
          potential_savings: data.impact * 0.8, // Assume 80% of impact can be mitigated
          recommendation: data.recommendation,
          priority: data.impact > 0.1 ? 'high' : data.impact > 0.05 ? 'medium' : 'low'
        });
      }
    });

    return improvements.sort((a, b) => b.potential_savings - a.potential_savings);
  }

  /**
   * Generate efficiency recommendations
   * @param {Object} analysis - Fuel efficiency analysis
   * @returns {Array} Recommendations
   */
  generateEfficiencyRecommendations(analysis) {
    const recommendations = [];

    // Add immediate recommendations
    recommendations.push(...this.optimizationStrategies.immediate);

    // Add pattern-specific recommendations
    const patternRecs = this.getPatternSpecificRecommendations(analysis.driving_pattern);
    recommendations.push(...patternRecs);

    // Add factor-specific recommendations
    const factorRecs = this.getFactorSpecificRecommendations(analysis.efficiency_factors);
    recommendations.push(...factorRecs);

    // Add maintenance recommendations
    recommendations.push(...this.optimizationStrategies.short_term);

    // Remove duplicates and sort by potential impact
    const uniqueRecs = this.removeDuplicateRecommendations(recommendations);
    return uniqueRecs.sort((a, b) => this.getRecommendationPriority(a) - this.getRecommendationPriority(b));
  }

  /**
   * Get pattern-specific recommendations
   * @param {string} pattern - Driving pattern
   * @returns {Array} Pattern-specific recommendations
   */
  getPatternSpecificRecommendations(pattern) {
    const recommendations = [];

    switch (pattern) {
      case 'city':
        recommendations.push({
          id: 'city_driving_optimization',
          title: 'City Driving Optimization',
          description: 'Use higher gears when possible, anticipate traffic flow',
          potential_savings: '8-12%',
          difficulty: 'medium',
          time_required: 'ongoing',
          cost: 0
        });
        break;

      case 'highway':
        recommendations.push({
          id: 'highway_speed_optimization',
          title: 'Highway Speed Optimization',
          description: 'Maintain optimal cruising speed, use cruise control',
          potential_savings: '5-8%',
          difficulty: 'easy',
          time_required: 'ongoing',
          cost: 0
        });
        break;

      case 'mixed':
        recommendations.push({
          id: 'adaptive_driving',
          title: 'Adaptive Driving Style',
          description: 'Adjust driving style based on road conditions',
          potential_savings: '6-10%',
          difficulty: 'medium',
          time_required: 'ongoing',
          cost: 0
        });
        break;
    }

    return recommendations;
  }

  /**
   * Get factor-specific recommendations
   * @param {Object} factors - Efficiency factors
   * @returns {Array} Factor-specific recommendations
   */
  getFactorSpecificRecommendations(factors) {
    const recommendations = [];

    if (factors.speed_efficiency?.impact > 0.05) {
      recommendations.push({
        id: 'speed_optimization',
        title: 'Speed Optimization',
        description: 'Maintain speed in optimal range for best efficiency',
        potential_savings: '4-7%',
        difficulty: 'easy',
        time_required: 'ongoing',
        cost: 0
      });
    }

    if (factors.acceleration_efficiency?.impact > 0.05) {
      recommendations.push({
        id: 'acceleration_smoothing',
        title: 'Smooth Acceleration',
        description: 'Gradually accelerate to reduce fuel consumption',
        potential_savings: '5-10%',
        difficulty: 'medium',
        time_required: 'ongoing',
        cost: 0
      });
    }

    if (factors.temperature_efficiency?.impact > 0.03) {
      recommendations.push({
        id: 'engine_warm_up',
        title: 'Proper Engine Warm-up',
        description: 'Allow engine to reach optimal temperature before driving',
        potential_savings: '2-4%',
        difficulty: 'easy',
        time_required: '5 minutes',
        cost: 0
      });
    }

    return recommendations;
  }

  /**
   * Calculate projected savings
   * @param {Array} improvements - Potential improvements
   * @returns {Object} Projected savings
   */
  calculateProjectedSavings(improvements) {
    const totalPotentialSavings = improvements.reduce((sum, imp) => sum + imp.potential_savings, 0);

    // Assume average annual mileage of 12,000 miles and $3.50/gallon fuel cost
    const annualMiles = 12000;
    const fuelCostPerGallon = 3.50;
    const baselineMPG = 25; // Assumed baseline

    const annualFuelSavings = (annualMiles / baselineMPG) * totalPotentialSavings;
    const annualCostSavings = annualFuelSavings * fuelCostPerGallon;

    return {
      percentage_improvement: Math.round(totalPotentialSavings * 1000) / 10, // to 1 decimal
      annual_fuel_savings_gallons: Math.round(annualFuelSavings),
      annual_cost_savings: Math.round(annualCostSavings),
      monthly_cost_savings: Math.round(annualCostSavings / 12),
      payback_period_months: 'Varies by implementation cost'
    };
  }

  /**
   * Remove duplicate recommendations
   * @param {Array} recommendations - All recommendations
   * @returns {Array} Unique recommendations
   */
  removeDuplicateRecommendations(recommendations) {
    const seen = new Set();
    return recommendations.filter(rec => {
      const key = rec.id || rec.title;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Get recommendation priority score
   * @param {Object} recommendation - Recommendation object
   * @returns {number} Priority score
   */
  getRecommendationPriority(recommendation) {
    let score = 0;

    // Difficulty factor
    switch (recommendation.difficulty) {
      case 'easy': score += 10; break;
      case 'medium': score += 5; break;
      case 'hard': score += 1; break;
    }

    // Cost factor (lower cost = higher priority)
    if (recommendation.cost === 0) score += 10;
    else if (recommendation.cost < 50) score += 5;
    else if (recommendation.cost < 100) score += 2;

    // Time factor
    if (recommendation.time_required === 'ongoing') score += 5;
    else if (recommendation.time_required.includes('minutes')) score += 8;
    else if (recommendation.time_required.includes('hour')) score += 3;

    return score;
  }

  /**
   * Calculate standard deviation
   * @param {Array} values - Array of values
   * @returns {number} Standard deviation
   */
  calculateStandardDeviation(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, sq) => sum + sq, 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * Generate eco-driving score
   * @param {Array} sensorData - Sensor data
   * @returns {Object} Eco-driving score and tips
   */
  generateEcoDrivingScore(sensorData) {
    if (!sensorData || sensorData.length === 0) {
      return {
        score: 0,
        grade: 'N/A',
        tips: ['Insufficient data for eco-driving analysis']
      };
    }

    const recentData = sensorData.slice(-30); // Last 30 readings (1 minute)
    let score = 100;

    // Speed efficiency (30% weight)
    const avgSpeed = recentData.reduce((sum, d) => sum + (d.speed || 0), 0) / recentData.length;
    const optimalSpeed = 60; // mph
    const speedDeviation = Math.abs(avgSpeed - optimalSpeed) / optimalSpeed;
    score -= speedDeviation * 30;

    // Acceleration smoothness (25% weight)
    const accelerations = [];
    for (let i = 1; i < recentData.length; i++) {
      const dt = 2; // 2 seconds
      const dv = recentData[i].speed - recentData[i-1].speed;
      accelerations.push(Math.abs(dv / dt));
    }
    const avgAccel = accelerations.reduce((sum, a) => sum + a, 0) / accelerations.length;
    const accelPenalty = Math.min(avgAccel / 2, 1) * 25;
    score -= accelPenalty;

    // Engine load efficiency (20% weight)
    const avgLoad = recentData.reduce((sum, d) => sum + (d.engine_load || 0), 0) / recentData.length;
    const loadPenalty = Math.max(0, (avgLoad - 70) / 30) * 20;
    score -= loadPenalty;

    // Idling reduction (15% weight)
    const idlingCount = recentData.filter(d => (d.speed || 0) < 2).length;
    const idlingPercentage = idlingCount / recentData.length;
    const idlingPenalty = idlingPercentage * 15;
    score -= idlingPenalty;

    // Throttle efficiency (10% weight)
    const avgThrottle = recentData.reduce((sum, d) => sum + (d.throttle_pos || 0), 0) / recentData.length;
    const throttlePenalty = Math.min(avgThrottle / 10, 1) * 10;
    score -= throttlePenalty;

    score = Math.max(0, Math.min(100, score));

    let grade = 'F';
    if (score >= 90) grade = 'A';
    else if (score >= 80) grade = 'B';
    else if (score >= 70) grade = 'C';
    else if (score >= 60) grade = 'D';

    const tips = this.generateEcoDrivingTips(score, avgSpeed, avgAccel, avgLoad, idlingPercentage);

    return {
      score: Math.round(score),
      grade: grade,
      tips: tips,
      breakdown: {
        speed_efficiency: Math.round(30 - speedDeviation * 30),
        acceleration_smoothness: Math.round(25 - accelPenalty),
        engine_load_efficiency: Math.round(20 - loadPenalty),
        idling_reduction: Math.round(15 - idlingPenalty),
        throttle_efficiency: Math.round(10 - throttlePenalty)
      }
    };
  }

  /**
   * Generate eco-driving tips
   * @param {number} score - Eco-driving score
   * @param {number} avgSpeed - Average speed
   * @param {number} avgAccel - Average acceleration
   * @param {number} avgLoad - Average engine load
   * @param {number} idlingPercentage - Idling percentage
   * @returns {Array} Eco-driving tips
   */
  generateEcoDrivingTips(score, avgSpeed, avgAccel, avgLoad, idlingPercentage) {
    const tips = [];

    if (avgSpeed > 70) {
      tips.push('Reduce cruising speed to 55-65 mph for optimal fuel efficiency');
    } else if (avgSpeed < 50) {
      tips.push('Increase speed gradually when safe to do so');
    }

    if (avgAccel > 1.5) {
      tips.push('Accelerate more gradually to improve fuel economy');
    }

    if (avgLoad > 75) {
      tips.push('Reduce engine load by maintaining steady speeds');
    }

    if (idlingPercentage > 0.2) {
      tips.push('Turn off engine when stopped for more than 30 seconds');
    }

    if (score < 70) {
      tips.push('Consider taking an eco-driving course to learn fuel-saving techniques');
    }

    if (tips.length === 0) {
      tips.push('Great job! Your driving is already fuel-efficient');
    }

    return tips;
  }

  /**
   * Get description for driving pattern
   * @param {string} pattern - Driving pattern
   * @returns {string} Pattern description
   */
  getPatternDescription(pattern) {
    const descriptions = {
      city: 'City driving involves frequent stops, lower average speeds, and higher idling time. This pattern typically results in lower fuel efficiency due to constant acceleration and deceleration.',
      highway: 'Highway driving involves steady speeds, longer distances, and minimal stops. This pattern generally provides the best fuel efficiency.',
      mixed: 'Mixed driving combines city and highway elements with moderate speeds and varying traffic conditions. Fuel efficiency falls between city and highway patterns.',
      unknown: 'Unable to determine driving pattern from available data.'
    };

    return descriptions[pattern] || descriptions.unknown;
  }
}

module.exports = FuelEfficiencyOptimizer;