class AIOptimizationUtils {
  constructor() {
    this.performanceMetrics = {};
    this.accuracyMetrics = {};
    this.optimizationStrategies = this.initializeOptimizationStrategies();
  }

  /**
   * Initialize optimization strategies
   * @returns {Object} Optimization strategies
   */
  initializeOptimizationStrategies() {
    return {
      dataOptimization: {
        outlierRemoval: {
          method: 'iqr',
          multiplier: 1.5,
          description: 'Remove outliers using IQR method'
        },
        normalization: {
          method: 'zscore',
          description: 'Z-score normalization for better convergence'
        },
        featureSelection: {
          method: 'correlation',
          threshold: 0.8,
          description: 'Remove highly correlated features'
        }
      },
      modelOptimization: {
        hyperparameterTuning: {
          learningRate: [0.001, 0.01, 0.1],
          batchSize: [16, 32, 64],
          epochs: [50, 100, 200]
        },
        regularization: {
          l1: 0.01,
          l2: 0.01,
          dropout: 0.2
        },
        earlyStopping: {
          patience: 10,
          minDelta: 0.001
        }
      },
      computationalOptimization: {
        caching: {
          enabled: true,
          maxSize: 1000,
          ttl: 3600000 // 1 hour
        },
        batching: {
          enabled: true,
          maxBatchSize: 100
        },
        parallelization: {
          enabled: true,
          maxWorkers: 4
        }
      }
    };
  }

  /**
   * Optimize dataset for better model performance
   * @param {Array} data - Raw dataset
   * @param {Object} options - Optimization options
   * @returns {Object} Optimized dataset
   */
  optimizeDataset(data, options = {}) {
    const {
      removeOutliers = true,
      normalize = true,
      selectFeatures = true,
      balanceClasses = false
    } = options;

    let optimizedData = [...data];
    const optimizationLog = [];

    // Remove outliers
    if (removeOutliers) {
      const beforeCount = optimizedData.length;
      optimizedData = this.removeOutliers(optimizedData);
      const afterCount = optimizedData.length;
      optimizationLog.push(`Removed ${beforeCount - afterCount} outliers`);
    }

    // Normalize features
    if (normalize) {
      optimizedData = this.normalizeDataset(optimizedData);
      optimizationLog.push('Applied feature normalization');
    }

    // Feature selection
    if (selectFeatures) {
      const featureSelection = this.selectFeatures(optimizedData);
      optimizedData = featureSelection.data;
      optimizationLog.push(`Selected ${featureSelection.selectedFeatures.length} features`);
    }

    // Balance classes if needed
    if (balanceClasses) {
      optimizedData = this.balanceClasses(optimizedData);
      optimizationLog.push('Applied class balancing');
    }

    return {
      data: optimizedData,
      optimizationLog,
      statistics: this.calculateDatasetStatistics(optimizedData)
    };
  }

  /**
   * Remove outliers using IQR method
   * @param {Array} data - Dataset
   * @returns {Array} Dataset without outliers
   */
  removeOutliers(data) {
    if (!data || data.length === 0) return data;

    const numericalKeys = Object.keys(data[0]).filter(key =>
      typeof data[0][key] === 'number' && !isNaN(data[0][key])
    );

    return data.filter(point => {
      let isOutlier = false;

      numericalKeys.forEach(key => {
        const values = data.map(d => d[key]).filter(v => !isNaN(v)).sort((a, b) => a - b);
        if (values.length < 4) return; // Need at least 4 values for IQR

        const q1 = this.percentile(values, 25);
        const q3 = this.percentile(values, 75);
        const iqr = q3 - q1;
        const lowerBound = q1 - (this.optimizationStrategies.dataOptimization.outlierRemoval.multiplier * iqr);
        const upperBound = q3 + (this.optimizationStrategies.dataOptimization.outlierRemoval.multiplier * iqr);

        if (point[key] < lowerBound || point[key] > upperBound) {
          isOutlier = true;
        }
      });

      return !isOutlier;
    });
  }

  /**
   * Normalize dataset features
   * @param {Array} data - Dataset
   * @returns {Array} Normalized dataset
   */
  normalizeDataset(data) {
    if (!data || data.length === 0) return data;

    const numericalKeys = Object.keys(data[0]).filter(key =>
      typeof data[0][key] === 'number' && !isNaN(data[0][key])
    );

    const normalizedData = [...data];

    numericalKeys.forEach(key => {
      const values = data.map(d => d[key]).filter(v => !isNaN(v));
      if (values.length === 0) return;

      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

      normalizedData.forEach(point => {
        if (typeof point[key] === 'number' && !isNaN(point[key]) && std > 0) {
          point[key] = (point[key] - mean) / std;
        }
      });
    });

    return normalizedData;
  }

  /**
   * Select features based on correlation analysis
   * @param {Array} data - Dataset
   * @returns {Object} Feature selection results
   */
  selectFeatures(data) {
    if (!data || data.length === 0) return { data, selectedFeatures: [] };

    const numericalKeys = Object.keys(data[0]).filter(key =>
      typeof data[0][key] === 'number' && !isNaN(data[0][key])
    );

    // Calculate correlation matrix
    const correlationMatrix = {};
    numericalKeys.forEach(key1 => {
      correlationMatrix[key1] = {};
      numericalKeys.forEach(key2 => {
        correlationMatrix[key1][key2] = this.calculateCorrelation(
          data.map(d => d[key1]).filter(v => !isNaN(v)),
          data.map(d => d[key2]).filter(v => !isNaN(v))
        );
      });
    });

    // Remove highly correlated features
    const selectedFeatures = [...numericalKeys];
    const threshold = this.optimizationStrategies.dataOptimization.featureSelection.threshold;

    for (let i = 0; i < selectedFeatures.length; i++) {
      for (let j = i + 1; j < selectedFeatures.length; j++) {
        const feature1 = selectedFeatures[i];
        const feature2 = selectedFeatures[j];

        if (Math.abs(correlationMatrix[feature1][feature2]) > threshold) {
          // Remove the feature with higher correlation to others
          const corr1 = this.calculateAverageCorrelation(correlationMatrix, feature1, selectedFeatures);
          const corr2 = this.calculateAverageCorrelation(correlationMatrix, feature2, selectedFeatures);

          if (corr1 > corr2) {
            selectedFeatures.splice(i, 1);
            i--; // Adjust index
            break;
          } else {
            selectedFeatures.splice(j, 1);
            j--; // Adjust index
          }
        }
      }
    }

    return {
      data: data,
      selectedFeatures: selectedFeatures,
      correlationMatrix: correlationMatrix
    };
  }

  /**
   * Balance classes in dataset
   * @param {Array} data - Dataset
   * @param {string} targetColumn - Target column name
   * @returns {Array} Balanced dataset
   */
  balanceClasses(data, targetColumn = 'fault_scenario') {
    if (!data || data.length === 0) return data;

    // Count class distribution
    const classCounts = {};
    data.forEach(point => {
      const classValue = point[targetColumn];
      classCounts[classValue] = (classCounts[classValue] || 0) + 1;
    });

    const maxCount = Math.max(...Object.values(classCounts));
    const balancedData = [];

    // Oversample minority classes
    Object.keys(classCounts).forEach(classValue => {
      const classData = data.filter(point => point[targetColumn] === classValue);
      const currentCount = classCounts[classValue];

      if (currentCount < maxCount) {
        // Oversample by duplicating existing samples
        const oversampleRatio = Math.floor(maxCount / currentCount);
        const remainder = maxCount % currentCount;

        for (let i = 0; i < oversampleRatio; i++) {
          balancedData.push(...classData);
        }

        // Add remainder samples
        for (let i = 0; i < remainder; i++) {
          balancedData.push(classData[i % classData.length]);
        }
      } else {
        balancedData.push(...classData);
      }
    });

    return balancedData;
  }

  /**
   * Calculate correlation between two arrays
   * @param {Array} x - First array
   * @param {Array} y - Second array
   * @returns {number} Correlation coefficient
   */
  calculateCorrelation(x, y) {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumX2 = x.reduce((sum, val) => sum + val * val, 0);
    const sumY2 = y.reduce((sum, val) => sum + val * val, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate average correlation for a feature
   * @param {Object} correlationMatrix - Correlation matrix
   * @param {string} feature - Feature name
   * @param {Array} allFeatures - All features
   * @returns {number} Average correlation
   */
  calculateAverageCorrelation(correlationMatrix, feature, allFeatures) {
    let totalCorrelation = 0;
    let count = 0;

    allFeatures.forEach(otherFeature => {
      if (otherFeature !== feature) {
        totalCorrelation += Math.abs(correlationMatrix[feature][otherFeature] || 0);
        count++;
      }
    });

    return count > 0 ? totalCorrelation / count : 0;
  }

  /**
   * Calculate percentile of an array
   * @param {Array} arr - Sorted array
   * @param {number} p - Percentile (0-100)
   * @returns {number} Percentile value
   */
  percentile(arr, p) {
    if (arr.length === 0) return 0;
    if (p <= 0) return arr[0];
    if (p >= 100) return arr[arr.length - 1];

    const sorted = [...arr].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);

    if (lower === upper) return sorted[lower];

    return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
  }

  /**
   * Calculate dataset statistics
   * @param {Array} data - Dataset
   * @returns {Object} Dataset statistics
   */
  calculateDatasetStatistics(data) {
    if (!data || data.length === 0) return {};

    const numericalKeys = Object.keys(data[0]).filter(key =>
      typeof data[0][key] === 'number' && !isNaN(data[0][key])
    );

    const statistics = {
      count: data.length,
      features: numericalKeys.length,
      featureStats: {}
    };

    numericalKeys.forEach(key => {
      const values = data.map(d => d[key]).filter(v => !isNaN(v));
      if (values.length > 0) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const std = Math.sqrt(variance);

        statistics.featureStats[key] = {
          mean: Math.round(mean * 1000) / 1000,
          std: Math.round(std * 1000) / 1000,
          min: Math.min(...values),
          max: Math.max(...values),
          missing: data.length - values.length
        };
      }
    });

    return statistics;
  }

  /**
   * Optimize model hyperparameters using grid search
   * @param {Object} model - ML model
   * @param {Array} trainData - Training data
   * @param {Array} validationData - Validation data
   * @param {Object} paramGrid - Parameter grid
   * @returns {Object} Best parameters and performance
   */
  async optimizeHyperparameters(model, trainData, validationData, paramGrid) {
    const results = [];
    const paramCombinations = this.generateParameterCombinations(paramGrid);

    for (const params of paramCombinations) {
      try {
        // Train model with current parameters
        const startTime = Date.now();
        const history = await model.train(trainData, validationData, params);
        const trainingTime = Date.now() - startTime;

        // Evaluate performance
        const performance = this.evaluateModelPerformance(model, validationData);

        results.push({
          parameters: params,
          performance: performance,
          trainingTime: trainingTime,
          history: history
        });

      } catch (error) {
        console.error('Error training with parameters:', params, error);
        results.push({
          parameters: params,
          error: error.message,
          performance: { accuracy: 0, loss: Infinity }
        });
      }
    }

    // Find best parameters
    const bestResult = results.reduce((best, current) => {
      if (!best || current.performance.accuracy > best.performance.accuracy) {
        return current;
      }
      return best;
    });

    return {
      bestParameters: bestResult.parameters,
      bestPerformance: bestResult.performance,
      allResults: results,
      optimizationTime: results.reduce((sum, r) => sum + (r.trainingTime || 0), 0)
    };
  }

  /**
   * Generate all combinations of parameters
   * @param {Object} paramGrid - Parameter grid
   * @returns {Array} Parameter combinations
   */
  generateParameterCombinations(paramGrid) {
    const keys = Object.keys(paramGrid);
    const combinations = [];

    function generate(current, index) {
      if (index === keys.length) {
        combinations.push({ ...current });
        return;
      }

      const key = keys[index];
      const values = paramGrid[key];

      for (const value of values) {
        current[key] = value;
        generate(current, index + 1);
      }
    }

    generate({}, 0);
    return combinations;
  }

  /**
   * Evaluate model performance
   * @param {Object} model - Trained model
   * @param {Array} testData - Test data
   * @returns {Object} Performance metrics
   */
  evaluateModelPerformance(model, testData) {
    // This is a placeholder - actual implementation would depend on the specific model type
    return {
      accuracy: Math.random() * 0.3 + 0.7, // Mock accuracy between 0.7-1.0
      precision: Math.random() * 0.2 + 0.8,
      recall: Math.random() * 0.2 + 0.8,
      f1Score: Math.random() * 0.2 + 0.8,
      loss: Math.random() * 0.5
    };
  }

  /**
   * Monitor and log performance metrics
   * @param {string} operation - Operation name
   * @param {number} startTime - Start time
   * @param {Object} metrics - Performance metrics
   */
  logPerformanceMetrics(operation, startTime, metrics) {
    const duration = Date.now() - startTime;

    this.performanceMetrics[operation] = this.performanceMetrics[operation] || [];
    this.performanceMetrics[operation].push({
      timestamp: new Date().toISOString(),
      duration: duration,
      ...metrics
    });

    // Keep only last 100 entries
    if (this.performanceMetrics[operation].length > 100) {
      this.performanceMetrics[operation] = this.performanceMetrics[operation].slice(-100);
    }

    console.log(`Performance [${operation}]: ${duration}ms`, metrics);
  }

  /**
   * Get performance statistics
   * @param {string} operation - Operation name
   * @returns {Object} Performance statistics
   */
  getPerformanceStatistics(operation = null) {
    if (operation) {
      const metrics = this.performanceMetrics[operation] || [];
      if (metrics.length === 0) return null;

      const durations = metrics.map(m => m.duration);
      const avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;

      return {
        operation: operation,
        count: metrics.length,
        averageDuration: Math.round(avgDuration),
        minDuration: Math.min(...durations),
        maxDuration: Math.max(...durations),
        lastExecution: metrics[metrics.length - 1]
      };
    }

    // Return all operations
    const statistics = {};
    Object.keys(this.performanceMetrics).forEach(op => {
      statistics[op] = this.getPerformanceStatistics(op);
    });

    return statistics;
  }

  /**
   * Optimize memory usage for large datasets
   * @param {Array} data - Large dataset
   * @param {Object} options - Optimization options
   * @returns {Object} Memory-optimized data structure
   */
  optimizeMemoryUsage(data, options = {}) {
    const {
      chunkSize = 1000,
      compression = false,
      sparseRepresentation = false
    } = options;

    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    return {
      chunks: chunks,
      totalSize: data.length,
      chunkSize: chunkSize,
      compressionEnabled: compression,
      sparseEnabled: sparseRepresentation,
      memorySavings: this.calculateMemorySavings(data, chunks)
    };
  }

  /**
   * Calculate memory savings from optimization
   * @param {Array} original - Original data
   * @param {Array} chunks - Chunked data
   * @returns {number} Memory savings percentage
   */
  calculateMemorySavings(original, chunks) {
    // Rough estimation based on chunking overhead
    const originalSize = JSON.stringify(original).length;
    const chunkedSize = chunks.reduce((sum, chunk) => sum + JSON.stringify(chunk).length, 0);
    const overhead = chunks.length * 100; // Estimated overhead per chunk

    return Math.max(0, ((originalSize - (chunkedSize + overhead)) / originalSize) * 100);
  }

  /**
   * Create performance optimization recommendations
   * @param {Object} performanceStats - Current performance statistics
   * @returns {Array} Optimization recommendations
   */
  createOptimizationRecommendations(performanceStats) {
    const recommendations = [];

    // Analyze performance bottlenecks
    Object.entries(performanceStats).forEach(([operation, stats]) => {
      if (stats.averageDuration > 1000) { // Operations taking more than 1 second
        recommendations.push({
          type: 'performance',
          operation: operation,
          issue: 'Slow operation detected',
          recommendation: 'Consider implementing caching or optimization',
          potentialImprovement: '50-80% faster execution',
          priority: 'high'
        });
      }

      if (stats.count > 50 && stats.averageDuration > 100) {
        recommendations.push({
          type: 'caching',
          operation: operation,
          issue: 'Frequently called operation',
          recommendation: 'Implement result caching',
          potentialImprovement: '60-90% faster for repeated calls',
          priority: 'medium'
        });
      }
    });

    // Data optimization recommendations
    recommendations.push({
      type: 'data',
      issue: 'Dataset optimization',
      recommendation: 'Apply outlier removal and feature selection',
      potentialImprovement: '10-30% better model accuracy',
      priority: 'medium'
    });

    // Model optimization recommendations
    recommendations.push({
      type: 'model',
      issue: 'Hyperparameter optimization',
      recommendation: 'Perform grid search for optimal parameters',
      potentialImprovement: '5-20% better model performance',
      priority: 'low'
    });

    return recommendations;
  }
}

module.exports = AIOptimizationUtils;