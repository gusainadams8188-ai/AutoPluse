class MaintenancePerformanceAnalyzer {
  constructor() {
    this.performanceMetrics = this.initializePerformanceMetrics();
    this.maintenanceImpactFactors = this.initializeMaintenanceImpactFactors();
    this.baselinePerformance = {};
  }

  /**
   * Initialize performance metrics tracking
   * @returns {Object} Performance metrics configuration
   */
  initializePerformanceMetrics() {
    return {
      fuel_efficiency: {
        metrics: ['instant_mpg', 'average_mpg', 'fuel_consumed'],
        baseline_period_days: 30,
        improvement_threshold: 0.05 // 5% improvement
      },
      engine_performance: {
        metrics: ['rpm', 'engine_load', 'throttle_pos', 'intake_manifold_pressure'],
        baseline_period_days: 7,
        improvement_threshold: 0.03
      },
      acceleration: {
        metrics: ['speed', 'throttle_pos', 'engine_load'],
        baseline_period_days: 14,
        improvement_threshold: 0.08
      },
      braking: {
        metrics: ['speed', 'engine_load'],
        baseline_period_days: 14,
        improvement_threshold: 0.05
      },
      overall_health: {
        metrics: ['coolant_temp', 'fuel_pressure', 'intake_air_temp'],
        baseline_period_days: 30,
        improvement_threshold: 0.02
      }
    };
  }

  /**
   * Initialize maintenance impact factors
   * @returns {Object} Maintenance impact factors
   */
  initializeMaintenanceImpactFactors() {
    return {
      // Engine maintenance
      oil_change: {
        performance_impact: {
          fuel_efficiency: 0.04, // 4% improvement
          engine_performance: 0.06,
          acceleration: 0.03,
          overall_health: 0.05
        },
        duration_days: 30, // Impact lasts 30 days
        cost_benefit_ratio: 15, // $15 benefit per $1 spent
        risk_reduction: 0.3 // 30% reduction in breakdown risk
      },
      air_filter_replacement: {
        performance_impact: {
          fuel_efficiency: 0.03,
          engine_performance: 0.04,
          acceleration: 0.02,
          overall_health: 0.02
        },
        duration_days: 45,
        cost_benefit_ratio: 20,
        risk_reduction: 0.15
      },
      fuel_filter_replacement: {
        performance_impact: {
          fuel_efficiency: 0.05,
          engine_performance: 0.07,
          acceleration: 0.04,
          overall_health: 0.06
        },
        duration_days: 60,
        cost_benefit_ratio: 12,
        risk_reduction: 0.25
      },
      spark_plug_replacement: {
        performance_impact: {
          fuel_efficiency: 0.06,
          engine_performance: 0.08,
          acceleration: 0.05,
          overall_health: 0.04
        },
        duration_days: 90,
        cost_benefit_ratio: 18,
        risk_reduction: 0.4
      },

      // Transmission maintenance
      transmission_fluid_change: {
        performance_impact: {
          fuel_efficiency: 0.02,
          engine_performance: 0.03,
          acceleration: 0.08,
          overall_health: 0.04
        },
        duration_days: 60,
        cost_benefit_ratio: 10,
        risk_reduction: 0.35
      },

      // Brake maintenance
      brake_pad_replacement: {
        performance_impact: {
          fuel_efficiency: 0.01,
          engine_performance: 0.02,
          acceleration: 0.03,
          braking: 0.25,
          overall_health: 0.02
        },
        duration_days: 30,
        cost_benefit_ratio: 8,
        risk_reduction: 0.6
      },

      // Cooling system maintenance
      coolant_flush: {
        performance_impact: {
          fuel_efficiency: 0.02,
          engine_performance: 0.05,
          acceleration: 0.02,
          overall_health: 0.08
        },
        duration_days: 45,
        cost_benefit_ratio: 14,
        risk_reduction: 0.45
      },

      // Battery maintenance
      battery_replacement: {
        performance_impact: {
          fuel_efficiency: 0.01,
          engine_performance: 0.03,
          acceleration: 0.04,
          overall_health: 0.06
        },
        duration_days: 120,
        cost_benefit_ratio: 6,
        risk_reduction: 0.5
      },

      // Tire maintenance
      tire_rotation: {
        performance_impact: {
          fuel_efficiency: 0.02,
          acceleration: 0.03,
          braking: 0.08,
          overall_health: 0.01
        },
        duration_days: 20,
        cost_benefit_ratio: 25,
        risk_reduction: 0.1
      },
      tire_replacement: {
        performance_impact: {
          fuel_efficiency: 0.04,
          acceleration: 0.06,
          braking: 0.15,
          overall_health: 0.03
        },
        duration_days: 60,
        cost_benefit_ratio: 8,
        risk_reduction: 0.2
      }
    };
  }

  /**
   * Analyze maintenance impact on performance
   * @param {Array} maintenanceHistory - Maintenance history
   * @param {Array} performanceData - Performance data before/after maintenance
   * @param {string} maintenanceType - Type of maintenance to analyze
   * @returns {Object} Maintenance impact analysis
   */
  analyzeMaintenanceImpact(maintenanceHistory, performanceData, maintenanceType = null) {
    const analysis = {
      overall_impact: {},
      maintenance_effectiveness: {},
      cost_benefit_analysis: {},
      recommendations: [],
      performance_trends: {}
    };

    if (!maintenanceHistory || maintenanceHistory.length === 0) {
      return {
        status: 'no_data',
        message: 'No maintenance history available for analysis',
        analysis: analysis
      };
    }

    // Analyze each maintenance event
    const maintenanceEvents = maintenanceType
      ? maintenanceHistory.filter(m => m.service_type.toLowerCase().includes(maintenanceType.toLowerCase()))
      : maintenanceHistory;

    if (maintenanceEvents.length === 0) {
      return {
        status: 'no_matching_maintenance',
        message: `No maintenance events found for type: ${maintenanceType}`,
        analysis: analysis
      };
    }

    // Calculate baseline performance
    this.calculateBaselinePerformance(performanceData);

    // Analyze impact of each maintenance event
    const impactResults = maintenanceEvents.map(maintenance =>
      this.analyzeSingleMaintenanceImpact(maintenance, performanceData)
    );

    // Aggregate results
    analysis.overall_impact = this.aggregateImpactResults(impactResults);
    analysis.maintenance_effectiveness = this.calculateMaintenanceEffectiveness(impactResults);
    analysis.cost_benefit_analysis = this.performCostBenefitAnalysis(impactResults);
    analysis.performance_trends = this.analyzePerformanceTrends(performanceData, maintenanceEvents);
    analysis.recommendations = this.generateMaintenanceRecommendations(analysis);

    return {
      status: 'success',
      maintenance_events_analyzed: maintenanceEvents.length,
      analysis_period: this.calculateAnalysisPeriod(maintenanceEvents),
      analysis: analysis
    };
  }

  /**
   * Analyze impact of a single maintenance event
   * @param {Object} maintenance - Maintenance event
   * @param {Array} performanceData - Performance data
   * @returns {Object} Impact analysis for single event
   */
  analyzeSingleMaintenanceImpact(maintenance, performanceData) {
    const maintenanceDate = new Date(maintenance.date_performed);
    const impactFactors = this.maintenanceImpactFactors[maintenance.service_type.toLowerCase().replace(/\s+/g, '_')];

    if (!impactFactors) {
      return {
        maintenance: maintenance,
        impact_found: false,
        reason: 'No impact factors defined for this maintenance type'
      };
    }

    // Split performance data into before and after maintenance
    const beforeData = performanceData.filter(d =>
      new Date(d.timestamp) < maintenanceDate &&
      (maintenanceDate - new Date(d.timestamp)) < (30 * 24 * 60 * 60 * 1000) // Within 30 days before
    );

    const afterData = performanceData.filter(d =>
      new Date(d.timestamp) > maintenanceDate &&
      (new Date(d.timestamp) - maintenanceDate) < (impactFactors.duration_days * 24 * 60 * 60 * 1000)
    );

    if (beforeData.length < 10 || afterData.length < 10) {
      return {
        maintenance: maintenance,
        impact_found: false,
        reason: 'Insufficient data for before/after comparison'
      };
    }

    // Calculate performance improvements
    const improvements = {};
    Object.keys(impactFactors.performance_impact).forEach(metric => {
      const beforeAvg = this.calculateAverage(beforeData, this.performanceMetrics[metric]?.metrics || [metric]);
      const afterAvg = this.calculateAverage(afterData, this.performanceMetrics[metric]?.metrics || [metric]);

      if (beforeAvg > 0) {
        const improvement = (afterAvg - beforeAvg) / beforeAvg;
        improvements[metric] = {
          before: beforeAvg,
          after: afterAvg,
          improvement: improvement,
          expected: impactFactors.performance_impact[metric],
          achieved_percentage: (improvement / impactFactors.performance_impact[metric]) * 100
        };
      }
    });

    return {
      maintenance: maintenance,
      impact_found: true,
      improvements: improvements,
      effectiveness_score: this.calculateEffectivenessScore(improvements, impactFactors),
      cost_benefit: this.calculateCostBenefit(maintenance, improvements, impactFactors),
      duration_observed: afterData.length * 2 / 60 / 24, // Convert data points to days
      data_points: {
        before: beforeData.length,
        after: afterData.length
      }
    };
  }

  /**
   * Calculate baseline performance metrics
   * @param {Array} performanceData - Performance data
   */
  calculateBaselinePerformance(performanceData) {
    if (!performanceData || performanceData.length === 0) return;

    // Calculate baseline for each performance metric
    Object.keys(this.performanceMetrics).forEach(metricKey => {
      const metrics = this.performanceMetrics[metricKey].metrics;
      const baselinePeriod = this.performanceMetrics[metricKey].baseline_period_days;

      // Get data from the earliest period
      const earliestDate = new Date(Math.min(...performanceData.map(d => new Date(d.timestamp))));
      const baselineEndDate = new Date(earliestDate.getTime() + (baselinePeriod * 24 * 60 * 60 * 1000));

      const baselineData = performanceData.filter(d =>
        new Date(d.timestamp) <= baselineEndDate
      );

      if (baselineData.length > 0) {
        this.baselinePerformance[metricKey] = this.calculateAverage(baselineData, metrics);
      }
    });
  }

  /**
   * Calculate average value for given metrics
   * @param {Array} data - Data array
   * @param {Array} metrics - Metrics to average
   * @returns {number} Average value
   */
  calculateAverage(data, metrics) {
    if (!data || data.length === 0) return 0;

    let total = 0;
    let count = 0;

    data.forEach(point => {
      metrics.forEach(metric => {
        if (point[metric] !== undefined && point[metric] !== null && !isNaN(point[metric])) {
          total += point[metric];
          count++;
        }
      });
    });

    return count > 0 ? total / count : 0;
  }

  /**
   * Calculate effectiveness score for maintenance
   * @param {Object} improvements - Performance improvements
   * @param {Object} impactFactors - Expected impact factors
   * @returns {number} Effectiveness score (0-100)
   */
  calculateEffectivenessScore(improvements, impactFactors) {
    if (!improvements || Object.keys(improvements).length === 0) return 0;

    let totalScore = 0;
    let totalWeight = 0;

    Object.entries(improvements).forEach(([metric, data]) => {
      const expected = impactFactors.performance_impact[metric];
      if (expected && expected > 0) {
        const achieved = Math.max(0, data.improvement);
        const score = Math.min(100, (achieved / expected) * 100);
        totalScore += score;
        totalWeight++;
      }
    });

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Calculate cost-benefit analysis
   * @param {Object} maintenance - Maintenance event
   * @param {Object} improvements - Performance improvements
   * @param {Object} impactFactors - Impact factors
   * @returns {Object} Cost-benefit analysis
   */
  calculateCostBenefit(maintenance, improvements, impactFactors) {
    const cost = maintenance.cost || 0;
    const durationYears = impactFactors.duration_days / 365;

    // Calculate annual benefit based on fuel savings
    const fuelSavingsPerYear = this.calculateFuelSavings(improvements, durationYears);
    const annualBenefit = fuelSavingsPerYear * 3.50; // $3.50 per gallon

    const benefitCostRatio = cost > 0 ? annualBenefit / cost : 0;
    const paybackPeriodMonths = annualBenefit > 0 ? (cost / annualBenefit) * 12 : 0;

    return {
      maintenance_cost: cost,
      annual_benefit: annualBenefit,
      benefit_cost_ratio: benefitCostRatio,
      payback_period_months: paybackPeriodMonths,
      net_present_value: this.calculateNPV(cost, annualBenefit, durationYears)
    };
  }

  /**
   * Calculate fuel savings from improvements
   * @param {Object} improvements - Performance improvements
   * @param {number} durationYears - Duration in years
   * @returns {number} Fuel savings per year (gallons)
   */
  calculateFuelSavings(improvements, durationYears) {
    const fuelEfficiencyImprovement = improvements.fuel_efficiency?.improvement || 0;
    const annualMiles = 12000; // Assumed annual mileage
    const baselineMPG = 25; // Assumed baseline MPG

    const gallonsSavedPerYear = (annualMiles / baselineMPG) * fuelEfficiencyImprovement;
    return Math.max(0, gallonsSavedPerYear);
  }

  /**
   * Calculate Net Present Value
   * @param {number} cost - Initial cost
   * @param {number} annualBenefit - Annual benefit
   * @param {number} durationYears - Duration in years
   * @returns {number} NPV
   */
  calculateNPV(cost, annualBenefit, durationYears) {
    const discountRate = 0.08; // 8% discount rate
    let npv = -cost;

    for (let year = 1; year <= durationYears; year++) {
      npv += annualBenefit / Math.pow(1 + discountRate, year);
    }

    return npv;
  }

  /**
   * Aggregate impact results from multiple maintenance events
   * @param {Array} impactResults - Individual impact results
   * @returns {Object} Aggregated impact
   */
  aggregateImpactResults(impactResults) {
    const validResults = impactResults.filter(r => r.impact_found);

    if (validResults.length === 0) {
      return {
        status: 'no_valid_results',
        message: 'No valid impact results to aggregate'
      };
    }

    const aggregated = {
      total_maintenance_events: validResults.length,
      average_effectiveness: 0,
      total_cost: 0,
      total_benefit: 0,
      net_savings: 0,
      performance_improvements: {}
    };

    // Aggregate metrics
    validResults.forEach(result => {
      aggregated.average_effectiveness += result.effectiveness_score || 0;
      aggregated.total_cost += result.cost_benefit?.maintenance_cost || 0;
      aggregated.total_benefit += result.cost_benefit?.annual_benefit || 0;

      // Aggregate performance improvements
      if (result.improvements) {
        Object.entries(result.improvements).forEach(([metric, data]) => {
          if (!aggregated.performance_improvements[metric]) {
            aggregated.performance_improvements[metric] = {
              total_improvement: 0,
              count: 0,
              average_improvement: 0
            };
          }

          aggregated.performance_improvements[metric].total_improvement += data.improvement || 0;
          aggregated.performance_improvements[metric].count++;
        });
      }
    });

    // Calculate averages
    aggregated.average_effectiveness /= validResults.length;
    aggregated.net_savings = aggregated.total_benefit - aggregated.total_cost;

    Object.keys(aggregated.performance_improvements).forEach(metric => {
      const data = aggregated.performance_improvements[metric];
      data.average_improvement = data.total_improvement / data.count;
    });

    return aggregated;
  }

  /**
   * Calculate maintenance effectiveness across all events
   * @param {Array} impactResults - Impact results
   * @returns {Object} Effectiveness analysis
   */
  calculateMaintenanceEffectiveness(impactResults) {
    const validResults = impactResults.filter(r => r.impact_found);

    const effectiveness = {
      overall_score: 0,
      by_maintenance_type: {},
      effectiveness_distribution: {
        excellent: 0, // >80%
        good: 0,     // 60-80%
        fair: 0,     // 40-60%
        poor: 0      // <40%
      }
    };

    if (validResults.length === 0) return effectiveness;

    validResults.forEach(result => {
      const score = result.effectiveness_score || 0;
      effectiveness.overall_score += score;

      // Categorize by maintenance type
      const type = result.maintenance.service_type;
      if (!effectiveness.by_maintenance_type[type]) {
        effectiveness.by_maintenance_type[type] = {
          total_score: 0,
          count: 0,
          average_score: 0
        };
      }

      effectiveness.by_maintenance_type[type].total_score += score;
      effectiveness.by_maintenance_type[type].count++;

      // Distribution
      if (score >= 80) effectiveness.effectiveness_distribution.excellent++;
      else if (score >= 60) effectiveness.effectiveness_distribution.good++;
      else if (score >= 40) effectiveness.effectiveness_distribution.fair++;
      else effectiveness.effectiveness_distribution.poor++;
    });

    effectiveness.overall_score /= validResults.length;

    // Calculate averages by type
    Object.keys(effectiveness.by_maintenance_type).forEach(type => {
      const data = effectiveness.by_maintenance_type[type];
      data.average_score = data.total_score / data.count;
    });

    return effectiveness;
  }

  /**
   * Perform cost-benefit analysis across all maintenance
   * @param {Array} impactResults - Impact results
   * @returns {Object} Cost-benefit analysis
   */
  performCostBenefitAnalysis(impactResults) {
    const validResults = impactResults.filter(r => r.impact_found && r.cost_benefit);

    const analysis = {
      total_investment: 0,
      total_annual_benefit: 0,
      average_roi: 0,
      best_performing_maintenance: null,
      worst_performing_maintenance: null,
      payback_analysis: {}
    };

    if (validResults.length === 0) return analysis;

    let bestROI = -Infinity;
    let worstROI = Infinity;

    validResults.forEach(result => {
      const cb = result.cost_benefit;
      analysis.total_investment += cb.maintenance_cost;
      analysis.total_annual_benefit += cb.annual_benefit;

      const roi = cb.benefit_cost_ratio;
      if (roi > bestROI) {
        bestROI = roi;
        analysis.best_performing_maintenance = result.maintenance.service_type;
      }
      if (roi < worstROI) {
        worstROI = roi;
        analysis.worst_performing_maintenance = result.maintenance.service_type;
      }
    });

    analysis.average_roi = analysis.total_investment > 0 ?
      analysis.total_annual_benefit / analysis.total_investment : 0;

    return analysis;
  }

  /**
   * Analyze performance trends around maintenance events
   * @param {Array} performanceData - Performance data
   * @param {Array} maintenanceEvents - Maintenance events
   * @returns {Object} Performance trends
   */
  analyzePerformanceTrends(performanceData, maintenanceEvents) {
    const trends = {
      fuel_efficiency_trend: [],
      engine_performance_trend: [],
      overall_health_trend: []
    };

    maintenanceEvents.forEach(maintenance => {
      const maintenanceDate = new Date(maintenance.date_performed);
      const beforePeriod = 7; // 7 days before
      const afterPeriod = 30; // 30 days after

      // Analyze fuel efficiency trend
      const fuelTrend = this.analyzeMetricTrend(
        performanceData,
        maintenanceDate,
        beforePeriod,
        afterPeriod,
        ['instant_mpg', 'average_mpg']
      );
      trends.fuel_efficiency_trend.push({
        maintenance: maintenance.service_type,
        date: maintenanceDate.toISOString(),
        trend: fuelTrend
      });

      // Analyze engine performance trend
      const engineTrend = this.analyzeMetricTrend(
        performanceData,
        maintenanceDate,
        beforePeriod,
        afterPeriod,
        ['rpm', 'engine_load', 'throttle_pos']
      );
      trends.engine_performance_trend.push({
        maintenance: maintenance.service_type,
        date: maintenanceDate.toISOString(),
        trend: engineTrend
      });
    });

    return trends;
  }

  /**
   * Analyze trend for specific metrics around maintenance date
   * @param {Array} performanceData - Performance data
   * @param {Date} maintenanceDate - Maintenance date
   * @param {number} beforePeriod - Days before maintenance
   * @param {number} afterPeriod - Days after maintenance
   * @param {Array} metrics - Metrics to analyze
   * @returns {Object} Trend analysis
   */
  analyzeMetricTrend(performanceData, maintenanceDate, beforePeriod, afterPeriod, metrics) {
    const beforeData = performanceData.filter(d => {
      const date = new Date(d.timestamp);
      return date >= new Date(maintenanceDate.getTime() - (beforePeriod * 24 * 60 * 60 * 1000)) &&
             date < maintenanceDate;
    });

    const afterData = performanceData.filter(d => {
      const date = new Date(d.timestamp);
      return date > maintenanceDate &&
             date <= new Date(maintenanceDate.getTime() + (afterPeriod * 24 * 60 * 60 * 1000));
    });

    const beforeAvg = this.calculateAverage(beforeData, metrics);
    const afterAvg = this.calculateAverage(afterData, metrics);

    const improvement = beforeAvg > 0 ? ((afterAvg - beforeAvg) / beforeAvg) * 100 : 0;

    return {
      before_average: beforeAvg,
      after_average: afterAvg,
      improvement_percentage: improvement,
      data_points_before: beforeData.length,
      data_points_after: afterData.length
    };
  }

  /**
   * Generate maintenance recommendations based on analysis
   * @param {Object} analysis - Complete analysis
   * @returns {Array} Recommendations
   */
  generateMaintenanceRecommendations(analysis) {
    const recommendations = [];

    // Based on effectiveness
    if (analysis.maintenance_effectiveness) {
      const effectiveness = analysis.maintenance_effectiveness;

      if (effectiveness.overall_score < 50) {
        recommendations.push({
          type: 'effectiveness',
          priority: 'high',
          title: 'Improve Maintenance Quality',
          description: 'Overall maintenance effectiveness is below average. Consider using certified technicians or OEM parts.',
          impact: 'high'
        });
      }

      // Type-specific recommendations
      Object.entries(effectiveness.by_maintenance_type).forEach(([type, data]) => {
        if (data.average_score < 60) {
          recommendations.push({
            type: 'service_specific',
            priority: 'medium',
            title: `Review ${type} Procedures`,
            description: `${type} maintenance shows below-average effectiveness. Consider alternative service providers or methods.`,
            impact: 'medium'
          });
        }
      });
    }

    // Based on cost-benefit
    if (analysis.cost_benefit_analysis) {
      const cb = analysis.cost_benefit_analysis;

      if (cb.average_roi < 2) {
        recommendations.push({
          type: 'cost_benefit',
          priority: 'medium',
          title: 'Optimize Maintenance Schedule',
          description: 'Some maintenance activities show poor return on investment. Consider prioritizing high-impact services.',
          impact: 'medium'
        });
      }

      if (cb.best_performing_maintenance) {
        recommendations.push({
          type: 'optimization',
          priority: 'low',
          title: `Focus on ${cb.best_performing_maintenance}`,
          description: `${cb.best_performing_maintenance} shows excellent cost-benefit ratio. Prioritize this type of maintenance.`,
          impact: 'low'
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate analysis period
   * @param {Array} maintenanceEvents - Maintenance events
   * @returns {Object} Analysis period
   */
  calculateAnalysisPeriod(maintenanceEvents) {
    if (maintenanceEvents.length === 0) return null;

    const dates = maintenanceEvents.map(m => new Date(m.date_performed));
    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));

    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      duration_days: Math.round((endDate - startDate) / (1000 * 60 * 60 * 24))
    };
  }

  /**
   * Get maintenance impact prediction for upcoming service
   * @param {string} maintenanceType - Type of maintenance
   * @param {number} currentEfficiency - Current efficiency metrics
   * @returns {Object} Impact prediction
   */
  predictMaintenanceImpact(maintenanceType, currentEfficiency) {
    const impactFactors = this.maintenanceImpactFactors[maintenanceType.toLowerCase().replace(/\s+/g, '_')];

    if (!impactFactors) {
      return {
        prediction_available: false,
        reason: 'No impact data available for this maintenance type'
      };
    }

    const prediction = {
      prediction_available: true,
      maintenance_type: maintenanceType,
      expected_improvements: {},
      cost_benefit_projection: {},
      confidence_level: 'medium'
    };

    // Expected improvements
    Object.entries(impactFactors.performance_impact).forEach(([metric, impact]) => {
      const currentValue = currentEfficiency[metric] || 0;
      const expectedValue = currentValue * (1 + impact);

      prediction.expected_improvements[metric] = {
        current: currentValue,
        expected: expectedValue,
        improvement: impact,
        improvement_percentage: impact * 100
      };
    });

    // Cost-benefit projection
    prediction.cost_benefit_projection = {
      typical_cost_range: this.getTypicalCostRange(maintenanceType),
      expected_annual_savings: this.calculateExpectedSavings(prediction.expected_improvements),
      payback_period_months: 0, // Would be calculated based on actual cost
      roi_percentage: impactFactors.cost_benefit_ratio * 100
    };

    return prediction;
  }

  /**
   * Get typical cost range for maintenance type
   * @param {string} maintenanceType - Type of maintenance
   * @returns {Object} Cost range
   */
  getTypicalCostRange(maintenanceType) {
    const costRanges = {
      oil_change: { min: 30, max: 80 },
      air_filter_replacement: { min: 20, max: 50 },
      fuel_filter_replacement: { min: 50, max: 150 },
      spark_plug_replacement: { min: 100, max: 300 },
      brake_pad_replacement: { min: 100, max: 250 },
      tire_replacement: { min: 500, max: 1000 }
    };

    const key = maintenanceType.toLowerCase().replace(/\s+/g, '_');
    return costRanges[key] || { min: 50, max: 200 };
  }

  /**
   * Calculate expected annual savings
   * @param {Object} improvements - Expected improvements
   * @returns {number} Annual savings
   */
  calculateExpectedSavings(improvements) {
    const fuelImprovement = improvements.fuel_efficiency?.improvement || 0;
    const annualMiles = 12000;
    const baselineMPG = 25;
    const fuelPricePerGallon = 3.50;

    const annualFuelSavings = (annualMiles / baselineMPG) * fuelImprovement * fuelPricePerGallon;
    return Math.max(0, annualFuelSavings);
  }
}

module.exports = MaintenancePerformanceAnalyzer;